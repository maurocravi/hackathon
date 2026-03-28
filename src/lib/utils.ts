import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Analiza un snapshot de las frecuencias del audio
export function analyzeAudioMood(frequencyData: Uint8Array) {
  let bass = 0, mid = 0, treble = 0;
  
  // Dividimos el espectro en 3 bandas
  for (let i = 0; i < frequencyData.length; i++) {
    if (i < frequencyData.length * 0.1) bass += frequencyData[i];
    else if (i < frequencyData.length * 0.5) mid += frequencyData[i];
    else treble += frequencyData[i];
  }

  const total = bass + mid + treble || 1; // Evitar división por 0
  
  return {
    isBassHeavy: (bass / total) > 0.4,
    isBright: (treble / total) > 0.3,
    energy: total / (frequencyData.length * 255) // de 0 a 1
  };
}

// Genera un prompt en inglés optimizado para SDXL/Pollinations
export function buildPromptFromAudio(style: string, mood: any) {
  const basePrompts: Record<string, string> = {
    'Pulsing Glow': 'A futuristic abstract 3D render, glowing neon geometric shapes, pulsating light',
    'Particle Field': 'A vast field of magical glowing dust and particles, ethereal atmosphere, deep space',
    'VHS Dreams': 'A nostalgic retro 80s synthwave landscape, chromatic aberration, scanlines, analog aesthetic'
  };

  let prompt = basePrompts[style] || basePrompts['Pulsing Glow'];

  // Agregamos modificadores basados en la música real
  if (mood.isBassHeavy) prompt += ', heavy dark undertones, intense contrast, deep shadows, cinematic lighting';
  if (mood.isBright) prompt += ', bright pastel highlights, sharp details, sparkling effects';
  if (mood.energy > 0.6) prompt += ', dynamic composition, explosive energy, motion blur';
  else prompt += ', calm, peaceful, minimalist, slow floating movement';

  // Añadir modificadores de calidad profesional siempre
  prompt += ', highly detailed, 8k resolution, masterpiece, trending on ArtStation, album cover art style --no text';

  return prompt;
}
