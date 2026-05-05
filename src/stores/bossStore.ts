import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Boss, CreateBossPayload } from "../models/Boss";
import * as tauriService from "../services/tauriService";
import { useSessionStore } from "./sessionStore";
import { useXpStore } from "./xpStore";

export const useBossStore = defineStore("bosses", () => {
  const bosses = ref<Boss[]>([]);
  const loading = ref(false);
  const selectedBossId = ref<number | null>(null);

  const selectedBoss = computed(() =>
    bosses.value.find((b) => b.id === selectedBossId.value) ?? null
  );

  const defeatedCount = computed(() =>
    bosses.value.filter((b) => b.status === "defeated").length
  );

  const availableCount = computed(() =>
    bosses.value.filter((b) => b.status !== "defeated").length
  );

  const readyToDefeat = computed(() =>
    bosses.value.filter((b) => b.status === "in_progress").length
  );

  async function fetchBosses() {
    const sessionStore = useSessionStore();
    const sessionId = sessionStore.activeSessionId;
    if (!sessionId) return;
    loading.value = true;
    try {
      bosses.value = await tauriService.getBosses(sessionId);
    } catch (e) {
      console.error("Failed to fetch bosses:", e);
    } finally {
      loading.value = false;
    }
  }

  async function addBoss(payload: Omit<CreateBossPayload, "session_id">) {
    const sessionStore = useSessionStore();
    const sessionId = sessionStore.activeSessionId;
    if (!sessionId) return;
    try {
      const full: CreateBossPayload = { ...payload, session_id: sessionId };
      const boss = await tauriService.createBoss(full);
      bosses.value.push(boss);
    } catch (e) {
      console.error("Failed to create boss:", e);
    }
  }

  async function removeBoss(bossId: number) {
    try {
      await tauriService.deleteBoss(bossId);
      bosses.value = bosses.value.filter((b) => b.id !== bossId);
      if (selectedBossId.value === bossId) selectedBossId.value = null;
    } catch (e) {
      console.error("Failed to delete boss:", e);
    }
  }

  async function checkRequirements(bossId: number) {
    const sessionStore = useSessionStore();
    const sessionId = sessionStore.activeSessionId;
    if (!sessionId) return;
    try {
      const updated = await tauriService.checkBossRequirements(bossId, sessionId);
      const idx = bosses.value.findIndex((b) => b.id === bossId);
      if (idx !== -1) bosses.value[idx] = updated;
    } catch (e) {
      console.error("Failed to check requirements:", e);
    }
  }

  async function checkAllRequirements() {
    for (const boss of bosses.value) {
      if (boss.status !== "defeated") {
        await checkRequirements(boss.id);
      }
    }
  }

  async function defeatBoss(bossId: number) {
    const sessionStore = useSessionStore();
    const xpStore = useXpStore();
    const sessionId = sessionStore.activeSessionId;
    if (!sessionId) return;
    try {
      const updated = await tauriService.defeatBoss(bossId, sessionId);
      const idx = bosses.value.findIndex((b) => b.id === bossId);
      if (idx !== -1) bosses.value[idx] = updated;
      await xpStore.fetchAll();
    } catch (e) {
      console.error("Failed to defeat boss:", e);
      throw e;
    }
  }

  function selectBoss(id: number | null) {
    selectedBossId.value = id;
  }

  return {
    bosses,
    loading,
    selectedBossId,
    selectedBoss,
    defeatedCount,
    availableCount,
    readyToDefeat,
    fetchBosses,
    addBoss,
    removeBoss,
    checkRequirements,
    checkAllRequirements,
    defeatBoss,
    selectBoss,
  };
});
