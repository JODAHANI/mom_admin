import { useCallback, useEffect, useRef, useState } from 'react';

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
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
  const finalRef = useRef('');
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
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript;
        if (res.isFinal) {
          finalRef.current = (finalRef.current + ' ' + text).trim();
        } else {
          interimText += text;
        }
      }
      setTranscript(finalRef.current);
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
    setTranscript('');
    setInterim('');
    setError(null);
    clearSilenceTimer();
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset };
}
