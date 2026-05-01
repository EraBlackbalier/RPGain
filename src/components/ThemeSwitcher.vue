// ═══════════════════════════════════════════════════════════════
//  COMPONENTE: ThemeSwitcher (Selector de Temas / Reinos)
// ═══════════════════════════════════════════════════════════════
// Permite al usuario cambiar entre 10 temas de color distintos.
// Cada tema define un conjunto completo de variables CSS (colores)
// que cambian la apariencia de TODA la aplicación instantáneamente.
// Persiste la selección en localStorage para recordarla entre sesiones.
// ═══════════════════════════════════════════════════════════════

<script setup lang="ts">
// `ref`: variable reactiva (cambia la UI automáticamente).
import { ref } from "vue";
import PixelIcon from "./PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

// ── INTERFAZ THEME DEFINITION ──
// Define la forma que tiene cada tema: un ID único, nombre legible,
// y una paleta de colores completa usada por toda la app.
export interface ThemeDef {
  id: string;
  name: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  cardBg: string;
  cardBgHover: string;
  sidebarBg: string;
  borderColor: string;
  borderHover: string;
  bg: string;
  bgDeep: string;
  text: string;
  textMuted: string;
  textDim: string;
  success: string;
  info: string;
}

const THEMES: ThemeDef[] = [
  {
    id: "darkmage",
    name: "Dark Mage",
    accent: "#a855f7",
    accentLight: "#c084fc",
    accentDark: "#7e22ce",
    cardBg: "#1e1b4b",
    cardBgHover: "#252158",
    sidebarBg: "#0f0f1a",
    borderColor: "#312e81",
    borderHover: "#4338ca",
    bg: "#13131f",
    bgDeep: "#0a0a12",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    textDim: "#475569",
    success: "#39ff14",
    info: "#00f0ff",
  },
  {
    id: "terminal",
    name: "Terminal",
    accent: "#39ff14",
    accentLight: "#4ade80",
    accentDark: "#16a34a",
    cardBg: "#052e16",
    cardBgHover: "#064e3b",
    sidebarBg: "#022c22",
    borderColor: "#14532d",
    borderHover: "#16a34a",
    bg: "#020617",
    bgDeep: "#000f0a",
    text: "#bbf7d0",
    textMuted: "#6ee7b7",
    textDim: "#14532d",
    success: "#00ff41",
    info: "#22d3ee",
  },
  {
    id: "ambercrt",
    name: "Amber CRT",
    accent: "#f59e0b",
    accentLight: "#fbbf24",
    accentDark: "#b45309",
    cardBg: "#2a1b05",
    cardBgHover: "#3d2608",
    sidebarBg: "#1a1003",
    borderColor: "#78350f",
    borderHover: "#b45309",
    bg: "#140c02",
    bgDeep: "#0a0601",
    text: "#fde68a",
    textMuted: "#d97706",
    textDim: "#78350f",
    success: "#84cc16",
    info: "#facc15",
  },
  {
    id: "icecastle",
    name: "Ice Castle",
    accent: "#00f0ff",
    accentLight: "#67e8f9",
    accentDark: "#0891b2",
    cardBg: "#082f49",
    cardBgHover: "#0c4a6e",
    sidebarBg: "#042f2e",
    borderColor: "#155e75",
    borderHover: "#0891b2",
    bg: "#020c1b",
    bgDeep: "#010a14",
    text: "#cffafe",
    textMuted: "#67e8f9",
    textDim: "#155e75",
    success: "#4ade80",
    info: "#38bdf8",
  },
  {
    id: "dragonslair",
    name: "Dragon's Lair",
    accent: "#ef4444",
    accentLight: "#f87171",
    accentDark: "#991b1b",
    cardBg: "#2a0a0a",
    cardBgHover: "#3d1010",
    sidebarBg: "#1a0505",
    borderColor: "#7f1d1d",
    borderHover: "#b91c1c",
    bg: "#140303",
    bgDeep: "#0a0101",
    text: "#fecaca",
    textMuted: "#f87171",
    textDim: "#7f1d1d",
    success: "#facc15",
    info: "#fb923c",
  },
  {
    id: "royal",
    name: "Royal Court",
    accent: "#fbbf24",
    accentLight: "#fcd34d",
    accentDark: "#b45309",
    cardBg: "#2a1f0a",
    cardBgHover: "#3d2c0d",
    sidebarBg: "#1a1305",
    borderColor: "#78350f",
    borderHover: "#a16207",
    bg: "#140f03",
    bgDeep: "#0a0701",
    text: "#fef3c7",
    textMuted: "#d97706",
    textDim: "#78350f",
    success: "#22c55e",
    info: "#38bdf8",
  },
  {
    id: "void",
    name: "The Void",
    accent: "#a8a29e",
    accentLight: "#d6d3d1",
    accentDark: "#57534e",
    cardBg: "#1a1814",
    cardBgHover: "#26221c",
    sidebarBg: "#0f0d0a",
    borderColor: "#44403c",
    borderHover: "#57534e",
    bg: "#0c0a08",
    bgDeep: "#060504",
    text: "#e7e5e4",
    textMuted: "#a8a29e",
    textDim: "#57534e",
    success: "#84cc16",
    info: "#22d3ee",
  },
  {
    id: "ocean",
    name: "Abyssal Ocean",
    accent: "#3b82f6",
    accentLight: "#60a5fa",
    accentDark: "#1e40af",
    cardBg: "#0a1628",
    cardBgHover: "#0f2440",
    sidebarBg: "#060e1a",
    borderColor: "#1e3a5f",
    borderHover: "#2563eb",
    bg: "#040a14",
    bgDeep: "#02050a",
    text: "#dbeafe",
    textMuted: "#60a5fa",
    textDim: "#1e3a5f",
    success: "#34d399",
    info: "#818cf8",
  },
  {
    id: "forest",
    name: "Deep Forest",
    accent: "#84cc16",
    accentLight: "#a3e635",
    accentDark: "#3f6212",
    cardBg: "#0f1a0a",
    cardBgHover: "#16260f",
    sidebarBg: "#0a0f05",
    borderColor: "#365314",
    borderHover: "#4d7c0f",
    bg: "#060a03",
    bgDeep: "#030502",
    text: "#ecfccb",
    textMuted: "#a3e635",
    textDim: "#3f6212",
    success: "#22d3ee",
    info: "#facc15",
  },
  {
    id: "pinkpalace",
    name: "Pink Palace",
    accent: "#f472b6",
    accentLight: "#fbcfe8",
    accentDark: "#be185d",
    cardBg: "#2a0a1a",
    cardBgHover: "#3d1024",
    sidebarBg: "#1a0510",
    borderColor: "#831843",
    borderHover: "#be185d",
    bg: "#14030c",
    bgDeep: "#0a0106",
    text: "#fce7f3",
    textMuted: "#f472b6",
    textDim: "#831843",
    success: "#34d399",
    info: "#a78bfa",
  },
];

// ── ESTADO REACTIVO ──
// `open`: true/false. Controla si el dropdown de temas está visible.
const open = ref(false);

// `currentId`: ID del tema actualmente activo.
// Al iniciar, intenta leer del localStorage (clave "rpgain-theme").
// Si no hay nada guardado, usa "darkmage" (el tema por defecto).
const currentId = ref(localStorage.getItem("rpgain-theme") || "darkmage");

/**
 * Aplica un tema al documento completo.
 * Cada variable CSS (custom property) afecta a todos los componentes
 * que la usan (ej: `var(--accent)`, `var(--bg)`).
 *
 * `document.documentElement` es el elemento `<html>` raíz del documento.
 * Las "CSS Custom Properties" (variables CSS) se heredan a todos los hijos.
 *
 * Nota: `"26"` y `"14"` al final de colores son códigos hex de opacidad
 * para crear versiones translúcidas (ej: `#a855f726` ≈ 15% opacidad).
 */
function applyTheme(theme: ThemeDef) {
  const root = document.documentElement; // Accedemos al <html> del documento

  // Aplicamos cada color del tema como una variable CSS global.
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-light", theme.accentLight);
  root.style.setProperty("--accent-dark", theme.accentDark);
  root.style.setProperty("--accent-glow", theme.accent + "26");    // Versión tenue del acento
  root.style.setProperty("--card-bg", theme.cardBg);
  root.style.setProperty("--card-bg-hover", theme.cardBgHover);
  root.style.setProperty("--sidebar-bg", theme.sidebarBg);
  root.style.setProperty("--border-color", theme.borderColor);
  root.style.setProperty("--border-hover", theme.borderHover);
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--bg-deep", theme.bgDeep);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--text-muted", theme.textMuted);
  root.style.setProperty("--text-dim", theme.textDim);
  root.style.setProperty("--success", theme.success);
  root.style.setProperty("--info", theme.info);
  root.style.setProperty("--success-bg", theme.success + "14");     // Versión tenue para fondos
  root.style.setProperty("--info-bg", theme.info + "14");

  // Estos colores no cambian entre temas (fijos).
  root.style.setProperty("--warning", "#facc15");
  root.style.setProperty("--warning-bg", "rgba(250, 204, 21, 0.08)");
  root.style.setProperty("--danger", "#ef4444");
  root.style.setProperty("--danger-bg", "rgba(239, 68, 68, 0.08)");

  // Actualizamos el estado reactivo (la UI se actualiza inmediatamente).
  currentId.value = theme.id;

  // Guardamos en localStorage para que persista al recargar la app.
  localStorage.setItem("rpgain-theme", theme.id);
}

/** Selecciona un tema por su ID: lo busca en el array, lo aplica, suena, y cierra el dropdown. */
function select(themeId: string) {
  const theme = THEMES.find((t) => t.id === themeId);
  if (theme) {
    applyTheme(theme);
    playClick();
    close();
  }
}

/** Abre o cierra el dropdown de temas. Reproduce sonido de click. */
function toggle() {
  open.value = !open.value;
  playClick();
}

/** Cierra el dropdown de temas. */
function close() {
  open.value = false;
}

// ── APLICAR TEMA GUARDADO AL MONTAR ──
// Este código se ejecuta INMEDIATAMENTE al cargar el componente.
// Busca si el ID guardado en localStorage existe en nuestro array THEMES.
// Si existe, lo aplica para que la app arranque con el tema preferido.
const saved = THEMES.find((t) => t.id === currentId.value);
if (saved) applyTheme(saved);
</script>

<template>
  <!-- ── CONTENEDOR DEL SELECTOR DE TEMAS ── -->
  <!-- `position: relative` permite que el dropdown se posicione absolutamente respecto a este div. -->
  <div class="theme-switcher">
    <!-- Botón que abre/cierra el dropdown. Muestra un icono de gema (gem). -->
    <button class="theme-btn" @click="toggle" @mouseenter="playHover" title="Cambiar tema">
      <PixelIcon name="gem" :size="14" />
    </button>

    <!-- ── DROPDOWN DE TEMAS ── -->
    <!-- `v-if="open"`: solo se renderiza cuando el dropdown está abierto.
         Posicionado ABSOLUTAMENTE sobre el botón (hacia arriba). -->
    <div v-if="open" class="theme-dropdown">
      <!-- Cabecera del dropdown con título y botón de cerrar (X). -->
      <div class="theme-header">
        <span class="theme-title">SELECT REALM</span>
        <button class="theme-close" @click="close">
          <PixelIcon name="cross" :size="10" />
        </button>
      </div>
      <!-- Lista de opciones: iteramos sobre el array THEMES. -->
      <div class="theme-list">
        <button
          v-for="theme in THEMES"
          :key="theme.id"
          class="theme-option"
          :class="{ active: currentId === theme.id }"
          @click="select(theme.id)"
          @mouseenter="playHover"
        >
          <!-- Cuadrado de color que muestra el color acento de cada tema. -->
          <span class="theme-color" :style="{ background: theme.accent }"></span>
          <!-- Nombre legible del tema. -->
          <span class="theme-name">{{ theme.name }}</span>
          <!-- Checkmark: solo visible si este tema es el actualmente activo. -->
          <PixelIcon
            v-if="currentId === theme.id"
            name="check"
            :size="10"
            :color="theme.accent"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── ESTILOS DEL SELECTOR DE TEMAS ── */

.theme-switcher {
  position: relative;       /* Contexto de posicionamiento para el dropdown absoluto */
}

/* Botón pequeño cuadrado que activa el dropdown. */
.theme-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  color: var(--accent, #a855f7);
  cursor: pointer;
  transition: all 0.08s;    /* Transición rápida al hover */
  padding: 0;               /* Sin padding interno para mantener forma cuadrada */
}

.theme-btn:hover {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5); /* Sombra dura tipo pixel-art */
}

/* Dropdown que aparece ARRIBA del botón (bottom: calc(100% + 8px)).
   Se alinea a la derecha (right: 0) del contenedor relativo. */
.theme-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);  /* 8px de separación sobre el botón */
  right: 0;
  width: 200px;
  background: var(--card-bg, #1e1b4b);
  border: 3px solid var(--border-color, #312e81);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.6); /* Sombra dura grande */
  z-index: 200;              /* Por encima de otros elementos */
}

/* Cabecera con título a la izquierda y X a la derecha. */
.theme-header {
  display: flex;
  justify-content: space-between; /* Título a la izquierda, X a la derecha */
  align-items: center;
  padding: 0.5rem 0.6rem;
  border-bottom: 2px solid var(--border-color, #312e81);
}

/* Título "SELECT REALM" en fuente pixel-art muy pequeña. */
.theme-title {
  font-family: "Press Start 2P", cursive;
  font-size: 0.42rem;
  color: var(--accent-light, #c084fc);
  letter-spacing: 0.06em;
}

/* Botón X (cerrar) cuadrado y pequeño. */
.theme-close {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 0;
  transition: all 0.08s;
}

.theme-close:hover {
  border-color: var(--danger, #ef4444); /* Rojo al hover */
  color: var(--danger, #ef4444);
}

/* Lista de opciones de tema, apiladas verticalmente. */
.theme-list {
  display: flex;
  flex-direction: column;   /* Cada tema en su propia fila */
  gap: 0.15rem;             /* Mínimo espacio entre opciones */
  padding: 0.4rem;
}

/* Cada fila de opción de tema. */
.theme-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;              /* Espacio entre cuadrado de color, nombre, y check */
  padding: 0.4rem 0.5rem;
  background: transparent;
  border: 2px solid transparent; /* Borde invisible por defecto */
  color: var(--text, #e2e8f0);
  font-family: "VT323", monospace;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.08s;
}

/* Al pasar mouse: borde y fondo tenue. */
.theme-option:hover {
  border-color: var(--border-hover, #4338ca);
  background: var(--card-bg-hover, #252158);
}

/* Clase "active": estilo del tema ACTUALMENTE seleccionado. */
.theme-option.active {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
}

/* Cuadrado de color pequeño que muestra el acento del tema. */
.theme-color {
  width: 12px;
  height: 12px;
  flex-shrink: 0;           /* No se encoje */
  border: 2px solid var(--border-color, #312e81);
}

/* Nombre del tema: ocupa todo el espacio sobrante entre el cuadrado y el check. */
.theme-name {
  flex: 1;
}
</style>
