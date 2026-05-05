// ═══════════════════════════════════════════════════════════════
//  STORE: sessionStore (Pinia - Gestión de Sesiones y Personajes)
// ═══════════════════════════════════════════════════════════════
// Este store maneja los "Personajes" (Characters) y las "Sesiones" (Sessions).
// Cada personaje puede tener múltiples sesiones.
// Una sesión es como un "mundo independiente" con sus propias
// tareas, XP, árboles de habilidades y bosses.
// ═══════════════════════════════════════════════════════════════

import { defineStore } from "pinia";
import { ref, computed } from "vue";

import type { Character } from "../models/Character";
import type { Session } from "../models/Session";

import * as tauriService from "../services/tauriService";

export const useSessionStore = defineStore("session", () => {
  // ── ESTADO REACTIVO ──

  // Array con todos los personajes creados.
  const characters = ref<Character[]>([]);

  // Array con todas las sesiones del personaje activo.
  const sessions = ref<Session[]>([]);

  // La sesión ACTUALMENTE activa (la que se está jugando).
  // Se guarda en localStorage para persistir entre reinicios.
  const activeSessionId = ref<number | null>(null);

  // loading: true cuando estamos cargando datos.
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ── PROPIEDADES COMPUTADAS ──

  /** La sesión activa actual, o null si no hay. */
  const activeSession = computed(() => {
    if (activeSessionId.value === null) return null;
    return sessions.value.find((s) => s.id === activeSessionId.value) ?? null;
  });

  /** El personaje al que pertenece la sesión activa. */
  const activeCharacter = computed(() => {
    if (!activeSession.value) return null;
    return characters.value.find(
      (c) => c.id === activeSession.value!.character_id
    ) ?? null;
  });

  /** Nombre del personaje activo para mostrar en la UI. */
  const characterName = computed(() => {
    return activeCharacter.value?.name ?? "Hero";
  });

  /** Nombre de la sesión activa para mostrar en la UI. */
  const sessionName = computed(() => {
    return activeSession.value?.name ?? "Main";
  });

  // ── ACCIONES ──

  /**
   * Carga TODOS los personajes y sus sesiones desde el backend.
   * Si hay una sesión activa guardada, la selecciona.
   */
  async function loadAll() {
    loading.value = true;
    error.value = null;
    try {
      // Cargar personajes
      characters.value = await tauriService.getCharacters();

      // Si no hay personajes, crear uno por defecto
      if (characters.value.length === 0) {
        const newChar = await tauriService.createCharacter("Hero");
        characters.value = [newChar];
      }

      // Cargar sesiones del primer personaje (podría expandirse a múltiples)
      const charId = characters.value[0].id;
      sessions.value = await tauriService.getSessions(charId);

      // Si no hay sesiones, crear una por defecto
      if (sessions.value.length === 0) {
        const newSession = await tauriService.createSession(charId, "Main");
        sessions.value = [newSession];
        // Activarla
        await setActiveSession(newSession.id);
      } else {
        // Intentar cargar sesión activa guardada
        const saved = localStorage.getItem("rpgain_active_session_id");
        if (saved) {
          const savedId = parseInt(saved, 10);
          const exists = sessions.value.some((s) => s.id === savedId);
          if (exists) {
            activeSessionId.value = savedId;
          } else {
            // Si la guardada no existe, activar la primera
            await setActiveSession(sessions.value[0].id);
          }
        } else {
          // Si no hay guardada, buscar la activa en el backend o activar la primera
          const active = sessions.value.find((s) => s.is_active);
          if (active) {
            activeSessionId.value = active.id;
          } else {
            await setActiveSession(sessions.value[0].id);
          }
        }
      }
    } catch (e) {
      error.value = String(e);
      console.error("Error loading sessions:", e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crea un nuevo personaje.
   */
  async function addCharacter(name: string) {
    error.value = null;
    try {
      const char = await tauriService.createCharacter(name);
      characters.value.push(char);
      return char;
    } catch (e) {
      error.value = String(e);
      console.error("Error creating character:", e);
    }
  }

  /**
   * Crea una nueva sesión para un personaje.
   */
  async function addSession(characterId: number, name: string) {
    error.value = null;
    try {
      const session = await tauriService.createSession(characterId, name);
      sessions.value.push(session);
      return session;
    } catch (e) {
      error.value = String(e);
      console.error("Error creating session:", e);
    }
  }

  /**
   * Cambia la sesión activa.
   * Esto recarga toda la app con los datos de la nueva sesión.
   */
  async function setActiveSession(sessionId: number) {
    error.value = null;
    try {
      const session = await tauriService.setActiveSession(sessionId);
      // Actualizar estado local
      const idx = sessions.value.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        sessions.value[idx] = session;
      }
      // Desactivar las demás localmente
      sessions.value.forEach((s) => {
        if (s.id !== sessionId) s.is_active = false;
      });
      activeSessionId.value = sessionId;
      localStorage.setItem("rpgain_active_session_id", String(sessionId));
      return session;
    } catch (e) {
      error.value = String(e);
      console.error("Error setting active session:", e);
    }
  }

  // ── EXPORTACIÓN ──
  return {
    characters,
    sessions,
    activeSessionId,
    activeSession,
    activeCharacter,
    characterName,
    sessionName,
    loading,
    error,
    loadAll,
    addCharacter,
    addSession,
    setActiveSession,
  };
});
