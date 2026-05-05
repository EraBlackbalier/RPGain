<script setup lang="ts">
import { ref } from "vue";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import * as tauriService from "../services/tauriService";
import { useSessionStore } from "../stores/sessionStore";
import { useTaskStore } from "../stores/taskStore";
import { useXpStore } from "../stores/xpStore";
import { useSkillStore } from "../stores/skillStore";
import PixelIcon from "./PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

const sessionStore = useSessionStore();
const taskStore = useTaskStore();
const xpStore = useXpStore();
const skillStore = useSkillStore();

const open_ = ref(false);
const loading = ref(false);
const message = ref<string | null>(null);

function toggle() {
  playClick();
  open_.value = !open_.value;
  message.value = null;
}

function close() {
  open_.value = false;
  message.value = null;
}

async function doExport() {
  playClick();
  loading.value = true;
  message.value = null;
  try {
    const sessionId = sessionStore.activeSessionId;
    if (!sessionId) { message.value = "No active session"; return; }

    const jsonStr = await tauriService.exportSessionData(sessionId);

    const charName = sessionStore.characterName ?? "hero";
    const sessName = sessionStore.sessionName ?? "session";
    const defaultName = `${charName}_${sessName}.rpgain`.replace(/\s+/g, "_").toLowerCase();

    const filePath = await save({
      defaultPath: defaultName,
      filters: [
        { name: "RPGain Save", extensions: ["rpgain"] },
        { name: "JSON", extensions: ["json"] },
      ],
    });

    if (!filePath) return; // user cancelled

    await writeTextFile(filePath, jsonStr);
    message.value = "Export OK!";
  } catch (e) {
    message.value = "Error: " + String(e);
    console.error("Export failed:", e);
  } finally {
    loading.value = false;
  }
}

async function doImport() {
  playClick();
  loading.value = true;
  message.value = null;
  try {
    const sessionId = sessionStore.activeSessionId;
    if (!sessionId) { message.value = "No active session"; return; }

    const filePath = await open({
      multiple: false,
      filters: [
        { name: "RPGain Save", extensions: ["rpgain"] },
        { name: "JSON", extensions: ["json"] },
      ],
    });

    if (!filePath) return; // user cancelled

    const jsonStr = await readTextFile(filePath);
    const result = await tauriService.importSessionData(sessionId, jsonStr);
    message.value = result;

    // Refresh all stores
    await taskStore.fetchTasks();
    await xpStore.fetchAll();
    await skillStore.fetchTrees();
  } catch (e) {
    message.value = "Error: " + String(e);
    console.error("Import failed:", e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="ie-wrapper">
    <button class="ie-btn" @click="toggle" @mouseenter="playHover" title="Import / Export">
      <PixelIcon name="scroll" :size="14" />
    </button>

    <div v-if="open_" class="ie-dropdown">
      <div class="ie-header">
        <span class="ie-title">IMPORT / EXPORT</span>
        <button class="ie-close" @click="close">
          <PixelIcon name="cross" :size="10" />
        </button>
      </div>

      <div class="ie-body">
        <button class="ie-action" @click="doExport" @mouseenter="playHover" :disabled="loading">
          <PixelIcon name="chest" :size="14" color="var(--success)" />
          <div class="ie-action-info">
            <span class="ie-action-label">Exportar Sesion</span>
            <span class="ie-action-desc">Guardar .rpgain / .json</span>
          </div>
        </button>

        <button class="ie-action" @click="doImport" @mouseenter="playHover" :disabled="loading">
          <PixelIcon name="potion" :size="14" color="var(--info)" />
          <div class="ie-action-info">
            <span class="ie-action-label">Importar Datos</span>
            <span class="ie-action-desc">Cargar .rpgain / .json</span>
          </div>
        </button>
      </div>

      <div v-if="message" class="ie-msg" :class="{ error: message.startsWith('Error') }">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ie-wrapper {
  position: relative;
}

.ie-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  color: var(--accent, #a855f7);
  cursor: pointer;
  transition: all 0.08s;
  padding: 0;
}
.ie-btn:hover {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.ie-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: var(--card-bg, #1e1b4b);
  border: 3px solid var(--border-color, #312e81);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.6);
  z-index: 200;
}

.ie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.6rem;
  border-bottom: 2px solid var(--border-color, #312e81);
}
.ie-title {
  font-family: "Press Start 2P", cursive;
  font-size: 0.38rem;
  color: var(--accent-light, #c084fc);
  letter-spacing: 0.06em;
}
.ie-close {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 0;
  transition: all 0.08s;
}
.ie-close:hover {
  border-color: var(--danger, #ef4444);
  color: var(--danger, #ef4444);
}

.ie-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.4rem;
}

.ie-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  background: transparent;
  border: 2px solid transparent;
  color: var(--text, #e2e8f0);
  cursor: pointer;
  text-align: left;
  transition: all 0.08s;
}
.ie-action:hover {
  border-color: var(--border-hover, #4338ca);
  background: var(--card-bg-hover, #252158);
}
.ie-action:disabled {
  opacity: 0.5;
  cursor: wait;
}

.ie-action-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.ie-action-label {
  font-family: "VT323", monospace;
  font-size: 0.9rem;
  color: var(--text, #e2e8f0);
}
.ie-action-desc {
  font-family: "VT323", monospace;
  font-size: 0.7rem;
  color: var(--text-dim, #475569);
}

.ie-msg {
  padding: 0.3rem 0.6rem;
  border-top: 2px solid var(--border-color, #312e81);
  font-family: "VT323", monospace;
  font-size: 0.75rem;
  color: var(--success, #39ff14);
}
.ie-msg.error {
  color: var(--danger, #ef4444);
}
</style>
