// ═══════════════════════════════════════════════════════════════
//  COMPONENTE: AppTopbar (Barra Superior de Navegación)
// ═══════════════════════════════════════════════════════════════
// Este es el encabezado principal de la aplicación.
// Muestra: logo con nivel del jugador, navegación entre páginas,
// una barra mini de XP, y el selector de temas (ThemeSwitcher).
// Es fijo en la parte superior y está presente en todas las vistas.
// ═══════════════════════════════════════════════════════════════

<script setup lang="ts">
// ── IMPORTS ──
// `computed`: crea propiedades calculadas (reactivas, se recalculan automáticamente).
// `useRouter` / `useRoute`: hooks de vue-router para navegar y saber en qué ruta estamos.
// Los stores de Pinia (`useXpStore`, `useTaskStore`): acceden a datos globales de XP y tareas.
// `PixelIcon`: nuestro componente de iconos SVG pixel-art.
// `ThemeSwitcher`: componente para cambiar entre los 10 temas de color.
// `playClick`, `playHover`: funciones de sonido retro del composable usePixelSound.
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useXpStore } from "../stores/xpStore";
import { useTaskStore } from "../stores/taskStore";
import PixelIcon from "./PixelIcon.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";
import { playClick, playHover } from "../composables/usePixelSound";

// Instancias del router y ruta actual (para resaltar el botón activo).
const router = useRouter();
const route = useRoute();

// Stores de Pinia: accedemos a datos globales sin tener que pasar props entre componentes.
const xpStore = useXpStore();
const taskStore = useTaskStore();

// ── NAVEGACIÓN ──
// Array con los items del menú: cada uno tiene la ruta (URL), etiqueta y nombre del icono.
const navItems = [
  { path: "/", label: "Dashboard", icon: "sword" },
  { path: "/analytics", label: "Analytics", icon: "chart" },
  { path: "/skills", label: "Skills", icon: "star" },
  { path: "/skill-trees", label: "Skill Trees", icon: "tree" },
];

/** Navega a una ruta y reproduce el sonido de click retro. */
function navigate(path: string) {
  playClick();
  router.push(path);
}

// ── NIVEL Y XP ──
// Cada 100 XP = 1 nivel. Las `computed` se recalculan automáticamente
// cuando cambia `xpStore.totalLoggedXp`.

const XP_PER_LEVEL = 100;

/** Nivel actual del jugador: XP total // 100 + 1 (ej: 0-99 XP = nivel 1). */
const playerLevel = computed(() => {
  return Math.floor(xpStore.totalLoggedXp / XP_PER_LEVEL) + 1;
});

/** XP sobrante dentro del nivel actual (ej: 250 XP → 50 XP en el nivel 3). */
const xpInCurrentLevel = computed(() => {
  return xpStore.totalLoggedXp % XP_PER_LEVEL;
});

/** Porcentaje de progreso dentro del nivel actual (0-100%). */
const xpPercent = computed(() => {
  return Math.round((xpInCurrentLevel.value / XP_PER_LEVEL) * 100);
});

// ── BADGE (CONTADOR) ──
// Muestra un pequeño número rojo en la navegación si hay tareas pendientes.
// Solo se muestra en Dashboard ("/") por ahora.

function badgeFor(path: string): string | null {
  if (path === "/") {
    const p = taskStore.pendingCount;
    return p > 0 ? String(p) : null; // Si hay pendientes, devuelve el número como string
  }
  return null; // Para otras rutas, no hay badge
}
</script>

<template>
  <!-- ── ENCABEZADO PRINCIPAL ── -->
  <!-- `header`: etiqueta semántica de HTML5 para la cabecera de la página.
       La clase `topbar` aplica los estilos de la barra superior fija. -->
  <header class="topbar">
    <!-- ── LADO IZQUIERDO: LOGO + TÍTULO ── -->
    <div class="topbar-left">
      <!-- Bloque del logo: un cuadrado con el icono del escudo y el nivel superpuesto. -->
      <div class="logo-block">
        <PixelIcon name="shield" :size="22" color="var(--accent)" />
        <!-- `playerLevel`: propiedad computada que muestra el nivel actual del jugador.
             Se actualiza automáticamente cuando cambia la XP total. -->
        <span class="logo-lvl">{{ playerLevel }}</span>
      </div>
      <!-- Título de la app en fuente pixel-art. -->
      <h1 class="app-title">RPGain</h1>
    </div>

    <!-- ── NAVEGACIÓN CENTRAL ── -->
    <!-- `nav`: etiqueta semántica para la navegación principal.
         `v-for`: Vue itera sobre `navItems` para crear un botón por cada ruta.
         `:key`: identificador único requerido por Vue para cada elemento de un `v-for`.
         `:class="{ active: route.path === item.path }"`: añade la clase "active" si la
           ruta actual coincide con esta pestaña (resalta visualmente dónde estamos).
         `@click="navigate(item.path)"`: al hacer click, navega a esa ruta.
         `@mouseenter="playHover"`: reproduce sonido de hover al pasar el mouse. -->
    <nav class="topbar-nav">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
        @click="navigate(item.path)"
        @mouseenter="playHover"
      >
        <PixelIcon class="nav-icon" :name="item.icon" :size="14" />
        <span class="nav-label">{{ item.label }}</span>
        <!-- Badge: pequeño contador rojo que solo aparece si `badgeFor` devuelve un número.
             `v-if="badgeFor(item.path)"`: solo renderiza si hay valor (no null). -->
        <span v-if="badgeFor(item.path)" class="nav-badge">{{ badgeFor(item.path) }}</span>
      </button>
    </nav>

    <!-- ── LADO DERECHO: BARRA DE XP + SELECTOR DE TEMA ── -->
    <div class="topbar-right">
      <!-- Barra de progreso mini: muestra qué tan cerca estás del siguiente nivel. -->
      <div class="xp-bar-mini">
        <!-- Track: fondo de la barra. -->
        <div class="xp-mini-track">
          <!-- Fill: porción coloreada cuyo ancho es dinámico (`xpPercent`).
               `:style="{ width: xpPercent + '%' }"`: enlace reactivo al estilo CSS. -->
          <div class="xp-mini-fill" :style="{ width: xpPercent + '%' }"></div>
        </div>
        <span class="xp-mini-text">LVL {{ playerLevel }}</span>
      </div>
      <!-- ThemeSwitcher: componente para cambiar entre los 10 temas de color. -->
      <ThemeSwitcher />
    </div>
  </header>
</template>

<style scoped>
/* ── ESTILOS DE LA BARRA SUPERIOR ── */
/* `scoped`: estos estilos SOLO aplican a este componente (no afectan al resto). */
.topbar {
  /* Layout flex: distribuye los elementos horizontalmente con espacio entre ellos */
  display: flex;
  align-items: center;        /* Centra verticalmente los elementos */
  justify-content: space-between; /* Empuja los extremos a los lados, centro al medio */
  height: 52px;               /* Altura fija de la barra */
  background: var(--sidebar-bg, #0f0f1a); /* Fondo con fallback si la variable no existe */
  border-bottom: 2px solid var(--border-color, #312e81); /* Línea inferior de separación */
  padding: 0 1rem;            /* Espacio interno lateral */
  flex-shrink: 0;             /* Evita que la barra se encoja cuando el contenido crece */
  gap: 1rem;                  /* Espacio entre las 3 secciones (izq, centro, der) */
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;                /* Espacio entre logo y título */
  flex-shrink: 0;             /* No se encoje (mantiene tamaño fijo) */
}

.logo-block {
  position: relative;         /* Necesario para posicionar `logo-lvl` absolutamente */
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;      /* Centra el icono del escudo */
  border: 2px solid var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
}

.logo-lvl {
  position: absolute;           /* Se superpone al bloque del logo */
  bottom: -3px;               /* Un poco fuera del borde inferior */
  right: -5px;                /* Un poco fuera del borde derecho */
  font-family: "Press Start 2P", cursive; /* Fuente pixel-art */
  font-size: 0.4rem;            /* Texto muy pequeño (nivel del jugador) */
  color: var(--warning, #facc15); /* Amarillo/dorado para destacar */
  text-shadow: 1px 1px 0 #000;  /* Sombra para legibilidad sobre cualquier fondo */
  background: var(--bg-deep, #0a0a12); /* Fondo oscuro para que el número resalte */
  padding: 0 2px;
  line-height: 1;
}

.app-title {
  font-family: "Press Start 2P", cursive;
  font-size: 0.65rem;
  font-weight: 400;            /* No usar bold; la fuente ya es gruesa */
  color: var(--accent, #a855f7);
  margin: 0;                   /* Quitamos márgenes por defecto del h1 */
  letter-spacing: 0.04em;      /* Espaciado sutil para estética pixel */
  text-shadow: 2px 2px 0 var(--accent-dark, #7e22ce); /* Sombra tipo retro 8-bit */
}

.topbar-nav {
  display: flex;
  align-items: center;
  gap: 0.15rem;                /* Mínimo espacio entre botones de navegación */
  flex: 1;                     /* Ocupa TODO el espacio sobrante entre izquierda y derecha */
  justify-content: center;      /* Centra los botones en ese espacio */
}

.nav-item {
  position: relative;         /* Necesario para posicionar badges absolutamente si se quisiera */
  display: flex;
  align-items: center;
  gap: 0.4rem;                 /* Espacio entre icono, texto y badge */
  padding: 0.4rem 0.7rem;      /* Área clicable amplia */
  border: none;
  background: transparent;     /* Fondo transparente por defecto */
  color: var(--text-muted, #94a3b8); /* Color apagado cuando NO está activo */
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.08s;     /* Transición rápida (0.08s = 80ms) para respuesta inmediata */
  text-align: left;
  font-family: inherit;        /* Hereda la fuente del contenedor */
}

.nav-item:hover {
  background: var(--accent-glow, rgba(168, 85, 247, 0.15)); /* Fondo tenue al pasar mouse */
  color: var(--text, #e2e8f0); /* Texto más brillante */
}

.nav-item.active {
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--accent, #a855f7); /* Color de acento cuando está activo */
  border-bottom: 3px solid var(--accent, #a855f7); /* Indicador visual de pestaña activa */
}

.nav-icon {
  flex-shrink: 0;              /* El icono nunca se encoge */
}

.nav-label {
  white-space: nowrap;         /* Evita que el texto se parta en dos líneas */
}

.nav-badge {
  font-family: "Press Start 2P", cursive;
  font-size: 0.35rem;           /* Muy pequeño para un contador compacto */
  font-weight: 400;
  background: var(--danger, #ef4444); /* Rojo para alerta/urgencia */
  color: #fff;
  min-width: 16px;             /* Ancho mínimo para que sea cuadrado */
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;     /* Centra el número dentro del badge */
  padding: 0 3px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;                 /* Espacio entre barra de XP y ThemeSwitcher */
  flex-shrink: 0;             /* No se encoje */
}

.xp-bar-mini {
  display: flex;
  align-items: center;
  gap: 0.4rem;                /* Espacio entre la barra y el texto "LVL X" */
}

.xp-mini-track {
  width: 80px;                 /* Barra pequeña, solo indicativa */
  height: 6px;
  background: var(--bg-deep, #0a0a12); /* Fondo oscuro para la parte vacía */
  border: 2px solid var(--border-color, #312e81);
  overflow: hidden;           /* Oculta cualquier parte del fill que sobresalga */
}

.xp-mini-fill {
  height: 100%;                /* Ocupa toda la altura del track */
  background: var(--accent, #a855f7); /* Color de acento para la parte llena */
  transition: width 0.2s;     /* Animación suave cuando cambia el porcentaje */
}

.xp-mini-text {
  font-family: "Press Start 2P", cursive;
  font-size: 0.4rem;           /* Muy pequeño, decorativo */
  color: var(--text-muted, #94a3b8);
  letter-spacing: 0.04em;
  white-space: nowrap;       /* "LVL 5" no se parte en dos líneas */
}
</style>
