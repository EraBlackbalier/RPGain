// ═══════════════════════════════════════════════════════════════
//  STORE: noteStore (Pinia - Gestión de Notas)
// ═══════════════════════════════════════════════════════════════

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Note, CreateNotePayload, UpdateNotePayload } from "../models/Note";
import * as tauriService from "../services/tauriService";
import { useSessionStore } from "./sessionStore";

export const useNoteStore = defineStore("notes", () => {
  // ── ESTADO REACTIVO ──
  const notes = ref<Note[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedNoteId = ref<number | null>(null);

  // ── PROPIEDADES COMPUTADAS ──
  const selectedNote = computed(() =>
    notes.value.find((n) => n.id === selectedNoteId.value) ?? null
  );

  const sortedNotes = computed(() =>
    [...notes.value].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  );

  // ── ACCIONES ──

  /**
   * Carga todas las notas desde el backend.
   */
  async function fetchNotes() {
    loading.value = true;
    error.value = null;
    try {
      const sessionStore = useSessionStore();
      const sessionId = sessionStore.activeSessionId ?? 1;
      notes.value = await tauriService.getNotes(sessionId);
      if (notes.value.length === 0) {
        selectedNoteId.value = null;
      } else if (!notes.value.some((note) => note.id === selectedNoteId.value)) {
        selectedNoteId.value = sortedNotes.value[0].id;
      }
    } catch (e) {
      error.value = String(e);
      console.error("Error fetching notes:", e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crea una nueva nota.
   */
  async function addNote(payload: Omit<CreateNotePayload, "session_id">) {
    error.value = null;
    try {
      const sessionStore = useSessionStore();
      const sessionId = sessionStore.activeSessionId ?? 1;
      const full: CreateNotePayload = { ...payload, session_id: sessionId };
      const note = await tauriService.createNote(full);
      notes.value.push(note);
      selectedNoteId.value = note.id;
      return note;
    } catch (e) {
      error.value = String(e);
      console.error("Error creating note:", e);
    }
  }

  /**
   * Actualiza una nota existente.
   */
  async function updateNote(payload: UpdateNotePayload) {
    error.value = null;
    try {
      const updated = await tauriService.updateNote(payload);
      const idx = notes.value.findIndex((n) => n.id === payload.id);
      if (idx !== -1) notes.value[idx] = updated;
      return updated;
    } catch (e) {
      error.value = String(e);
      console.error("Error updating note:", e);
    }
  }

  /**
   * Elimina una nota.
   */
  async function deleteNote(noteId: number) {
    error.value = null;
    try {
      await tauriService.deleteNote(noteId);
      notes.value = notes.value.filter((n) => n.id !== noteId);
      if (selectedNoteId.value === noteId) {
        selectedNoteId.value = notes.value[0]?.id ?? null;
      }
    } catch (e) {
      error.value = String(e);
      console.error("Error deleting note:", e);
    }
  }

  /**
   * Selecciona una nota por ID.
   */
  function selectNote(id: number) {
    selectedNoteId.value = id;
  }

  return {
    notes,
    loading,
    error,
    selectedNoteId,
    selectedNote,
    sortedNotes,
    fetchNotes,
    addNote,
    updateNote,
    deleteNote,
    selectNote,
  };
});
