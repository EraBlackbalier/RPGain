// ═══════════════════════════════════════════════════════════════
//  MODELO ATTRIBUTE (Atributo / Recompensa Persistente)
// ═══════════════════════════════════════════════════════════════
// Un Attribute es una recompensa persistente que impacta el sistema.
// Puede ser un multiplicador de XP, un titulo, un badge visual,
// o un buff de stats. Se desbloquean al derrotar bosses, alcanzar
// logros, o cumplir condiciones especiales.
// ═══════════════════════════════════════════════════════════════

export type AttributeCategory = "buff" | "title" | "badge" | "perk";
export type AttributeSource = "boss" | "milestone" | "manual" | "quest";

export interface Attribute {
  id: number;
  session_id: number;
  name: string;
  description: string;
  icon: string;
  category: AttributeCategory;
  source: AttributeSource;
  source_id: number | null;       // ID del boss/quest que lo otorgó
  effect_type: string;            // "xp_multiplier" | "flat_xp" | "cosmetic" | "stat_boost"
  effect_value: number;           // ej: 1.1 para +10% XP, 50 para +50 flat XP
  rarity: number;                 // 1=common, 2=uncommon, 3=rare, 4=epic, 5=legendary
  unlocked: boolean;
  equipped: boolean;
  unlocked_at: string | null;
}

export interface CreateAttributePayload {
  session_id: number;
  name: string;
  description?: string;
  icon?: string;
  category?: AttributeCategory;
  source?: AttributeSource;
  source_id?: number | null;
  effect_type?: string;
  effect_value?: number;
  rarity?: number;
}
