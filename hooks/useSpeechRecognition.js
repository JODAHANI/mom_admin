import { useCallback, useEffect, useRef, useState } from 'react';

function isNative() {
  try {
    return window?.Capacitor?.isNativePlatform?.() === true;
  } catch { return false; }
}

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function mergeText(prev, curr) {
  const p = (prev || '').trim();
  const c = (curr || '').trim();
  if (!p) return c;
  if (!c) return p;
  if (p === c) return p;
  if (c.includes(p)) return c;
  if (p.includes(c)) return p;
  const maxLen = Math.min(p.length, c.length, 200);
  for (let len = maxLen; len > 0; len--) {
    if (p.endsWith(c.slice(0, len))) {
      return p + c.slice(len);
    }
  }
  return `${p} ${c}`;
}

// 인식 중 시스템 beep(시작/종료음)을 죽이기 위한 음소거 헬퍼
let audioMutePlugin = null;
async function getAudioMute() {
  if (audioMutePlugin) return audioMutePlugin;
  try {
    const { registerPlugin } = await import('@capacitor/core');
    audioMutePlugin = registerPlugin('AudioMute');
  } catch {}
  return audioMutePlugin;
}
async function muteBeep() {
  try { (await getAudioMute())?.mute(); } catch {}
}
async function unmuteBeep() {
  try { (await getAudioMute())?.unmute(); } catch {}
}

// --- Native Capacitor 구현 ---
// 네이티브 안드로이드 인식기는 짧은 일시정지에도 발화가 끝났다고 보고 멈춘다.
// 사용자가 정지하지 않았고 침묵 타임아웃 전이면 인식기를 재시작해 여러 세션을 누적한다.
function useNativeSpeech({ lang, silenceTimeoutMs }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const pluginRef = useRef(null);
  const partialRef = useRef(null);
  const stateRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const finalRef = useRef('');        // 종료된 세션들까지 누적된 텍스트
  const curPartialRef = useRef('');   // 현재 세션의 최신 partial
  const userStoppedRef = useRef(false);
  const finalizedRef = useRef(true);
  const sessionGotResultRef = useRef(false); // 현재 세션에서 인식 결과를 받았는지

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const removeListeners = useCallback(async () => {
    if (partialRef.current) {
      try { await partialRef.current.remove(); } catch {}
      partialRef.current = null;
    }
    if (stateRef.current) {
      try { await stateRef.current.remove(); } catch {}
      stateRef.current = null;
    }
  }, []);

  // 현재 세션 partial을 누적 텍스트로 commit
  const commitCurrent = useCallback(() => {
    if (curPartialRef.current) {
      finalRef.current = mergeText(finalRef.current, curPartialRef.current);
      curPartialRef.current = '';
      setTranscript(finalRef.current);
    }
    setInterim('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        pluginRef.current = SpeechRecognition;
        const { available } = await SpeechRecognition.available();
        if (!cancelled) setSupported(!!available);
      } catch {
        if (!cancelled) setSupported(false);
      }
    })();
    return () => {
      cancelled = true;
      clearSilenceTimer();
      const SR = pluginRef.current;
      if (SR) { try { SR.stop(); } catch {} }
      removeListeners();
      unmuteBeep();
    };
  }, [removeListeners]);

  // 완전 종료 (UI 즉시 반영, 멱등)
  const finalize = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    clearSilenceTimer();
    commitCurrent();
    setListening(false);
    removeListeners();
    unmuteBeep();
  }, [commitCurrent, removeListeners]);

  // 네이티브가 일시정지로 끊었을 때: 세션 commit 후 재시작
  const restart = useCallback(() => {
    commitCurrent();
    if (userStoppedRef.current || finalizedRef.current) { finalize(); return; }
    setTimeout(async () => {
      if (userStoppedRef.current || finalizedRef.current) return;
      const SR = pluginRef.current;
      if (!SR) return;
      sessionGotResultRef.current = false;
      try {
        await SR.start({ language: lang, partialResults: true, popup: false });
      } catch {
        finalize();
      }
    }, 250);
  }, [commitCurrent, finalize, lang]);

  const stop = useCallback(async () => {
    userStoppedRef.current = true;
    finalize();
    const SR = pluginRef.current;
    if (SR) { try { await SR.stop(); } catch {} }
  }, [finalize]);

  const start = useCallback(async () => {
    const SR = pluginRef.current;
    if (!SR) return;
    finalRef.current = '';
    curPartialRef.current = '';
    sessionGotResultRef.current = false;
    setTranscript('');
    setInterim('');
    setError(null);
    userStoppedRef.current = false;

    try {
      let perm = await SR.checkPermissions();
      if (perm?.speechRecognition !== 'granted') {
        perm = await SR.requestPermissions();
      }
      if (perm?.speechRecognition !== 'granted') {
        setError('not-allowed');
        return;
      }
    } catch {
      setError('not-allowed');
      return;
    }

    await removeListeners();
    finalizedRef.current = false;
    muteBeep();

    const armSilence = () => {
      clearSilenceTimer();
      if (silenceTimeoutMs > 0) {
        silenceTimerRef.current = setTimeout(() => { stop(); }, silenceTimeoutMs);
      }
    };

    partialRef.current = await SR.addListener('partialResults', (data) => {
      const best = data?.matches?.[0];
      if (best) {
        curPartialRef.current = best;
        sessionGotResultRef.current = true;
        // 누적분과 합쳐 한 줄로만 표시 (삼성 인식기는 재시작 후에도 누적 반환 → 중복 방지)
        setTranscript(mergeText(finalRef.current, best));
        // 침묵 타이머는 "첫 인식 결과 이후"에만 — 시작 직후엔 안 검 (말 시작 전 조기 종료 방지)
        armSilence();
      }
    });

    stateRef.current = await SR.addListener('listeningState', (data) => {
      if (data?.status !== 'stopped') return;
      if (userStoppedRef.current || finalizedRef.current) { finalize(); return; }
      // 결과를 받은 세션이면 이어 말할 수 있게 재시작, 빈 세션이면 종료(무한 재시작 방지)
      if (sessionGotResultRef.current) restart();
      else finalize();
    });

    try {
      await SR.start({ language: lang, partialResults: true, popup: false });
      setListening(true);
    } catch (e) {
      setError(e?.message || 'start_failed');
      finalize();
    }
  }, [lang, silenceTimeoutMs, removeListeners, finalize, restart, stop]);

  const reset = useCallback(() => {
    finalRef.current = '';
    curPartialRef.current = '';
    setTranscript('');
    setInterim('');
    setError(null);
    clearSilenceTimer();
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset };
}

// --- Web Speech API 구현 ---
function useWebSpeech({ lang, continuous, interimResults, silenceTimeoutMs }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalRef = useRef('');
  const sessionFinalRef = useRef('');
  const silenceTimerRef = useRef(null);
  const userStoppedRef = useRef(false);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const armSilenceTimer = () => {
    clearSilenceTimer();
    if (!silenceTimeoutMs || silenceTimeoutMs <= 0) return;
    silenceTimerRef.current = setTimeout(() => {
      const r = recognitionRef.current;
      if (!r) return;
      userStoppedRef.current = true;
      try { r.stop(); } catch (_) {}
    }, silenceTimeoutMs);
  };

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const r = new Ctor();
    r.lang = lang;
    r.continuous = continuous;
    r.interimResults = interimResults;

    r.onresult = (event) => {
      let sessionFinal = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript;
        if (res.isFinal) {
          sessionFinal = mergeText(sessionFinal, text);
        } else {
          interimText += text;
        }
      }
      sessionFinalRef.current = sessionFinal;
      setTranscript(mergeText(finalRef.current, sessionFinal));
      setInterim(interimText);
      armSilenceTimer();
    };

    r.onspeechstart = () => {
      armSilenceTimer();
    };

    r.onerror = (event) => {
      const err = event.error || 'unknown';
      setError(err);
      if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
        userStoppedRef.current = true;
        setListening(false);
        clearSilenceTimer();
      }
    };

    r.onend = () => {
      setInterim('');
      clearSilenceTimer();
      finalRef.current = mergeText(finalRef.current, sessionFinalRef.current);
      sessionFinalRef.current = '';
      setTranscript(finalRef.current);
      if (!userStoppedRef.current) {
        setTimeout(() => {
          if (userStoppedRef.current) return;
          const cur = recognitionRef.current;
          if (!cur) return;
          try {
            cur.start();
            armSilenceTimer();
          } catch (_) {
            setListening(false);
          }
        }, 100);
        return;
      }
      setListening(false);
    };

    recognitionRef.current = r;
    return () => {
      clearSilenceTimer();
      try { r.stop(); } catch (_) {}
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, continuous, interimResults, silenceTimeoutMs]);

  const start = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    finalRef.current = '';
    sessionFinalRef.current = '';
    setTranscript('');
    setInterim('');
    setError(null);
    userStoppedRef.current = false;
    try {
      r.start();
      setListening(true);
      armSilenceTimer();
    } catch (e) {
      setError(e.message || 'start_failed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    userStoppedRef.current = true;
    clearSilenceTimer();
    try { r.stop(); } catch (_) {}
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    sessionFinalRef.current = '';
    setTranscript('');
    setInterim('');
    setError(null);
    clearSilenceTimer();
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset };
}

export function useSpeechRecognition({
  lang = 'ko-KR',
  continuous = true,
  interimResults = true,
  silenceTimeoutMs = 2000,
} = {}) {
  const native = useNativeSpeech({ lang, silenceTimeoutMs });
  const web = useWebSpeech({ lang, continuous, interimResults, silenceTimeoutMs });

  if (isNative()) return native;
  return web;
}
