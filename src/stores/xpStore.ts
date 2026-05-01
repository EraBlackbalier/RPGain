// ═══════════════════════════════════════════════════════════════
//  STORE: xpStore (Pinia - Gestión de Experiencia)
// ═══════════════════════════════════════════════════════════════
// Este store maneja todo lo relacionado con XP (puntos de experiencia).
// Incluye el historial de eventos de XP, el total acumulado,
// y estadísticas por categoría (tipo de tarea).
// ═══════════════════════════════════════════════════════════════

import { defineStore } from "pinia";
import { ref, computed } from "vue";

// Importamos los tipos de datos para XP (logs y resumen por categoría).
import type { XPLog, XPByType } from "../models/XP";

// Importamos el servicio que habla con el backend Rust/Tauri.
import * as tauriService from "../services/tauriService";

// ── CREACIÓN DEL STORE ──
export const useXpStore = defineStore("xp", () => {
  // ── ESTADO REACTIVO ──

  // Array con el historial completo de eventos de XP.
  // Cada elemento es un XPLog: { id, task_id, task_type, action, xp_amount, created_at }
  const logs = ref<XPLog[]>([]);

  // Array con XP total POR CATEGORÍA.
  // Ej: [{ task_type: "coding", total_xp: 150, log_count: 5 }, ...]
  const xpByType = ref<XPByType[]>([]);

  // Suma TOTAL de toda la XP ganada en la vida de la app (número entero).
  const totalLoggedXp = ref(0);

  // Indica si en este momento estamos cargando datos del backend.
  const loading = ref(false);

  // Guarda mensajes de error si algo falla al pedir datos.
  const error = ref<string | null>(null);

  // ── PROPIEDADES COMPUTADAS (computed) ──

  /** Las 10 categorías con más XP (para mostrar en gráficos o chips). */
  const topTypes = computed(() => xpByType.value.slice(0, 10));

  /**
   * El valor máximo de XP entre todas las categorías.
   * Se usa en gráficos para normalizar barras (escalar al 100%).
   * Si no hay datos, devuelve 1 para evitar división por cero.
   */
  const maxTypeXp = computed(() => {
    if (xpByType.value.length === 0) return 1;
    // `...` expande el array para que Math.max pueda operar sobre todos los valores.
    return Math.max(...xpByType.value.map((t) => t.total_xp), 1);
  });

  // ── ACCIONES ──

  /**
   * Carga TODO lo relacionado con XP de una sola vez.
   * Usa `Promise.all` para hacer 3 peticiones al backend EN PARALELO:
   *   - Últimos 50 logs
   *   - Resumen XP por tipo
   *   - Total de XP
   * Esto es más rápido que hacerlas una por una (secuencial).
   */
  async function fetchAll() {
    loading.value = true;   // Activamos indicador de carga
    error.value = null;     // Limpiamos errores previos
    try {
      // Desestructuramos el resultado del array de promesas.
      const [logsData, byType, total] = await Promise.all([
        tauriService.getXpLogs(50),    // Últimos 50 eventos de XP
        tauriService.getXpByType(),    // Resumen por categoría
        tauriService.getTotalLoggedXp(), // Número total acumulado
      ]);
      // Guardamos los datos recibidos en el estado reactivo.
      logs.value = logsData;
      xpByType.value = byType;
      totalLoggedXp.value = total;
    } catch (e) {
      // Si algo falla, guardamos el error como string.
      error.value = String(e);
      console.error("Error fetching XP data:", e);
    } finally {
      // Haya éxito o error, desactivamos el indicador de carga.
      loading.value = false;
    }
  }

  /**
   * Carga SOLO los logs de XP (historial).
   * `limit` es opcional: si se pasa, trae solo esa cantidad.
   */
  async function fetchLogs(limit?: number) {
    try {
      logs.value = await tauriService.getXpLogs(limit);
    } catch (e) {
      console.error("Error fetching XP logs:", e);
    }
  }

  /**
   * Refresca solo los datos agregados (total XP y por tipo).
   * Se usa después de completar/progresar una tarea para actualizar
   * las estadísticas sin recargar todo el historial.
   */
  async function refresh() {
    try {
      const [byType, total] = await Promise.all([
        tauriService.getXpByType(),
        tauriService.getTotalLoggedXp(),
      ]);
      xpByType.value = byType;
      totalLoggedXp.value = total;
    } catch (e) {
      console.error("Error refreshing XP:", e);
    }
  }

  // ── EXPORTACIÓN ──
  // Todo lo que retornamos aquí es ACCESIBLE desde los componentes.
  return {
    logs,          // Historial de eventos XP
    xpByType,      // Resumen por categoría
    totalLoggedXp, // Total acumulado
    loading,       // Estado de carga
    error,         // Mensaje de error
    topTypes,      // Top 10 categorías (computed)
    maxTypeXp,     // Máximo XP entre categorías (computed)
    fetchAll,      // Cargar todo
    fetchLogs,     // Cargar logs
    refresh,       // Refrescar resumen
  };
});
