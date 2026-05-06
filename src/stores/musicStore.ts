import { defineStore } from "pinia";
import { computed, ref } from "vue";

const SOUNDTRACK_SRC = "/soundtrack.mp3";

export const useMusicStore = defineStore("music", () => {
  const audio = ref<HTMLAudioElement | null>(null);
  const enabled = ref(true);
  const playing = ref(false);
  const ready = ref(false);

  const icon = computed(() => (playing.value ? "pause" : "play"));
  const label = computed(() => (playing.value ? "Pausar musica" : "Reproducir musica"));

  function ensureAudio() {
    if (audio.value) return audio.value;

    const player = new Audio(SOUNDTRACK_SRC);
    player.loop = true;
    player.volume = 0.32;
    player.preload = "auto";
    player.addEventListener("playing", () => {
      playing.value = true;
      ready.value = true;
    });
    player.addEventListener("pause", () => {
      playing.value = false;
    });
    player.addEventListener("canplay", () => {
      ready.value = true;
    });
    audio.value = player;
    return player;
  }

  async function play() {
    enabled.value = true;

    const player = ensureAudio();
    try {
      await player.play();
      playing.value = true;
    } catch {
      playing.value = false;
    }
  }

  function pause() {
    enabled.value = false;
    audio.value?.pause();
    playing.value = false;
  }

  async function toggle() {
    if (playing.value) {
      pause();
      return;
    }
    await play();
  }

  async function startIfEnabled() {
    ensureAudio();
    if (enabled.value) {
      await play();
    }
  }

  return {
    enabled,
    playing,
    ready,
    icon,
    label,
    ensureAudio,
    play,
    pause,
    toggle,
    startIfEnabled,
  };
});
