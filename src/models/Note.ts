// ═══════════════════════════════════════════════════════════════
//  MODELO NOTE (Bloc de Notas)
// ═══════════════════════════════════════════════════════════════
// Sistema simple de notas con soporte para markdown.
// Cada nota tiene título, descripción breve y contenido markdown.
// ═══════════════════════════════════════════════════════════════

export interface Note {
  id: number;
  session_id: number;
  title: string;                 // Nombre corto de la nota
  description: string;           // Descripción breve (1-2 líneas)
  content: string;               // Contenido markdown
  created_at: string;            // Fecha de creación ISO
  updated_at: string;            // Última actualización ISO
  color: string;                 // Color HEX para categorizar
}

export interface CreateNotePayload {
  session_id: number;
  title: string;
  description?: string;
  content?: string;
  color?: string;
}

export interface UpdateNotePayload {
  id: number;
  title?: string;
  description?: string;
  content?: string;
  color?: string;
}
