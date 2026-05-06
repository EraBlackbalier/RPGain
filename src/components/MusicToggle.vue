<script setup lang="ts">
import { useMusicStore } from "../stores/musicStore";
import { playClick, playHover } from "../composables/usePixelSound";
import PixelIcon from "./PixelIcon.vue";

defineProps<{
  compact?: boolean;
}>();

const musicStore = useMusicStore();

async function toggleMusic() {
  playClick();
  await musicStore.toggle();
}
</script>

<template>
  <button
    class="music-toggle"
    :class="{ compact }"
    :title="musicStore.label"
    @click="toggleMusic"
    @mouseenter="playHover"
  >
    <PixelIcon :name="musicStore.icon" :size="compact ? 14 : 12" />
    <span v-if="!compact">{{ musicStore.playing ? "Pausar musica" : "Musica" }}</span>
  </button>
</template>

<style scoped>
.music-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 32px;
  padding: 0.38rem 0.65rem;
  border: 2px solid var(--border-color, #312e81);
  background: var(--card-bg, #1e1b4b);
  color: var(--accent, #a855f7);
  font-family: "Press Start 2P", cursive;
  font-size: 0.4rem;
  text-transform: uppercase;
  transition: all 0.08s;
}

.music-toggle.compact {
  width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0;
}

.music-toggle:hover {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
</style>
