// Síntesis de sonido con Web Audio API (sin archivos externos).
// - Victoria: aplausos + grito de porra + fanfarria ascendente.
// - Derrota: "aww" descendente + poquitos aplausos suaves.
// - Acierto: ding breve al acertar una letra.
// - Fallo: tono grave suave al fallar una letra.
//
// Todo se genera en el navegador, sin descargar nada. El AudioContext se
// crea/resume tras un gesto del usuario (clic/tecla), cumpliendo las políticas
// de autoreproducción de los navegadores.

"use client";

type TipoSonido = "victoria" | "derrota" | "acierto" | "fallo";

let ctx: AudioContext | null = null;
let bufferRuidoCache: AudioBuffer | null = null;
let habilitado = true;

export function setSonidoHabilitado(v: boolean) {
  habilitado = v;
}
export function getSonidoHabilitado() {
  return habilitado;
}

function asegurarCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function bufferRuido(c: AudioContext): AudioBuffer {
  if (bufferRuidoCache) return bufferRuidoCache;
  const len = Math.floor(c.sampleRate * 1.0);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  bufferRuidoCache = buf;
  return buf;
}

// Una palmada individual: burst corto de ruido filtrado.
function palmada(
  c: AudioContext,
  t: number,
  ganancia: number,
  destino: AudioNode
) {
  const src = c.createBufferSource();
  src.buffer = bufferRuido(c);
  const g = c.createGain();
  const peak = ganancia * (0.6 + Math.random() * 0.4);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + Math.random() * 0.04);
  src.connect(g);
  g.connect(destino);
  src.start(t);
  src.stop(t + 0.12);
}

// Tanda de aplausos: muchas palmadas distribuidas en el tiempo.
function aplausos(
  c: AudioContext,
  inicio: number,
  duracion: number,
  ganancia: number,
  densidad: number
) {
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1600;
  bp.Q.value = 0.8;
  const master = c.createGain();
  master.gain.value = ganancia;
  bp.connect(master);
  master.connect(c.destination);
  const num = Math.max(1, Math.floor(densidad * duracion));
  for (let i = 0; i < num; i++) {
    const t = inicio + Math.random() * duracion;
    palmada(c, t, 0.5, bp);
  }
}

function tono(
  c: AudioContext,
  freq: number,
  inicio: number,
  dur: number,
  tipo: OscillatorType,
  ganancia: number,
  destino?: AudioNode
) {
  const osc = c.createOscillator();
  osc.type = tipo;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, inicio);
  g.gain.exponentialRampToValueAtTime(ganancia, inicio + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  osc.connect(g);
  g.connect(destino ?? c.destination);
  osc.start(inicio);
  osc.stop(inicio + dur + 0.05);
}

// Grito de porra: oleaje de ruido filtrado que sube de tono y volumen.
function porra(c: AudioContext, inicio: number) {
  const src = c.createBufferSource();
  src.buffer = bufferRuido(c);
  src.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(500, inicio);
  bp.frequency.linearRampToValueAtTime(1400, inicio + 0.9);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, inicio);
  g.gain.linearRampToValueAtTime(0.25, inicio + 0.35);
  g.gain.linearRampToValueAtTime(0.22, inicio + 1.0);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + 1.7);
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(inicio);
  src.stop(inicio + 1.8);
}

function victoria(c: AudioContext) {
  const now = c.currentTime;
  aplausos(c, now, 2.4, 0.5, 28); // aplausos durante ~2.4s
  porra(c, now + 0.1); // grito de porra
  // Fanfarria ascendente Do-Mi-Sol-Do
  const base = now + 0.05;
  tono(c, 523.25, base, 0.18, "triangle", 0.22);
  tono(c, 659.25, base + 0.12, 0.18, "triangle", 0.22);
  tono(c, 783.99, base + 0.24, 0.18, "triangle", 0.22);
  tono(c, 1046.5, base + 0.36, 0.3, "triangle", 0.25);
}

// "Aww" de decepción: tono que desciende con timbre vocal.
function aww(c: AudioContext, inicio: number) {
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 750;
  bp.Q.value = 2.5;
  const g = c.createGain();
  osc.frequency.setValueAtTime(430, inicio);
  osc.frequency.exponentialRampToValueAtTime(150, inicio + 0.8);
  g.gain.setValueAtTime(0.0001, inicio);
  g.gain.linearRampToValueAtTime(0.3, inicio + 0.06);
  g.gain.linearRampToValueAtTime(0.25, inicio + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.95);
  osc.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  osc.start(inicio);
  osc.stop(inicio + 1.0);
}

function derrota(c: AudioContext) {
  const now = c.currentTime;
  aww(c, now);
  // Poquitos aplausos: 4 palmadas suaves y espaciadas.
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1500;
  bp.Q.value = 0.8;
  const master = c.createGain();
  master.gain.value = 0.18;
  bp.connect(master);
  master.connect(c.destination);
  [0.1, 0.5, 0.9, 1.3].forEach((d) => palmada(c, now + d, 0.5, bp));
}

function acierto(c: AudioContext) {
  const now = c.currentTime;
  tono(c, 880, now, 0.12, "triangle", 0.2); // La5
  tono(c, 1318.5, now + 0.06, 0.12, "triangle", 0.14); // Mi6
}

function fallo(c: AudioContext) {
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  const g = c.createGain();
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.26);
}

export function reproducirSonido(tipo: TipoSonido) {
  if (!habilitado) return;
  try {
    const c = asegurarCtx();
    if (!c) return;
    switch (tipo) {
      case "victoria":
        victoria(c);
        break;
      case "derrota":
        derrota(c);
        break;
      case "acierto":
        acierto(c);
        break;
      case "fallo":
        fallo(c);
        break;
    }
  } catch {
    /* audio no disponible: ignorar silenciosamente */
  }
}
