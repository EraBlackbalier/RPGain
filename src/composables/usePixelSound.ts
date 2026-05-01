// ═══════════════════════════════════════════════════════════════
//  COMPOSABLE: usePixelSound (Sonidos Retro 8-bit)
// ═══════════════════════════════════════════════════════════════
// Un "composable" en Vue es una función reutilizable que encapsula
// lógica. Este archivo maneja todos los sonidos retro de la app.
// Usa la Web Audio API nativa del navegador (sin archivos de audio).
// Genera ondas cuadradas (square) y diente de sierra (sawtooth)
// para crear efectos de sonido estilo videojuego antiguo.
// ═══════════════════════════════════════════════════════════════

// Variable global que guarda el contexto de audio.
// `AudioContext` es la puerta de entrada de la Web Audio API.
// Se crea UNA SOLA VEZ y se reusa para todos los sonidos.
let audioCtx: AudioContext | null = null;

/**
 * Obtiene o crea el AudioContext.
 * Si no existe, lo crea. Si está "suspendido" (puede pasar por
 * políticas del navegador), lo reactiva con `resume()`.
 */
function getCtx(): AudioContext {
  if (!audioCtx) {
    // `new AudioContext()` inicia el motor de audio del navegador.
    audioCtx = new AudioContext();
  }
  // El navegador puede "suspender" el audio hasta que el usuario interactúe.
  // Por eso verificamos y lo reactivamos si es necesario.
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Función base para tocar UN TONO (una nota musical).
 * Construye una cadena de nodos de audio:
 *   Oscillator → Gain → Destino (altavoces)
 *
 * `freq`: frecuencia en Hz (440 = nota La).
 * `duration`: duración en segundos.
 * `type`: forma de onda ("square" = onda cuadrada, suena retro).
 * `volume`: volumen inicial (0.0 a 1.0).
 */
function playTone(freq: number, duration: number, type: OscillatorType = "square", volume = 0.08) {
  const ctx = getCtx();              // Obtenemos el contexto de audio
  const osc = ctx.createOscillator(); // Crea un generador de ondas
  const gain = ctx.createGain();      // Crea un control de volumen

  osc.type = type;                    // Tipo de onda: square, sawtooth, sine, triangle
  osc.frequency.setValueAtTime(freq, ctx.currentTime);  // Fijamos la frecuencia (nota)

  // Volumen inicial
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  // Hacemos que el volumen decaiga exponencialmente a casi 0 al final.
  // Esto evita que el sonido se corte bruscamente (hace un "fade out").
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  // Conectamos los nodos en serie: oscilador → volumen → altavoces
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Iniciamos y detenemos el sonido en el tiempo exacto.
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// ── FUNCIONES EXPORTADAS (efectos de sonido específicos) ──
// Cada función llama a `playTone` con frecuencias y tiempos distintos
// para crear diferentes efectos emocionales.

/** Sonido suave para cuando pasas el mouse sobre un botón. */
export function playHover() {
  playTone(440, 0.04, "square", 0.03);   // Nota La, muy corta, muy bajito
}

/** Sonido de "click" al presionar un botón.
 *  Toca dos notas rápidas ascendentes para dar sensación de confirmación.
 */
export function playClick() {
  playTone(880, 0.08, "square", 0.06);   // Primera nota (La agudo)
  setTimeout(() => playTone(1100, 0.06, "square", 0.04), 60); // Segunda nota 60ms después
}

/** Sonido de retroceso/navegación hacia atrás.
 *  Dos notas descendentes.
 */
export function playBack() {
  playTone(660, 0.06, "square", 0.05);   // Nota Mi
  setTimeout(() => playTone(440, 0.08, "square", 0.04), 50);  // Baja a La
}

/** Fanfarria de inicio (splash screen).
 *  Arpegio ascendente: Do → Mi → Sol → Do agudo.
 */
export function playStart() {
  const notes = [523, 659, 784, 1047];     // Frecuencias de un acorde mayor ascendente
  notes.forEach((f, i) => {
    // Tocamos cada nota con 80ms de separación (efecto arpegio).
    setTimeout(() => playTone(f, 0.12, "square", 0.08), i * 80);
  });
}

/** Fanfarria de éxito.
 *  Arpegio mayor ascendente más brillante.
 */
export function playSuccess() {
  const notes = [784, 988, 1175, 1568];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.15, "square", 0.07), i * 100);
  });
}

/** Sonido de error (buzz).
 *  Usa "sawtooth" (diente de sierra) que suena más áspero.
 *  Dos notas graves descendentes.
 */
export function playError() {
  playTone(150, 0.25, "sawtooth", 0.06); // Nota grave, larga, áspera
  setTimeout(() => playTone(120, 0.3, "sawtooth", 0.05), 150); // Aún más grave
}

/** Sonido de desbloqueo de habilidad.
 *  Arpegio ascendente de 5 notas (más elaborado que el de éxito).
 */
export function playUnlock() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.18, "square", 0.07), i * 90);
  });
}

/** Sonido de completar una tarea.
 *  Arpegio rápido y brillante.
 */
export function playComplete() {
  const notes = [880, 1100, 1320, 1760];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.12, "square", 0.08), i * 70);
  });
}

/** Sonido de "tick" al incrementar/decrementar progreso.
 *  Nota muy aguda y ultra corta (solo un clic).
 */
export function playTick() {
  playTone(2000, 0.02, "square", 0.04);  // 2000 Hz = muy agudo, 0.02s = 20 milisegundos
}
