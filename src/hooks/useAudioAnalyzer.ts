import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioAnalyzer(file: File | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number>(0);

  // Store feature data
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!file) return;

    // Create a new Audio element pointing to the file
    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';
    audioElRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    // Cleanup
    return () => {
      URL.revokeObjectURL(audioUrl);
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = '';
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [file]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current && audioElRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioElRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioElRef.current) return;

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioElRef.current.pause();
      setIsPlaying(false);
    } else {
      initAudio();
      audioElRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, initAudio]);

  const getFrequencyData = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
      return dataArrayRef.current;
    }
    return null;
  }, []);

  return {
    isPlaying,
    duration,
    currentTime,
    togglePlay,
    getFrequencyData,
    getAudioElement: () => audioElRef.current
  };
}
