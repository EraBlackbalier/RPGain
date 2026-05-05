<script setup lang="ts">
import { ref, onMounted } from "vue";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import PixelIcon from "./PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

const enabled = ref(false);
const loading = ref(false);

onMounted(async () => {
  try {
    enabled.value = await isEnabled();
  } catch (e) {
    console.error("Autostart check failed:", e);
  }
});

async function toggle() {
  playClick();
  loading.value = true;
  try {
    if (enabled.value) {
      await disable();
      enabled.value = false;
    } else {
      await enable();
      enabled.value = true;
    }
  } catch (e) {
    console.error("Autostart toggle failed:", e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <button
    class="autostart-btn"
    :class="{ active: enabled }"
    :disabled="loading"
    @click="toggle"
    @mouseenter="playHover"
    :title="enabled ? 'Desactivar inicio automático' : 'Activar inicio automático'"
  >
    <PixelIcon name="zap" :size="14" :color="enabled ? 'var(--success)' : 'var(--text-dim)'" />
  </button>
</template>

<style scoped>
.autostart-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-dim, #475569);
  cursor: pointer;
  transition: all 0.08s;
  padding: 0;
}
.autostart-btn:hover {
  border-color: var(--success, #39ff14);
  background: var(--success-bg, rgba(57, 255, 20, 0.08));
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
.autostart-btn.active {
  border-color: var(--success, #39ff14);
  background: var(--success-bg, rgba(57, 255, 20, 0.08));
}
.autostart-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}
</style>
