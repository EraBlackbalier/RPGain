// ═══════════════════════════════════════════════════════════════
//  MODELO CHARACTER (Personaje)
// ═══════════════════════════════════════════════════════════════
// Un "Character" es el héroe/avatar del jugador.
// Cada personaje puede tener múltiples sesiones de juego.
// ═══════════════════════════════════════════════════════════════

export interface Character {
  id: number;          // ID único del personaje
  name: string;        // Nombre del personaje (ej: "Aragorn", "Luna")
  created_at: string;  // Fecha de creación en formato ISO
}
