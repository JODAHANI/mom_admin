import { useCallback, useEffect, useRef, useState } from 'react';

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// 이전 세션의 텍스트(prev)와 현재 세션 텍스트(curr)를 중복 없이 머지.
// 삼성 인터넷 등에서 세션 재시작 시 누적 텍스트를 그대로 다시 emit하는 케이스를 처리.
function mergeText(prev, curr) {
  const p = (prev || '').trim();
  const c = (curr || '').trim();
  if (!p) return c;
  if (!c) return p;
  if (p === c) return p;
  // curr이 prev 전체를 포함 → 더 긴 curr 사용
  if (c.includes(p)) return c;
  // prev가 curr 전체를 포함 → 더 긴 prev 유지
  if (p.includes(c)) return p;
  // suffix-prefix 겹침: prev 끝과 curr 시작이 겹치면 한 번만 사용
  const maxLen = Math.min(p.length, c.length, 200);
  for (let len = maxLen; len > 0; len--) {
    if (p.endsWith(c.slice(0, len))) {
      return p + c.slice(len);
    }
  }
  return `${p} ${c}`;
}

export function useSpeechRecognition({
  lang = 'ko-KR',
  continuous = true,
  interimResults = true,
  silenceTimeoutMs = 2000,
} = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalRef = useRef('');           // 이전 세션들까지 commit된 최종 텍스트
  const sessionFinalRef = useRef('');    // 현재 세션의 누적 final 텍스트 (commit 전)
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
      // 이번 세션의 모든 final 결과를 mergeText로 중복 제거하며 누적
      // (resultIndex 무시 — 삼성 등에서 0으로 고정되는 케이스 대응)
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
      // 회복 불가능한 에러는 사용자 중단으로 처리
      if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
        userStoppedRef.current = true;
        setListening(false);
        clearSilenceTimer();
      }
      // 그 외('no-speech', 'aborted', 'network' 등)는 onend의 재시작 로직에 위임
    };

    r.onend = () => {
      setInterim('');
      clearSilenceTimer();
      // 현재 세션의 final 텍스트를 finalRef로 commit (중복 머지)
      finalRef.current = mergeText(finalRef.current, sessionFinalRef.current);
      sessionFinalRef.current = '';
      setTranscript(finalRef.current);
      // 사용자가 명시적으로 멈추지 않았다면, 브라우저(삼성 등)가 임의로 끊은 것이므로 재시작
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
