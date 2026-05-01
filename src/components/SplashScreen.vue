// ═══════════════════════════════════════════════════════════════
//  COMPONENTE: SplashScreen (Pantalla de Inicio Retro)
// ═══════════════════════════════════════════════════════════════
// Esta es la primera pantalla que ve el usuario al abrir la app.
// Tiene un estilo retro de videojuego: título pixel-art, botón "PRESS START",
// texto parpadeante, scanlines (líneas de TV), y efectos de flash.
// Al hacer click o presionar el botón:
//   1. Reproduce sonido de inicio
//   2. Activa animación de flash + shrink
//   3. Redimensiona la ventana de Tauri (de pequeña a grande)
//   4. Emite el evento "start" para que App.vue oculte este componente
// ═══════════════════════════════════════════════════════════════

<script setup lang="ts">
// ── IMPORTS ──
// `ref`: variable reactiva (cambia la UI automáticamente).
// `onMounted`: hook que se ejecuta cuando el componente se monta en el DOM.
// `getCurrentWindow`: función de Tauri para manipular la ventana actual (redimensionar, etc.).
// `PixelIcon`: componente de iconos SVG pixel-art.
// `playStart`, `playHover`: sonidos retro del composable usePixelSound.
import { ref, onMounted } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import PixelIcon from "./PixelIcon.vue";
import { playStart, playHover } from "../composables/usePixelSound";

// ── EVENTOS (Emits) ──
// `defineEmits` declara que este componente PUEDE emitir un evento llamado "start".
// El componente padre (App.vue) escucha este evento para ocultar la splash screen.
const emit = defineEmits<{
  (e: "start"): void; // "void" significa que no lleva datos extra
}>();

// ── ESTADO REACTIVO ──
// `blink`: controla la visibilidad del texto "PRESS START TO CONTINUE".
//   Cambia entre true/false cada 600ms para crear efecto parpadeante.
const blink = ref(true);

// `flashing`: cuando es true, activa las animaciones CSS de flash y shrink
//   y oculta el texto de parpadeo. Marca el inicio de la transición.
const flashing = ref(false);

// Variable que guarda el ID del intervalo de parpadeo.
// Se usa para poder detenerlo con `clearInterval` cuando empieza el juego.
let blinkInterval: ReturnType<typeof setInterval>;

// ── CICLO DE VIDA: onMounted ──
// Esta función se ejecuta UNA SOLA VEZ cuando el componente aparece en pantalla.
// Inicia el intervalo que alterna `blink.value` cada 600 milisegundos.
onMounted(() => {
  blinkInterval = setInterval(() => {
    blink.value = !blink.value; // Invierte el valor (true → false, false → true)
  }, 600);
});

/**
 * Inicia el juego: detiene el parpadeo, reproduce sonido, activa animaciones,
 * redimensiona la ventana de Tauri y notifica al componente padre.
 */
async function start() {
  // Detenemos el intervalo de parpadeo para que no siga consumiendo recursos.
  clearInterval(blinkInterval);

  // Reproducimos el sonido de fanfarria de inicio (arpegio ascendente).
  playStart();

  // Activamos el estado "flashing". Esto dispara las clases CSS que animan
  // la pantalla (flash de colores + encogimiento del contenido).
  flashing.value = true;

  // Esperamos 500ms (medio segundo) para que las animaciones visuales ocurran
  // antes de redimensionar la ventana.
  await new Promise((r) => setTimeout(r, 500));

  // ── MANIPULACIÓN DE LA VENTANA TAURI ──
  // Obtenemos la ventana actual de la aplicación (la ventana nativa del SO).
  const appWindow = getCurrentWindow();

  // Permitimos que la ventana sea redimensionable por el usuario.
  await appWindow.setResizable(true);

  // Cambiamos el tamaño de la ventana a 1200x800 píxeles lógicos.
  // El `as any` es un truco de TypeScript porque Tauri espera un tipo específico
  // que TypeScript no reconoce directamente aquí.
  await appWindow.setSize({ type: "Logical", width: 1200, height: 800 } as any);

  // Centramos la ventana en la pantalla del usuario.
  await appWindow.center();

  // Emitimos el evento "start" hacia arriba (a App.vue).
  // App.vue escucha este evento y oculta la splash screen, mostrando la app real.
  emit("start");
}
</script>

<template>
  <!-- ── CONTENEDOR PRINCIPAL DE LA SPLASH SCREEN ── -->
  <!-- `fixed`: cubre toda la pantalla. `inset: 0`: top, right, bottom, left = 0 (cubre todo).
       `@click="start"`: hacer click en cualquier parte inicia el juego.
       `:class="{ flash: flashing }"`: añade clase "flash" cuando `flashing = true`
         para activar la animación de cambio de color del fondo. -->
  <div class="splash" @click="start" :class="{ flash: flashing }">
    <!-- ── CONTENIDO CENTRAL ── -->
    <!-- `:class="{ shrink: flashing }"`: cuando flashing, la caja se encoge (scale 0). -->
    <div class="splash-inner" :class="{ shrink: flashing }">
      <!-- Logo con el escudo pixel-art. `@mouseenter="playHover"`: sonido al pasar mouse. -->
      <div class="logo-block" @mouseenter="playHover">
        <PixelIcon name="shield" :size="32" color="var(--accent)" />
      </div>
      <!-- Título principal de la app en fuente pixel-art. -->
      <h1 class="game-title">RPGain</h1>
      <!-- Subtítulo descriptivo. -->
      <p class="subtitle">Quest Manager</p>
      <!-- Línea divisoria decorativa. -->
      <div class="divider"></div>
      <!-- Botón "Nueva Partida". `@click.stop="start"`: inicia el juego SIN propagar
           el click al contenedor padre (evita doble disparo). -->
      <button class="menu-btn" @click.stop="start" @mouseenter="playHover">
        <PixelIcon name="sword" :size="12" />
        <span>Nueva Partida</span>
      </button>
      <!-- Texto parpadeante. `:class="{ hidden: !blink || flashing }"`:
           se oculta si blink es false O si flashing es true (ya inició). -->
      <p class="blink-text" :class="{ hidden: !blink || flashing }">
        PRESS START TO CONTINUE
      </p>
      <!-- Versión de la app. -->
      <p class="version">v1.0.0</p>
    </div>

    <!-- ── EFECTOS VISUALES ── -->
    <!-- Scanlines: líneas horizontales simulando una pantalla CRT antigua.
         `pointer-events: none`: no interfiere con clicks. `z-index: 1`: detrás del overlay. -->
    <div class="scanlines"></div>
    <!-- Flash overlay: pantalla blanca que aparece brevemente al iniciar.
         Solo se renderiza cuando `flashing` es true (`v-if`). -->
    <div v-if="flashing" class="flash-overlay"></div>
  </div>
</template>

<style scoped>
/* ── ESTILOS DE LA SPLASH SCREEN ── */
/* `scoped`: solo afectan a este componente. */

.splash {
  position: fixed;           /* Fijado en la pantalla, cubre todo */
  inset: 0;                  /* Equivale a top:0; right:0; bottom:0; left:0 */
  z-index: 9999;             /* Muy alto: por encima de TODO lo demás */
  background: var(--bg-deep, #0a0a12); /* Fondo oscuro profundo */
  display: flex;
  align-items: center;         /* Centra verticalmente */
  justify-content: center;     /* Centra horizontalmente */
  cursor: pointer;             /* Indica que es clicable */
  image-rendering: pixelated;  /* Mantiene bordes afilados si hay imágenes */
}

/* Clase "flash": añadida cuando `flashing = true`.
   Activa la animación que cambia los colores del fondo rápidamente. */
.splash.flash {
  animation: screenFlash 0.5s steps(5) forwards;
  /* `steps(5)`: movimiento a saltos (5 fotogramas), estilo pixel-art.
     `forwards`: al terminar, mantiene el último estado. */
}

/* Caja central con borde, sombra, y contenido alineado al centro. */
.splash-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;                 /* Espacio entre cada elemento verticalmente */
  text-align: center;
  padding: 1rem;
  border: 3px solid var(--border-color, #312e81);
  background: var(--bg, #13131f);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.6); /* Sombra dura tipo pixel-art */
  width: 260px;                /* Ancho fijo para mantener proporción */
}

/* Clase "shrink": añadida cuando `flashing = true`.
   Encoge la caja central hasta desaparecer (scale 0). */
.splash-inner.shrink {
  animation: pixelShrink 0.5s steps(5) forwards;
}

/* Bloque del logo: cuadrado con borde y fondo sutil. */
.logo-block {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 2px solid var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  margin-bottom: 0.2rem;
}

/* Título del juego en fuente pixel-art con sombra retro. */
.game-title {
  font-family: "Press Start 2P", cursive;
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--accent, #a855f7);
  text-shadow: 3px 3px 0px var(--accent-dark, #7e22ce); /* Sombra desplazada tipo retro */
  margin: 0;
  letter-spacing: 0.06em;
}

/* Subtítulo en fuente más ligera pero monospace. */
.subtitle {
  font-family: "VT323", monospace;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  margin: 0;
  letter-spacing: 0.12em;
  text-transform: uppercase;   /* Todo en mayúsculas */
}

/* Línea divisoria horizontal decorativa. */
.divider {
  width: 70%;
  height: 2px;
  background: var(--border-color, #312e81);
  margin: 0.3rem 0;
}

/* Botón "Nueva Partida" estilo retro. */
.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;                 /* Espacio entre icono y texto */
  width: 100%;                 /* Ocupa todo el ancho de la caja */
  padding: 0.4rem 0.6rem;
  border: 2px solid var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--accent-light, #c084fc);
  font-family: "Press Start 2P", cursive;
  font-size: 0.42rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.08s;     /* Transición rápida al hover */
  margin: 0.2rem 0;
}

.menu-btn:hover {
  background: var(--accent, #a855f7); /* Fondo sólido al pasar mouse */
  color: #000;               /* Texto negro para contraste */
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
}

/* Texto parpadeante "PRESS START TO CONTINUE". */
.blink-text {
  font-family: "Press Start 2P", cursive;
  font-size: 0.38rem;
  color: var(--warning, #facc15); /* Amarillo/dorado */
  letter-spacing: 0.06em;
  margin: 0.2rem 0 0 0;
  transition: opacity 0.1s; /* Transición suave para el parpadeo */
}

/* Clase "hidden": añadida cuando blink es false o flashing es true.
   Hace que el texto sea completamente transparente. */
.blink-text.hidden {
  opacity: 0;
}

/* Número de versión en esquina, muy tenue. */
.version {
  font-family: "VT323", monospace;
  font-size: 0.55rem;
  color: var(--text-dim, #475569);
  margin: 0;
}

/* ── SCANLINES (Líneas de TV) ── */
/* Capa encima de todo que simula una pantalla CRT con líneas horizontales.
   `repeating-linear-gradient`: crea rayas horizontales repetidas cada 3px.
   `pointer-events: none`: permite clicks a través de esta capa.
   `z-index: 1`: por encima del fondo pero debajo del flash-overlay. */
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,                      /* Ángulo 0 = horizontal */
    rgba(0, 0, 0, 0.08),       /* Línea negra semi-transparente */
    rgba(0, 0, 0, 0.08) 1px,   /* La línea ocupa 1px */
    transparent 1px,           /* A partir de 1px, transparente */
    transparent 3px            /* Hasta 3px (creando un patrón de 3px) */
  );
  z-index: 1;
}

/* ── FLASH OVERLAY ── */
/* Capa blanca que cubre toda la pantalla brevemente.
   `pointer-events: none`: no bloquea interacciones.
   `z-index: 2`: por encima de scanlines.
   Animación `flashBurst`: opacidad 0 → 0.6 → 0.3 → 0 en medio segundo. */
.flash-overlay {
  position: absolute;
  inset: 0;
  background: #fff;          /* Blanco puro */
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  animation: flashBurst 0.5s steps(5) forwards;
}

/* ── KEYFRAMES (Animaciones) ── */

/* pixelShrink: encoge un elemento hasta desaparecer.
   Escala 1 (tamaño normal) → 0.7 → 0.3 → 0 (desaparecido).
   Opacidad baja simultáneamente. */
@keyframes pixelShrink {
  0% { transform: scale(1); opacity: 1; }
  40% { transform: scale(0.7); opacity: 0.6; }
  70% { transform: scale(0.3); opacity: 0.2; }
  100% { transform: scale(0); opacity: 0; }
}

/* screenFlash: cambia rápidamente el color de fondo de oscuro a morado claro.
   Simula el efecto de encender una pantalla retro o un flash de cámara. */
@keyframes screenFlash {
  0% { background: var(--bg-deep, #0a0a12); }
  40% { background: #2a1a4a; }  /* Morado oscuro */
  70% { background: #553388; }  /* Morado más claro */
  100% { background: var(--bg-deep, #0a0a12); }
}

/* flashBurst: animación de opacidad para el overlay blanco.
   Aparece rápidamente (0.6) y luego desaparece. */
@keyframes flashBurst {
  0% { opacity: 0; }
  30% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0; }
}
</style>
