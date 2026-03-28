'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Settings2, Download, Play, Pause, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { Visualizer } from '@/components/Visualizer';
import { analyzeAudioMood, buildPromptFromAudio } from '@/lib/utils';

const STYLES = ['Pulsing Glow', 'Particle Field', 'VHS Dreams'];

export default function LoopCanvasPro() {
  const [file, setFile] = useState<File | null>(null);
  const [styleName, setStyleName] = useState(STYLES[0]);
  const [artworks, setArtworks] = useState<string[]>([]);
  const [isGeneratingArtwork, setIsGeneratingArtwork] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const { isPlaying, duration, currentTime, togglePlay, getFrequencyData, getAudioElement } = useAudioAnalyzer(file);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      generateArtworks(e.target.files[0].name);
    }
  };

  const generateArtworks = async (filename: string) => {
    setIsGeneratingArtwork(true);
    
    try {
      // 1. Obtenemos un poco de datos del audio actual
      const freqData = getFrequencyData(); 
      const mood = freqData ? analyzeAudioMood(freqData) : { isBassHeavy: false, isBright: false, energy: 0.5 };
      
      // 2. Construimos el prompt profesional
      const prompt = buildPromptFromAudio(styleName, mood);
      console.log("Generando imagen con prompt:", prompt);

      const response = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Falló la generación: ${errText}`);
      }

      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      
      // 4. Actualizamos el estado con la nueva imagen en memoria
      setArtworks([localUrl]);
      
    } catch (error) {
      console.error('Error generando artwork:', error);
      // Fallback de seguridad en caso de error
      setArtworks([
        '/artworks/neon.png',
        '/artworks/minimal.png',
        '/artworks/lofi.png'
      ]);
    } finally {
      setIsGeneratingArtwork(false);
    }
  };

  const downloadArtwork = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `LoopCanvas_artwork_${index + 1}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const exportVideo = async () => {
    const canvas = document.querySelector('canvas');
    const audioEl = getAudioElement();
    if (!canvas || !audioEl) return;
    
    setIsExporting(true);
    
    try {
      // Create a stream from the canvas
      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // We also need to capture audio if possible. Since audio is playing from an audio element:
      // Note: In Chrome, captureStream on audio element works or MediaStreamDestination
      // For MVP, we'll try to get it from the audio elements if possible, or just export visual
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createMediaElementSource(audioEl);
      source.connect(dest);
      source.connect(audioCtx.destination);
      
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }

      // Record 8 seconds for the Spotify Canvas standard
      const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LoopCanvas_${styleName.replace(' ', '_')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        
        setIsExporting(false);
        audioEl.pause();
        togglePlay(); // update play state internally
      };
      
      // Start recording and playback
      if (!isPlaying) togglePlay();
      // Ensure we start from beginning or a specific intense part for 8 secs
      audioEl.currentTime = Math.max(0, audioEl.duration / 2); // default mid-song
      mediaRecorder.start();
      
      // Stop after 8 seconds
      setTimeout(() => {
        mediaRecorder.stop();
      }, 8000);

    } catch (e) {
      console.error(e);
      alert('Video export is not supported in this browser without proper configuration.');
      setIsExporting(false);
    }
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 flex flex-col font-sans">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <header className="relative z-10 p-4 sm:p-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Loop<span className="text-purple-400">Canvas</span></h1>
        </div>
        <div className="flex gap-4">
          <button className="text-sm font-medium hover:text-purple-400 transition-colors">Documentation</button>
          {!file && (
            <div className="text-sm text-zinc-400 font-medium pb-px hidden sm:block">
              Magic Page
            </div>
          )}
          {file && (
             <button onClick={() => setFile(null)} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
               Start Over
             </button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center p-4 sm:p-8">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-2xl mt-12 sm:mt-24"
            >
              <div className="glass-card rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:border-purple-500/30 shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                  <Upload className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-3xl font-semibold mb-3 tracking-tight">Upload your track</h2>
                <p className="text-zinc-400 mb-8 max-w-md">
                  Drop your MP3 or WAV file here. We'll instantly analyze the audio and generate matching Artwork & Canvas videos.
                </p>
                <label className="relative cursor-pointer group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] rounded-full transition-all">
                  <input 
                    type="file" 
                    accept="audio/mp3, audio/wav, audio/mpeg" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                  <div className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 active:scale-95 transition-all">
                    Select Audio File
                  </div>
                </label>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8"
            >
              {/* Main Visualizer Area */}
              <div className="glass-card rounded-3xl p-4 sm:p-6 flex flex-col relative overflow-hidden min-h-[500px] lg:min-h-[700px] border-white/10 shadow-xl">
                <div className="flex-1 flex items-center justify-center bg-black/50 rounded-2xl overflow-hidden relative">
                  <Visualizer getFrequencyData={getFrequencyData} isPlaying={isPlaying} styleName={styleName} />
                  
                  {isExporting && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                      <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                      <h3 className="text-xl font-semibold">Rendering Canvas Video</h3>
                      <p className="text-zinc-400 mt-2">Recording 8 seconds of magic...</p>
                    </div>
                  )}
                </div>

                {/* Playback Controls */}
                <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={togglePlay}
                    className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-end mb-2">
                       <span className="font-medium truncate block max-w-[200px] sm:max-w-md">{file.name}</span>
                       <span className="text-xs text-zinc-400 tabular-nums">
                         {formatTime(currentTime)} / {formatTime(duration || 0)}
                       </span>
                    </div>
                    {/* Basic Progress Bar */}
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-purple-500 transition-all duration-100 ease-linear"
                         style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                       />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Settings Area */}
              <div className="flex flex-col gap-6">
                
                {/* Visual Style Selection */}
                <div className="glass-card rounded-3xl p-6 border-white/10 shadow-xl">
                  <div className="flex items-center gap-2 mb-6 text-lg font-medium">
                    <Settings2 className="w-5 h-5 text-purple-400" />
                    <h2>Canvas Settings</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-sm text-zinc-400 font-medium">Visual Style</label>
                    <div className="grid grid-cols-1 gap-2">
                      {STYLES.map((style) => (
                        <button 
                          key={style} 
                          onClick={() => setStyleName(style)}
                          className={`p-4 text-sm font-medium rounded-xl border transition-all text-left flex justify-between items-center ${
                            styleName === style 
                              ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                              : 'border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300'
                          }`}
                        >
                          {style}
                          {styleName === style && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generative Artworks AI mock */}
                <div className="glass-card rounded-3xl p-6 border-white/10 shadow-xl flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4 text-lg font-medium">
                    <ImageIcon className="w-5 h-5 text-blue-400" />
                    <h2>Generated Artwork Proposals</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2 custom-scrollbar">
                    {isGeneratingArtwork ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-zinc-400 text-center">Analyzing audio energy & generating covers...</p>
                      </div>
                    ) : artworks.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {artworks.map((url, i) => (
                           <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Artwork Proposal ${i+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button onClick={() => downloadArtwork(url, i)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md text-white">
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                           </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Export Card */}
                <div className="glass-card rounded-3xl p-6 border-white/10 shadow-xl flex flex-col items-center justify-center text-center">
                  <div className="w-full flex justify-between text-xs text-zinc-400 mb-4 px-2">
                     <span>Format: WebM (H.264 mapped)</span>
                     <span>Res: 720x1280 (9:16)</span>
                  </div>
                  <button 
                    onClick={exportVideo}
                    disabled={isExporting}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    {isExporting ? 'Exporting...' : 'Export Spotify Canvas'}
                  </button>
                  <p className="text-xs text-zinc-500 mt-4">
                    Creates an 8-second seamless loop directly from browser.
                  </p>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
