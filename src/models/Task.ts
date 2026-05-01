// ═══════════════════════════════════════════════════════════════
//  MODELO TASK (Tarea)
// ═══════════════════════════════════════════════════════════════
// Este archivo define la "forma" que tienen los datos de una Tarea.
// En programación, esto se llama un "modelo" o "interfaz":
// es un contrato que dice qué campos debe tener cada tarea.
// ═══════════════════════════════════════════════════════════════

// ── TIPOS BÁSICOS ──
// Estos son "tipos literales": solo permiten los valores listados.
// Es como crear tu propio vocabulario dentro del código.

/** Prioridad de una tarea: cuán urgente es */
export type TaskPriority = "low" | "normal" | "high" | "critical";
// "low"     = Baja urgencia (azul)
// "normal"  = Urgencia estándar (morado)
// "high"    = Alta urgencia (naranja)
// "critical"= Crítica, debe hacerse ya (rojo)

/** Tipo de tarea: ¿tiene fin o es infinita? */
export type TaskKind = "finite" | "endless";
// "finite"  = Tarea con pasos definidos (ej: leer 3 capítulos).
//             Cuando llegas al último paso, se marca como completada.
// "endless" = Tarea repetible (ej: meditar).
//             Nunca se "completa" del todo; cada vez que avanzas
//             ganas XP y se cuenta como una "iteración".

// ── INTERFAZ TASK ──
// Describe cómo luce UN OBJETO tarea que viene del backend (Rust/SQLite).
// Cada propiedad tiene un tipo (number, string, boolean, etc.)

export interface Task {
  id: number;                    // Identificador único numérico (1, 2, 3...)
  title: string;                 // Título de la misión (ej: "Leer libro")
  description: string;           // Descripción detallada opcional
  types: string[];                 // Array de etiquetas/categorías (ej: ["estudio", "lectura"])
  priority: string;                // Prioridad como texto (low/normal/high/critical)
  task_kind: string;             // "finite" o "endless" como texto
  xp_reward: number;             // Cuántos puntos XP ganas al completarla
  progress: number;                // Paso actual (ej: 2 de 5)
  progress_total: number;        // Total de pasos necesarios para completarla
  completed: boolean;            // true = ya terminaste la tarea
  iteration_count: number;       // Cuántas veces has completado una tarea "endless"
  created_at: string;            // Fecha de creación en formato ISO (ej: "2024-01-15T10:30:00Z")
  completed_at: string | null;   // Fecha de completado, o null si aún no termina
}

// ── INTERFAZ CREATE TASK PAYLOAD ──
// Describe los datos que NECESITAS ENVIAR al backend
// cuando quieres crear una tarea nueva.
// Las "?" significan que esos campos son OPCIONALES.

export interface CreateTaskPayload {
  title: string;                 // OBLIGATORIO: toda tarea necesita nombre
  description?: string;          // Opcional: detalles extra
  types?: string[];              // Opcional: etiquetas/categorías
  priority?: TaskPriority;         // Opcional: si no envías, usa "normal"
  task_kind?: TaskKind;          // Opcional: si no envías, usa "finite"
  xp_reward?: number;            // Opcional: recompensa XP (default 10)
  progress_total?: number;       // Opcional: cuántos pasos tiene (default 1)
}

// ── INTERFAZ UPDATE TASK PAYLOAD ──
// Describe los datos que NECESITAS ENVIAR al backend
// cuando quieres actualizar una tarea existente.
// Las "?" significan que esos campos son OPCIONALES.

export interface UpdateTaskPayload {
  id: number;
  title?: string;
  description?: string;
  types?: string[];
  priority?: TaskPriority;
  xp_reward?: number;
  progress_total?: number;
}

export type TaskFilter = {
  type: string | null;
  priority: TaskPriority | null;
  kind: TaskKind | null;
  showCompleted: boolean;
};
