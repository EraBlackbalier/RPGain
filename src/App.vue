<script setup lang="ts">
import { ref } from "vue";
import AppTopbar from "./components/AppTopbar.vue";
import SplashScreen from "./components/SplashScreen.vue";

const showSplash = ref(true);

function onStart() {
  showSplash.value = false;
}
</script>

<template>
  <SplashScreen v-if="showSplash" @start="onStart" />
  <div v-else class="app-layout">
    <AppTopbar />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

:root {
  --accent: #a855f7;
  --accent-light: #c084fc;
  --accent-dark: #7e22ce;
  --accent-glow: rgba(168, 85, 247, 0.15);

  --card-bg: #1e1b4b;
  --card-bg-hover: #252158;
  --sidebar-bg: #0f0f1a;
  --border-color: #312e81;
  --border-hover: #4338ca;
  --bg: #13131f;
  --bg-deep: #0a0a12;
  --text: #e2e8f0;
  --text-muted: #94a3b8;
  --text-dim: #475569;

  --success: #39ff14;
  --success-bg: rgba(57, 255, 20, 0.08);
  --warning: #facc15;
  --warning-bg: rgba(250, 204, 21, 0.08);
  --danger: #ef4444;
  --danger-bg: rgba(239, 68, 68, 0.08);
  --info: #00f0ff;
  --info-bg: rgba(0, 240, 255, 0.08);

  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;

  --shadow-sm: 4px 4px 0px rgba(0, 0, 0, 0.5);
  --shadow-md: 6px 6px 0px rgba(0, 0, 0, 0.5);
  --shadow-lg: 8px 8px 0px rgba(0, 0, 0, 0.5);

  font-family: "VT323", monospace;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 400;
  color: var(--text);
  background-color: var(--bg);
  image-rendering: pixelated;

  font-synthesis: none;
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: unset;
  color-scheme: dark;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100%;
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: auto;
}

.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: var(--bg-deep);
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border: 2px solid var(--bg-deep);
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

h2 {
  font-family: "Press Start 2P", cursive;
  font-size: 0.85rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent-light);
  text-shadow: 2px 2px 0px var(--accent-dark);
}

button {
  cursor: pointer;
  font-family: inherit;
}

a {
  color: var(--accent);
  text-decoration: none;
}

::selection {
  background: var(--accent);
  color: #000;
}

/* ── Page transition ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.08s step-end;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Pixel-art keyframes ── */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes pixelPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-glow); }
  50%      { box-shadow: 0 0 0 4px var(--accent-glow); }
}
@keyframes pixelGlow {
  0%, 100% { box-shadow: 2px 2px 0 var(--accent-dark), 0 0 6px var(--accent-glow); }
  50%      { box-shadow: 2px 2px 0 var(--accent-dark), 0 0 16px var(--accent-glow); }
}
@keyframes pixelShake {
  0%, 100% { transform: translate(0, 0); }
  25%      { transform: translate(-2px, 1px); }
  50%      { transform: translate(2px, -1px); }
  75%      { transform: translate(-1px, -2px); }
}
@keyframes pixelBounce {
  0%, 100% { transform: translateY(0); }
  40%      { transform: translateY(-3px); }
  80%      { transform: translateY(1px); }
}
@keyframes scanGlow {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes barFill {
  from { width: 0%; }
}

/* ── Reusable animation classes ── */
.anim-slide-up   { animation: slideUp 0.2s steps(4) both; }
.anim-slide-in   { animation: slideIn 0.2s steps(4) both; }
.anim-pop-in     { animation: popIn  0.15s steps(3) both; }
.anim-pulse      { animation: pixelPulse 1.2s steps(4) infinite; }
.anim-glow       { animation: pixelGlow 1.5s steps(4) infinite; }
.anim-shake      { animation: pixelShake 0.3s steps(3); }
.anim-bounce     { animation: pixelBounce 0.3s steps(3); }

/* Stagger delays */
.delay-1 { animation-delay: 0.05s; }
.delay-2 { animation-delay: 0.10s; }
.delay-3 { animation-delay: 0.15s; }
.delay-4 { animation-delay: 0.20s; }

/* ── Global button hover / active animations ── */
button:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: none !important;
}

/* ── Focus ring ── */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ── Card hover glow helper ── */
.card-hover-glow:hover {
  animation: pixelGlow 0.6s steps(3) infinite alternate;
}
</style>