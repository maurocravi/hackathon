'use client';

import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  getFrequencyData: () => Uint8Array | null;
  isPlaying: boolean;
  styleName: string;
}

export function Visualizer({ getFrequencyData, isPlaying, styleName }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Center coordinates
    const cx = width / 2;
    const cy = height / 2;

    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      
      const data = getFrequencyData();
      if (!data) return;

      // Basic Audio Reactive Visualizer Logic

      // Default background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Analyze data for average energy
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      const avg = sum / data.length;
      
      // Calculate bass energy (lower frequencies)
      let bassSum = 0;
      for (let i = 0; i < 20; i++) {
        bassSum += data[i];
      }
      const bassAvg = Math.max(0.1, bassSum / 20); // Prevent zero scaling

      if (styleName === 'Pulsing Glow') {
        const radius = 100 + (bassAvg * 1.5);
        
        ctx.save();
        
        // draw outer glow based on avg frequency
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2 + avg);
        grad.addColorStop(0, 'rgba(139, 92, 246, 0.8)'); // Purple
        grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)'); // Blueish
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // draw center circle pulsing to bass
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = bassAvg * 0.5;
        ctx.fill();

        ctx.restore();
      } else if (styleName === 'Particle Field') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // trailing effect
        ctx.fillRect(0, 0, width, height);
        
        ctx.save();
        ctx.translate(cx, cy);
        
        for (let i = 0; i < data.length; i += 4) {
          const val = data[i];
          const angle = (i / data.length) * Math.PI * 2 + (Date.now() * 0.001);
          
          const r = val * 2;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          const hue = (val + i) % 360;
          ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
          ctx.fill();
        }
        ctx.restore();
      } else {
        // VHS Dreams (simple placeholder: moving scanlines + RGB split)
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        
        ctx.save();
        const offset = bassAvg * 0.2;
        
        // Red channel
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(cx - 100 - offset, cy - 200, 200, 400 * (avg / 100));
        
        // Cyan channel
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillRect(cx - 100 + offset, cy - 200, 200, 400 * (avg / 100));

        // Scanlines
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < height; i += 8) {
          ctx.fillRect(0, i + (Date.now() * 0.1) % 8, width, 2);
        }
        ctx.restore();
      }
    };

    if (isPlaying) {
      render();
    } else {
      // Draw initial state
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#333';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Press Play to preview visualizer', cx, cy);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [getFrequencyData, isPlaying, styleName]);

  return (
    <canvas 
      ref={canvasRef} 
      width={720} 
      height={1280} 
      className="w-full h-full object-contain bg-black rounded-xl"
    />
  );
}
