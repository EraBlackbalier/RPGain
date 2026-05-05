// ═══════════════════════════════════════════════════════════════
//  MODELO SESSION (Sesión de Juego)
// ═══════════════════════════════════════════════════════════════
// Una "Session" (sesión) es un "mundo" o "partida" independiente.
// Cada sesión tiene su propio personaje, tareas, XP,
// árboles de habilidades y bosses.
// Puedes cambiar entre sesiones para jugar distintas aventuras.
// ═══════════════════════════════════════════════════════════════

export interface Session {
  id: number;              // ID único de la sesión
  character_id: number;    // ID del personaje al que pertenece
  character_name: string;  // Nombre del personaje (ej: "Aragorn")
  name: string;            // Nombre de la sesión (ej: "Aventura Principal")
  is_active: boolean;      // true = esta es la sesión activa actualmente
  created_at: string;      // Fecha de creación en formato ISO
}
