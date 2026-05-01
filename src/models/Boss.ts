// ═══════════════════════════════════════════════════════════════
//  MODELO BOSS (Jefe)
// ═══════════════════════════════════════════════════════════════
// Define la estructura de un "Boss" o jefe del juego.
// Un Boss es un objetivo grande que se derrota completando
// un conjunto específico de tareas. Al vencerlo ganas XP.
// ═══════════════════════════════════════════════════════════════

export interface Boss {
  id: number;              // ID único del boss (1, 2, 3...)
  name: string;            // Nombre del jefe (ej: "Procrastinación Final")
  description: string;     // Descripción de quién es o qué representa
  required_tasks: number[];// Array de IDs de tareas que debes completar para vencerlo
  xp_reward: number;       // Cuántos puntos XP ganas al derrotarlo
  defeated: boolean;       // true = ya lo venciste; false = aún no
}
