LoopCanvas – Generador de Artwork + Spotify Canvas para Artistas Emergentes

Descripción del Proyecto

Herramienta web todo-en-uno para artistas independientes. Sube tu canción y genera automáticamente:
Cover art (3000x3000px, JPG/PNG) – para distribuidoras digitales
Spotify Canvas (720x1280px, MP4 loop de 3-8s) – video vertical para Spotify for Artists
Todo coherente visualmente, basado en el análisis automático de tu música (género, energía, BPM, mood).
Problema que Resuelve

Los artistas emergentes no tienen presupuesto para diseñadores ni editores de video profesionales. Spotify Canvas aumenta engagement hasta 145%, pero menos del 10% de artistas independientes lo usan por la barrera técnica.
Flujo de Usuario

Sube tu archivo de audio (MP3/WAV)
Sistema analiza: BPM, energía, género detectado, mood visual sugerido
Genera 3 propuestas de artwork + canvas animado
Editor simple: ajusta colores, tipografía, intensidad de animación
Exporta pack completo listo para subir

Estilos Visuales Predefinidos

| Estilo          | Descripción                               | Género objetivo        |
| --------------- | ----------------------------------------- | ---------------------- |
| Pulsing Glow    | Formas orgánicas que pulsan al beat       | House, Techno, Pop     |
| VHS Dreams      | Retro con scanlines, chromatic aberration | Lo-fi, Bedroom pop     |
| Particle Field  | Partículas que fluyen con frecuencias     | Ambient, Electronic    |
| Typography Wave | Letras que se deforman al ritmo           | Hip-hop, Rap           |
| Glitch Story    | Cortes rápidos, RGB split, artifacts      | Hyperpop, Experimental |

Stack Técnico

Frontend

Next.js 14 (App Router)
Tailwind CSS + shadcn/ui
TypeScript
Análisis de Audio

Essentia.js (WebAssembly) – análisis offline completo
Alternativa ligera: Meyda.js – análisis en tiempo real
Generación de Imagen

Stable Diffusion API / Replicate / Pollinations
Prompt engineering basado en metadatos del audio
Animación (Canvas Video)

Three.js (escenas 3D) o Regl/GLSL (shaders 2D)
HTML5 Canvas 2D + sistemas de partículas
Shaders reactivos al audio (The Book of Shaders como referencia)
Exportación de Video

MediaRecorder API – graba el <canvas>
FFmpeg.wasm – conversión a MP4 (H.264)
Especificaciones Técnicas de Salida

| Formato        | Especificaciones                                                   |
| -------------- | ------------------------------------------------------------------ |
| Cover Art      | 3000x3000px, JPG/PNG, < 8MB                                        |
| Spotify Canvas | 720x1280px (9:16), MP4 (H.264), 3-8 segundos, < 8MB, loop seamless |

MVP Light (Plan B)

Si el video es demasiado complejo para el tiempo:
Generar GIF animado o Lottie JSON como demo funcional
Pivotear a MP4 post-hackathon
O usar plantillas de animación pre-renderizadas que el usuario customiza (colores, texturas)
Recursos Útiles

Essentia.js: https://essentia.upf.edu
The Book of Shaders: https://thebookofshaders.com
Spotify Canvas Guidelines: https://artists.spotify.com/help/article/canvas-guidelines
FFmpeg.wasm: https://ffmpegwasm.netlify.app