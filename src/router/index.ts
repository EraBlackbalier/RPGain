// ═══════════════════════════════════════════════════════════════
//  ROUTER (Enrutador de Vue)
// ═══════════════════════════════════════════════════════════════
// Este archivo configura el "router" (enrutador) de Vue.
// El router decide qué vista mostrar según la URL del navegador.
// Por ejemplo:
//   - Si vas a "/" → muestra DashboardView
//   - Si vas a "/analytics" → muestra AnalyticsView
// ═══════════════════════════════════════════════════════════════

// Importamos las funciones necesarias de vue-router para crear el router.
import { createRouter, createWebHistory } from "vue-router";

// Importamos cada "vista" (view) que queremos mostrar en una ruta.
import DashboardView from "../views/DashboardView.vue";
import AnalyticsView from "../views/AnalyticsView.vue";
import SkillsView from "../views/SkillsView.vue";
import SkillTreesView from "../views/SkillTreesView.vue";

// ── DEFINICIÓN DE RUTAS ──
// Cada objeto en este array es una ruta.
// `path`: la URL (ej: "/skills")
// `name`: un nombre interno para referirnos a esta ruta en el código.
// `component`: el componente Vue que se renderiza cuando entras a esa URL.

const routes = [
  {
    path: "/",                   // URL raíz (inicio de la app)
    name: "Dashboard",           // Nombre interno de la ruta
    component: DashboardView,    // Vista del tablero principal
  },
  {
    path: "/analytics",          // URL de estadísticas
    name: "Analytics",
    component: AnalyticsView,
  },
  {
    path: "/skills",             // URL de árboles de habilidades (detalle)
    name: "Skills",
    component: SkillsView,
  },
  {
    path: "/skill-trees",        // URL de panorama de árboles
    name: "SkillTrees",
    component: SkillTreesView,
  },
];

// ── CREAR EL ROUTER ──
// `createWebHistory()`: usa la API de historial del navegador
//   (sin # en la URL, URLs limpias como "/skills").
// `routes`: le pasamos el array de rutas definido arriba.

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Exportamos el router para que `main.ts` lo registre en la app Vue.
export default router;
