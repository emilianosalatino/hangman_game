"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALFABETO, PALABRAS, normalizar, type Palabra } from "@/lib/words";
import { cn } from "@/lib/utils";
import { Watchdog } from "@/components/watchdog";
import {
  reproducirSonido,
  setSonidoHabilitado,
} from "@/lib/sounds";

const MAX_ERRORES = 6;

type EstadoJuego = "jugando" | "ganado" | "perdido";

type Estadisticas = {
  victorias: number;
  derrotas: number;
  racha: number;
  mejorRacha: number;
};

const STATS_INICIALES: Estadisticas = {
  victorias: 0,
  derrotas: 0,
  racha: 0,
  mejorRacha: 0,
};

const CLAVES_STATS = "ahorcado-stats-v1";
const CLAVE_SONIDO = "ahorcado-sonido-v1";

function elegirPalabra(excluir?: number): Palabra {
  let indice: number;
  do {
    indice = Math.floor(Math.random() * PALABRAS.length);
  } while (PALABRAS.length > 1 && indice === excluir);
  return PALABRAS[indice];
}

/* ====================== Dibujo del ahorcado (SVG) ====================== */
function AhorcadoSVG({ errores, estado }: { errores: number; estado: EstadoJuego }) {
  const perdido = estado === "perdido";
  return (
    <svg
      viewBox="0 0 200 240"
      className="h-full w-full"
      role="img"
      aria-label={`Ahorcado con ${errores} de ${MAX_ERRORES} errores`}
    >
      {/* Suelo */}
      <line x1="15" y1="222" x2="185" y2="222" stroke="#b45309" strokeWidth="6" strokeLinecap="round" />
      {/* Poste vertical */}
      <line x1="48" y1="222" x2="48" y2="28" stroke="#b45309" strokeWidth="6" strokeLinecap="round" />
      {/* Viga horizontal */}
      <line x1="46" y1="28" x2="132" y2="28" stroke="#b45309" strokeWidth="6" strokeLinecap="round" />
        {/* Soporte diagonal */}
      <line x1="48" y1="58" x2="78" y2="28" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
      {/* Cuerda */}
      <line x1="132" y1="28" x2="132" y2="56" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />

      {/* Cabeza (error 1) */}
      {errores >= 1 && (
        <g className="animate-pop-in">
          <circle cx="132" cy="76" r="20" fill="#fff7ed" stroke="#334155" strokeWidth="3" />
          {/* Ojos */}
          {perdido ? (
            <>
              <line x1="123" y1="70" x2="129" y2="76" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="129" y1="70" x2="123" y2="76" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="135" y1="70" x2="141" y2="76" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="141" y1="70" x2="135" y2="76" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="125" cy="72" r="2.2" fill="#334155" />
              <circle cx="139" cy="72" r="2.2" fill="#334155" />
            </>
          )}
          {/* Boca */}
          {perdido ? (
            <path d="M122 86 Q132 80 142 86" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <path d="M122 82 Q132 90 142 82" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          )}
        </g>
      )}

      {/* Cuerpo (error 2) */}
      {errores >= 2 && (
        <line x1="132" y1="96" x2="132" y2="158" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}
      {/* Brazo izquierdo (error 3) */}
      {errores >= 3 && (
        <line x1="132" y1="112" x2="106" y2="138" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}
      {/* Brazo derecho (error 4) */}
      {errores >= 4 && (
        <line x1="132" y1="112" x2="158" y2="138" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}
      {/* Pierna izquierda (error 5) */}
      {errores >= 5 && (
        <line x1="132" y1="158" x2="110" y2="192" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}
      {/* Pierna derecha (error 6) */}
      {errores >= 6 && (
        <line x1="132" y1="158" x2="154" y2="192" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}

      {/* Sol animado cuando se gana */}
      {estado === "ganado" && (
        <g className="animate-wiggle" style={{ transformOrigin: "168px 38px" }}>
          <circle cx="168" cy="38" r="12" fill="#fbbf24" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            const x1 = 168 + Math.cos(a) * 14;
            const y1 = 38 + Math.sin(a) * 14;
            const x2 = 168 + Math.cos(a) * 20;
            const y2 = 38 + Math.sin(a) * 20;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            );
          })}
        </g>
      )}
    </svg>
  );
}

/* ====================== Confeti de victoria ====================== */
function Confetti() {
  const colores = ["#f97316", "#22c55e", "#fbbf24", "#ef4444", "#a855f7", "#06b6d4"];
  const piezas = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.6 + Math.random() * 1.4,
        color: colores[i % colores.length],
        size: 8 + Math.random() * 8,
        rot: Math.random() * 360,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {piezas.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fall ${p.dur}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/* ====================== Juego principal ====================== */
export default function HangmanGame() {
  // Inicial determinista (PALABRAS[0]) para que servidor y cliente rendericen
  // lo mismo y evitar mismatch de hidratación. Se aleatoriza tras montar.
  const [palabraActual, setPalabraActual] = useState<Palabra>(PALABRAS[0]);
  const [letrasAdivinadas, setLetrasAdivinadas] = useState<Set<string>>(new Set());
  const [errores, setErrores] = useState(0);
  const [pistaVisible, setPistaVisible] = useState(false);
  const [stats, setStats] = useState<Estadisticas>(STATS_INICIALES);
  const [cargado, setCargado] = useState(false);
  const [sonidoOn, setSonidoOn] = useState(true);
  const indiceAnterior = useRef<number>(-1);

  // Palabra normalizada para comparar letras (sin acentos en vocales, Ñ conservada).
  const palabraNormalizada = useMemo(() => normalizar(palabraActual.palabra), [palabraActual]);

  // Al montar: cargar estadísticas guardadas, preferencia de sonido y elegir la
  // primera palabra aleatoria (esto solo ocurre en el cliente, evitando mismatch
  // de hidratación).
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVES_STATS);
      if (guardado) {
        const parsed = JSON.parse(guardado) as Estadisticas;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStats({ ...STATS_INICIALES, ...parsed });
      }
      const sonidoGuardado = localStorage.getItem(CLAVE_SONIDO);
      const on = sonidoGuardado === null ? true : sonidoGuardado === "1";
      setSonidoOn(on);
      setSonidoHabilitado(on);
    } catch {
      /* ignore */
    }
    setPalabraActual(elegirPalabra());
    setCargado(true);
  }, []);

  // Guardar estadísticas.
  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(CLAVES_STATS, JSON.stringify(stats));
    } catch {
      /* ignore */
    }
  }, [stats, cargado]);

  // Letras únicas que conforman la palabra (normalizadas).
  const letrasUnicas = useMemo(() => new Set(palabraNormalizada.split("")), [palabraNormalizada]);

  // ¿Se ganó? cuando todas las letras únicas están adivinadas.
  const ganado = useMemo(
    () => Array.from(letrasUnicas).every((l) => letrasAdivinadas.has(l)),
    [letrasUnicas, letrasAdivinadas]
  );

  // Estado derivado durante el render (sin setState en efectos).
  const estado: EstadoJuego = ganado
    ? "ganado"
    : errores >= MAX_ERRORES
      ? "perdido"
      : "jugando";

  // Intentar una letra. Las estadísticas se actualizan aquí (en el manejador
  // de eventos, no en un efecto) para cumplir con las reglas de React 16.
  // Se envuelve en try/catch: los errores en manejadores de eventos NO los
  // capturan las barreras de error de React, y podrían dejar la página rota.
  const intentar = useCallback(
    (letraRaw: string) => {
      try {
        if (estado !== "jugando") return;
        const letra = normalizar(letraRaw);
        if (!ALFABETO.includes(letra)) return;
        if (letrasAdivinadas.has(letra)) return;

        const acierto = letrasUnicas.has(letra);
        const nuevasLetras = new Set(letrasAdivinadas);
        nuevasLetras.add(letra);
        const nuevosErrores = errores + (acierto ? 0 : 1);

        setLetrasAdivinadas(nuevasLetras);
        setErrores(nuevosErrores);

        // Determinar el nuevo estado de forma síncrona y actualizar stats.
        const gano = Array.from(letrasUnicas).every((l) => nuevasLetras.has(l));
        const perdio = nuevosErrores >= MAX_ERRORES;
        if (gano) {
          setStats((s) => {
            const nuevaRacha = s.racha + 1;
            return {
              victorias: s.victorias + 1,
              derrotas: s.derrotas,
              racha: nuevaRacha,
              mejorRacha: Math.max(s.mejorRacha, nuevaRacha),
            };
          });
          reproducirSonido("victoria"); // aplausos + porra
        } else if (perdio) {
          setStats((s) => ({ ...s, derrotas: s.derrotas + 1, racha: 0 }));
          reproducirSonido("derrota"); // aww + poquitos aplausos
        } else if (acierto) {
          reproducirSonido("acierto"); // ding al acertar letra
        } else {
          reproducirSonido("fallo"); // tono grave al fallar letra
        }
      } catch {
        /* Error en evento: ignorar para no romper la página. */
      }
    },
    [estado, letrasAdivinadas, letrasUnicas, errores]
  );

  const nuevaPartida = useCallback(() => {
    const siguiente = elegirPalabra(indiceAnterior.current);
    indiceAnterior.current = PALABRAS.findIndex((p) => p.palabra === siguiente.palabra);
    setPalabraActual(siguiente);
    setLetrasAdivinadas(new Set());
    setErrores(0);
    setPistaVisible(false);
  }, []);

  const reiniciarStats = useCallback(() => {
    setStats(STATS_INICIALES);
  }, []);

  const alternarSonido = useCallback(() => {
    setSonidoOn((prev) => {
      const nv = !prev;
      setSonidoHabilitado(nv);
      try {
        localStorage.setItem(CLAVE_SONIDO, nv ? "1" : "0");
      } catch {
        /* ignore */
      }
      // Al reactivar, reproduce un acierto corto como confirmación.
      if (nv) reproducirSonido("acierto");
      return nv;
    });
  }, []);

  // Escuchar el teclado físico.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && estado !== "jugando") {
        nuevaPartida();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k.length !== 1) return;
      intentar(k);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [intentar, estado, nuevaPartida]);

  const erroresRestantes = MAX_ERRORES - errores;
  const palabraParaMostrar = palabraActual.palabra;

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      <Watchdog />
      {estado === "ganado" && <Confetti />}

      {/* Encabezado */}
      <header className="relative px-4 pt-6 text-center sm:pt-8">
        <button
          type="button"
          onClick={alternarSonido}
          aria-label={sonidoOn ? "Silenciar sonido" : "Activar sonido"}
          aria-pressed={!sonidoOn}
          title={sonidoOn ? "Silenciar sonido" : "Activar sonido"}
          className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full border-2 border-orange-200 bg-white/80 text-orange-600 shadow-sm transition-all hover:border-orange-400 hover:bg-orange-50 active:scale-95 sm:right-4 sm:top-4"
        >
          {sonidoOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700 shadow-sm ring-1 ring-orange-200">
          Juego para niños
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-orange-600 drop-shadow-sm sm:text-5xl">
          El Ahorcado
        </h1>
        <p className="mt-2 text-base text-slate-600 sm:text-lg">
          Adivina la palabra secreta antes de quedarte sin intentos.
        </p>
      </header>

      {/* Estadísticas */}
      <section className="mx-auto mt-5 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 px-4 sm:gap-3">
        <StatChip label="Victorias" valor={stats.victorias} color="emerald" />
        <StatChip label="Derrotas" valor={stats.derrotas} color="rose" />
        <StatChip label="Racha" valor={stats.racha} color="amber" />
        <StatChip label="Mejor racha" valor={stats.mejorRacha} color="violet" />
        <button
          onClick={reiniciarStats}
          className="ml-1 rounded-full px-3 py-1 text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
        >
          reiniciar
        </button>
      </section>

      {/* Tablero principal */}
      <main className="mx-auto mt-5 flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 pb-6 sm:gap-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {/* Panel del ahorcado */}
          <div className="flex flex-col items-center rounded-3xl border-2 border-orange-200 bg-white/80 p-4 shadow-sm sm:p-6">
            <div className="mb-2 flex w-full items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Intentos restantes</span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-bold",
                  erroresRestantes > 3
                    ? "bg-emerald-100 text-emerald-700"
                    : erroresRestantes > 1
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                )}
              >
                {erroresRestantes} / {MAX_ERRORES}
              </span>
            </div>
            <div className="h-56 w-full max-w-[220px] sm:h-72">
              <AhorcadoSVG errores={errores} estado={estado} />
            </div>
          </div>

          {/* Panel de la palabra */}
          <div className="flex flex-col justify-between gap-4 rounded-3xl border-2 border-orange-200 bg-white/80 p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge className="bg-orange-500 text-white hover:bg-orange-500">
                {palabraActual.categoria}
              </Badge>
              <span className="text-sm font-medium text-slate-500">
                {palabraParaMostrar.length} letras
              </span>
            </div>

            {/* Palabra con casillas */}
            <div
              className="flex flex-wrap justify-center gap-1.5 py-2 sm:gap-2"
              aria-live="polite"
            >
              {palabraParaMostrar.split("").map((caracter, i) => {
                const revelada =
                  letrasAdivinadas.has(normalizar(caracter)) || estado !== "jugando";
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex h-11 w-8 items-center justify-center rounded-lg border-b-4 text-2xl font-black sm:h-14 sm:w-10 sm:text-3xl",
                      revelada
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-slate-300 bg-slate-50 text-transparent",
                      estado === "perdido" && !letrasAdivinadas.has(normalizar(caracter)) &&
                        "border-rose-400 bg-rose-50 text-rose-600",
                      revelada && "animate-pop-in"
                    )}
                  >
                    {revelada ? caracter : "_"}
                  </div>
                );
              })}
            </div>

            {/* Pista */}
            <div className="flex flex-col items-center gap-2">
              {pistaVisible ? (
                <p className="rounded-xl bg-yellow-100 px-4 py-2 text-center text-sm font-medium text-yellow-800 ring-1 ring-yellow-200">
                  Pista: {palabraActual.pista}
                </p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPistaVisible(true)}
                  disabled={estado !== "jugando"}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
                >
                  Ver pista
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Teclado */}
        <div className="rounded-3xl border-2 border-orange-200 bg-white/80 p-3 shadow-sm sm:p-5">
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9 sm:gap-2">
            {ALFABETO.map((letra) => {
              const adivinada = letrasAdivinadas.has(letra);
              const acertada = adivinada && letrasUnicas.has(letra);
              const fallada = adivinada && !letrasUnicas.has(letra);
              return (
                <button
                  key={letra}
                  onClick={() => intentar(letra)}
                  disabled={adivinada || estado !== "jugando"}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-xl text-lg font-black transition-all sm:h-12 sm:text-xl",
                    "min-w-[2.5rem] select-none",
                    acertada &&
                      "bg-emerald-500 text-white shadow-sm",
                    fallada && "bg-rose-400 text-white opacity-80 shadow-sm",
                    !adivinada &&
                      estado === "jugando" &&
                      "border-2 border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 active:translate-y-0",
                    !adivinada &&
                      estado !== "jugando" &&
                      "border-2 border-slate-200 bg-slate-50 text-slate-400",
                    adivinada && "cursor-default"
                  )}
                  aria-label={`Letra ${letra}`}
                >
                  {letra}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mensaje de fin de partida */}
        {estado !== "jugando" && (
          <div
            className={cn(
              "flex flex-col items-center gap-3 rounded-3xl border-2 p-5 text-center shadow-sm sm:p-6",
              estado === "ganado"
                ? "border-emerald-300 bg-emerald-50"
                : "border-rose-300 bg-rose-50"
            )}
          >
            <p
              className={cn(
                "text-2xl font-black sm:text-3xl",
                estado === "ganado" ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {estado === "ganado" ? "¡Lo lograste!" : "¡Casi!"}
            </p>
            <p className="text-sm text-slate-600 sm:text-base">
              {estado === "ganado" ? (
                <>Adivinaste la palabra correctamente.</>
              ) : (
                <>
                  La palabra era{" "}
                  <span className="font-black text-slate-800">{palabraParaMostrar}</span>
                </>
              )}
            </p>
            <Button
              onClick={nuevaPartida}
              size="lg"
              className={cn(
                "mt-1 rounded-full text-base font-bold shadow-md",
                estado === "ganado"
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              )}
            >
              Jugar otra vez (Enter)
            </Button>
          </div>
        )}

        {/* Botón nueva partida siempre disponible */}
        {estado === "jugando" && (
          <div className="flex justify-center">
            <Button
              onClick={nuevaPartida}
              variant="ghost"
              className="text-slate-500 hover:text-orange-600"
            >
              Cambiar de palabra
            </Button>
          </div>
        )}
      </main>

      {/* Pie pegado al fondo */}
      <footer className="mt-auto border-t border-orange-200/60 bg-white/60 py-4 text-center backdrop-blur">
        <p className="px-4 text-xs text-slate-500 sm:text-sm">
          El Ahorcado &middot; {PALABRAS.length} palabras para jugar &middot; Hecho para niños de 8 a 10 años
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 text-xs font-medium text-slate-400 underline-offset-2 hover:text-orange-600 hover:underline"
        >
          ¿No responde? Recargar página
        </button>
      </footer>
    </div>
  );
}

/* ====================== Chip de estadística ====================== */
function StatChip({
  label,
  valor,
  color,
}: {
  label: string;
  valor: number;
  color: "emerald" | "rose" | "amber" | "violet";
}) {
  const estilos: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    rose: "bg-rose-100 text-rose-700 ring-rose-200",
    amber: "bg-amber-100 text-amber-700 ring-amber-200",
    violet: "bg-violet-100 text-violet-700 ring-violet-200",
  };
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1",
        estilos[color]
      )}
    >
      <span className="opacity-80">{label}</span>
      <span className="text-base font-black tabular-nums">{valor}</span>
    </div>
  );
}
