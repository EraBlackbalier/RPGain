// ═══════════════════════════════════════════════════════════════
//  COMPONENTE: PixelIcon (Icono Pixel-Art SVG)
// ═══════════════════════════════════════════════════════════════
// Este componente renderiza iconos estilo pixel-art usando SVG inline.
// Recibe un `name` (nombre del icono) y opcionalmente `size` y `color`.
// Busca el SVG correspondiente en un diccionario (ICONS) y lo inyecta
// dentro de un elemento <svg> usando `v-html`.
// ═══════════════════════════════════════════════════════════════

<script setup lang="ts">
// `defineProps`: declaramos las propiedades (props) que este componente recibe.
// `name`: obligatorio, string. Identifica qué icono mostrar.
// `size`: opcional, number. Tamaño en píxeles (default 16).
// `color`: opcional, string. Color CSS para el icono.
defineProps<{
  name: string;
  size?: number;
  color?: string;
}>();

// ── DICCIONARIO DE ICONOS ──
// `Record<string, string>` significa: objeto donde la clave es un string (nombre del icono)
// y el valor es un string (código SVG).
// Cada valor es un fragmento SVG con paths, rects, circles, etc.
// Estos se inyectan directamente dentro del <g> del template.
const ICONS: Record<string, string> = {
  sword: `<path d="M2 14L6 10L10 14L14 10L10 6L14 2L10 6L6 2L2 6L6 10L2 14Z"/>`,
  chart: `<rect x="2" y="10" width="3" height="6"/><rect x="7" y="6" width="3" height="10"/><rect x="12" y="2" width="3" height="14"/>`,
  star: `<path d="M8 1L10 6H15L11 9L12 14L8 11L4 14L5 9L1 6H6L8 1Z"/>`,
  tree: `<rect x="6" y="12" width="4" height="4"/><path d="M8 2L2 10H6V12H10V10H14L8 2Z"/>`,
  xp: `<path d="M8 1L10 6H15L11 9L12 14L8 11L4 14L5 9L1 6H6L8 1Z"/>`,
  check: `<path d="M2 8L6 12L14 4" fill="none" stroke="currentColor" stroke-width="2"/>`,
  cross: `<path d="M3 3L13 13M13 3L3 13" fill="none" stroke="currentColor" stroke-width="2"/>`,
  clock: `<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 4V8L11 11" fill="none" stroke="currentColor" stroke-width="2"/>`,
  loop: `<path d="M12 4A6 6 0 0 0 4 8H1L5 12L9 8H6A4 4 0 0 1 14 8A6 6 0 0 1 2 12" fill="none" stroke="currentColor" stroke-width="2"/>`,
  lock: `<rect x="4" y="7" width="8" height="7"/><path d="M5 7V5A3 3 0 0 1 11 5V7" fill="none" stroke="currentColor" stroke-width="2"/>`,
  arrow: `<path d="M4 8H12M12 8L9 5M12 8L9 11" fill="none" stroke="currentColor" stroke-width="2"/>`,
  bolt: `<path d="M9 1L5 9H8L7 15L11 7H8L9 1Z"/>`,
  shield: `<path d="M8 1L2 4V9C2 12 8 15 8 15C8 15 14 12 14 9V4L8 1Z" fill="none" stroke="currentColor" stroke-width="2"/>`,
  heart: `<path d="M8 14C8 14 2 10 2 6C2 4 3 2 5 2C6.5 2 7.5 3 8 4C8.5 3 9.5 2 11 2C13 2 14 4 14 6C14 10 8 14 8 14Z"/>`,
  gem: `<path d="M8 1L2 6L8 14L14 6L8 1Z"/>`,
  flame: `<path d="M8 15C8 15 4 12 4 8C4 6 5 4 6 3C6 5 7 6 8 6C8 6 9 5 10 3C11 4 12 6 12 8C12 12 8 15 8 15Z"/>`,
  skull: `<path d="M5 3H11V7C11 9 10 10 10 10V12H6V10C6 10 5 9 5 7V3Z"/><circle cx="7" cy="6" r="1" fill="#000"/><circle cx="9" cy="6" r="1" fill="#000"/>`,
  potion: `<path d="M6 2H10V4L12 6V13H4V6L6 4V2Z" fill="none" stroke="currentColor" stroke-width="2"/><rect x="6" y="8" width="4" height="4"/>`,
  crown: `<path d="M2 10H14V12H2V10ZM2 10L4 4L7 7L10 4L12 10Z"/>`,
  map: `<path d="M2 3L6 1L10 3L14 1V13L10 15L6 13L2 15V3Z" fill="none" stroke="currentColor" stroke-width="2"/>`,
  book: `<rect x="3" y="2" width="10" height="12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 5H13M3 9H13" fill="none" stroke="currentColor" stroke-width="1"/>`,
  rune: `<path d="M8 1V15M2 8H14M3 3L13 13M13 3L3 13" fill="none" stroke="currentColor" stroke-width="2"/>`,
  eye: `<ellipse cx="8" cy="8" rx="5" ry="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="2"/>`,
  bag: `<rect x="4" y="5" width="8" height="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 5V3H10V5" fill="none" stroke="currentColor" stroke-width="2"/>`,
  key: `<circle cx="5" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 8H11V10H13V12H11V10H9" fill="none" stroke="currentColor" stroke-width="2"/>`,
  dice: `<rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><circle cx="6" cy="6" r="1"/><circle cx="10" cy="6" r="1"/><circle cx="6" cy="10" r="1"/><circle cx="10" cy="10" r="1"/>`,
};
</script>

<template>
  <!-- ── SVG CONTENEDOR ── -->
  <!-- `svg`: elemento gráfico vectorial escalable.
       `:width` y `:height`: tamaño dinámico (usa `size` si existe, sino 16px).
       `viewBox="0 0 16 16"`: define el sistema de coordenadas (16x16 unidades).
       `fill="currentColor"`: el color de relleno usa el color del texto actual del contenedor.
       `:style="color ? { color } : undefined"`: si se pasa `color`, lo usa como color CSS.
  -->
  <svg
    class="pixel-icon"
    :width="size || 16"
    :height="size || 16"
    viewBox="0 0 16 16"
    fill="currentColor"
    :style="color ? { color } : undefined"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- `v-html`: directiva de Vue que inyecta HTML crudo.
         Buscamos el SVG del icono por nombre. Si no existe, usamos el icono 'star' como fallback (por defecto).
    -->
    <g v-html="ICONS[name] || ICONS['star']" />
  </svg>
</template>

<style scoped>
/* ── ESTILOS DEL ICONO ── */
.pixel-icon {
  flex-shrink: 0;          /* Evita que el icono se encoja en layouts flex */
  image-rendering: pixelated; /* Hace que los SVG se vean nítidos/pixelados al escalar */
  shape-rendering: crispEdges; /* Bordes afilados, sin antialiasing suave */
}
</style>
