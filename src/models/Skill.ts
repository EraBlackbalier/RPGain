// ═══════════════════════════════════════════════════════════════
//  MODELO SKILL (Árbol de Habilidades)
// ═══════════════════════════════════════════════════════════════
// Este archivo define la estructura de los datos para el sistema
// de "Skill Trees" (Árboles de Habilidades).
// Es como un sistema de talentos de RPG: desbloqueas nodos
// gastando XP que has ganado haciendo tareas de esa categoría.
// ═══════════════════════════════════════════════════════════════

// ── SKILL TREE (Árbol) ──
// Representa un árbol de habilidades completo.
// Cada árbol está ligado a un "tipo de tarea" (ej: "coding", "fitness").
// Toda la XP que ganes haciendo tareas de ese tipo se acumula aquí.

export interface SkillTree {
  id: number;                    // ID único del árbol
  task_type: string;           // Categoría de tarea (ej: "coding", "estudio")
  icon: string | null;         // Nombre del icono pixel-art (o null si no tiene)
  created_at: string;            // Fecha de creación en formato ISO
  available_xp: number;        // XP TOTAL ganada en esta categoría (desde xp_logs)
  spent_xp: number;            // XP YA GASTADA en nodos desbloqueados
  nodes: SkillNode[];          // Array con todos los nodos de este árbol
}

// ── SKILL NODE (Nodo) ──
// Representa UNA habilidad dentro del árbol.
// Puede estar bloqueada o desbloqueada.
// Para desbloquear necesitas: XP suficiente + padre desbloqueado.

export interface SkillNode {
  id: number;                  // ID único del nodo
  tree_id: number;             // ID del árbol al que pertenece
  name: string;                // Nombre del nodo (ej: "Concentración Avanzada")
  description: string;         // Descripción de qué hace la habilidad
  icon: string;                // Icono pixel-art que se muestra en la UI
  xp_cost: number;             // Cuánto XP cuesta desbloquear este nodo
  tier: number;                // Nivel del nodo (0 = raíz, 1, 2, 3...)
  parent_id: number | null;    // ID del nodo padre, o null si es raíz
  unlocked: boolean;           // true = ya lo compraste/desbloqueaste
  unlocked_at: string | null;  // Fecha de desbloqueo, o null si sigue bloqueado
}

// ── CREATE SKILL NODE PAYLOAD ──
// Datos que enviamos al backend (Rust) cuando creamos un nodo nuevo.
// Las propiedades con "?" son opcionales.

export interface CreateSkillNodePayload {
  tree_id: number;             // ID del árbol donde va el nodo
  name: string;                // Nombre del nodo (obligatorio)
  description?: string;        // Descripción (opcional)
  icon?: string;               // Icono (opcional)
  xp_cost: number;             // Costo en XP (obligatorio)
  tier: number;                // Nivel/tier del nodo (obligatorio)
  parent_id?: number | null;   // Padre (opcional; null = raíz)
}
