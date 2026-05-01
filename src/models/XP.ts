// ═══════════════════════════════════════════════════════════════
//  MODELO XP (Experiencia)
// ═══════════════════════════════════════════════════════════════
// Define la estructura de los registros de XP (puntos de experiencia).
// Cada vez que completas una tarea, el backend crea un "log" (registro)
// de cuánto XP ganaste, para qué tarea, y en qué categoría.
// ═══════════════════════════════════════════════════════════════

// ── XP LOG ──
// Representa UN SOLO evento de ganar XP.
// Es como una línea en tu historial de recompensas.

export interface XPLog {
  id: number;          // ID único del registro
  task_id: number;   // ID de la tarea que te dio esta XP
  task_type: string;   // Categoría/tipo de la tarea (ej: "coding", "fitness")
  action: string;      // Qué hiciste (ej: "complete", "progress", "iterate")
  xp_amount: number;   // Cuántos puntos ganaste en este evento
  created_at: string;  // Fecha exacta del evento en formato ISO
}

// ── XP BY TYPE ──
// Resume cuánto XP has ganado en total POR CATEGORÍA.
// Se usa en Analytics para mostrar gráficos de barras.

export interface XPByType {
  task_type: string;   // Nombre de la categoría (ej: "estudio")
  total_xp: number;    // Suma de toda la XP ganada en esa categoría
  log_count: number;   // Cuántos eventos/logs hay en esa categoría
}
