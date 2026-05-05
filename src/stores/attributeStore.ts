import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Attribute, CreateAttributePayload } from "../models/Attribute";
import * as tauriService from "../services/tauriService";
import { useSessionStore } from "./sessionStore";

export const useAttributeStore = defineStore("attributes", () => {
  const attributes = ref<Attribute[]>([]);
  const loading = ref(false);

  const unlockedCount = computed(() =>
    attributes.value.filter((a) => a.unlocked).length
  );

  const equippedCount = computed(() =>
    attributes.value.filter((a) => a.equipped).length
  );

  const lockedCount = computed(() =>
    attributes.value.filter((a) => !a.unlocked).length
  );

  const activeEffects = computed(() =>
    attributes.value.filter((a) => a.unlocked && a.equipped)
  );

  const xpMultiplier = computed(() => {
    let mult = 1.0;
    for (const a of activeEffects.value) {
      if (a.effect_type === "xp_multiplier") {
        mult *= a.effect_value;
      }
    }
    return mult;
  });

  const flatXpBonus = computed(() => {
    let bonus = 0;
    for (const a of activeEffects.value) {
      if (a.effect_type === "flat_xp") {
        bonus += a.effect_value;
      }
    }
    return bonus;
  });

  const byCategory = computed(() => {
    const map: Record<string, Attribute[]> = {};
    for (const a of attributes.value) {
      if (!map[a.category]) map[a.category] = [];
      map[a.category].push(a);
    }
    return map;
  });

  async function fetchAttributes() {
    const sessionStore = useSessionStore();
    const sessionId = sessionStore.activeSessionId;
    if (!sessionId) return;
    loading.value = true;
    try {
      attributes.value = await tauriService.getAttributes(sessionId);
    } catch (e) {
      console.error("Failed to fetch attributes:", e);
    } finally {
      loading.value = false;
    }
  }

  async function addAttribute(payload: Omit<CreateAttributePayload, "session_id">) {
    const sessionStore = useSessionStore();
    const sessionId = sessionStore.activeSessionId;
    if (!sessionId) return;
    try {
      const full: CreateAttributePayload = { ...payload, session_id: sessionId };
      const attr = await tauriService.createAttribute(full);
      attributes.value.push(attr);
    } catch (e) {
      console.error("Failed to create attribute:", e);
    }
  }

  async function removeAttribute(id: number) {
    try {
      await tauriService.deleteAttribute(id);
      attributes.value = attributes.value.filter((a) => a.id !== id);
    } catch (e) {
      console.error("Failed to delete attribute:", e);
    }
  }

  async function unlock(id: number) {
    try {
      const updated = await tauriService.unlockAttribute(id);
      const idx = attributes.value.findIndex((a) => a.id === id);
      if (idx !== -1) attributes.value[idx] = updated;
    } catch (e) {
      console.error("Failed to unlock attribute:", e);
    }
  }

  async function toggleEquip(id: number) {
    try {
      const updated = await tauriService.toggleEquipAttribute(id);
      const idx = attributes.value.findIndex((a) => a.id === id);
      if (idx !== -1) attributes.value[idx] = updated;
    } catch (e) {
      console.error("Failed to toggle equip:", e);
    }
  }

  return {
    attributes,
    loading,
    unlockedCount,
    equippedCount,
    lockedCount,
    activeEffects,
    xpMultiplier,
    flatXpBonus,
    byCategory,
    fetchAttributes,
    addAttribute,
    removeAttribute,
    unlock,
    toggleEquip,
  };
});
