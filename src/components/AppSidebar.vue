<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useXpStore } from "../stores/xpStore";
import { useTaskStore } from "../stores/taskStore";
import PixelIcon from "./PixelIcon.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";

const router = useRouter();
const route = useRoute();
const xpStore = useXpStore();
const taskStore = useTaskStore();

const navItems = [
  { path: "/", label: "Dashboard", icon: "sword" },
  { path: "/analytics", label: "Analytics", icon: "chart" },
  { path: "/skills", label: "Skills", icon: "star" },
  { path: "/skill-trees", label: "Skill Trees", icon: "tree" },
];

function navigate(path: string) {
  router.push(path);
}

const XP_PER_LEVEL = 100;

const playerLevel = computed(() => {
  return Math.floor(xpStore.totalLoggedXp / XP_PER_LEVEL) + 1;
});

const xpInCurrentLevel = computed(() => {
  return xpStore.totalLoggedXp % XP_PER_LEVEL;
});

const xpPercent = computed(() => {
  return Math.round((xpInCurrentLevel.value / XP_PER_LEVEL) * 100);
});

function badgeFor(path: string): string | null {
  if (path === "/") {
    const p = taskStore.pendingCount;
    return p > 0 ? String(p) : null;
  }
  return null;
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo-shield">
        <PixelIcon name="shield" :size="28" color="var(--accent)" />
        <span class="logo-level">{{ playerLevel }}</span>
      </div>
      <h1 class="app-title">RPGain</h1>
      <span class="app-subtitle">Quest Manager</span>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
        @click="navigate(item.path)"
      >
        <span class="nav-indicator"></span>
        <PixelIcon class="nav-icon" :name="item.icon" :size="16" />
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="badgeFor(item.path)" class="nav-badge">{{ badgeFor(item.path) }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="player-card">
        <div class="player-top">
          <span class="player-level-label">NIVEL</span>
          <span class="player-level-value">{{ playerLevel }}</span>
        </div>
        <div class="xp-bar">
          <div class="xp-fill" :style="{ width: xpPercent + '%' }"></div>
        </div>
        <div class="player-bottom">
          <span class="xp-text">{{ xpInCurrentLevel }} / {{ XP_PER_LEVEL }} XP</span>
          <span class="xp-total">{{ xpStore.totalLoggedXp }} total</span>
        </div>
      </div>
      <div class="theme-row">
        <ThemeSwitcher />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 230px;
  height: 100vh;
  background: var(--sidebar-bg, #0f0f1a);
  border-right: 2px solid var(--border-color, #312e81);
  display: flex;
  flex-direction: column;
  padding: 1.2rem 0.8rem;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
}

.logo-shield {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.3rem;
  position: relative;
}

.logo-level {
  position: absolute;
  bottom: -2px;
  right: -6px;
  font-family: "Press Start 2P", cursive;
  font-size: 0.5rem;
  font-weight: 400;
  color: var(--warning, #facc15);
  text-shadow: 1px 1px 0 #000;
}

.app-title {
  font-family: "Press Start 2P", cursive;
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--accent, #a855f7);
  margin: 0;
  letter-spacing: 0.04em;
  text-shadow: 2px 2px 0 var(--accent-dark, #7e22ce);
}

.app-subtitle {
  font-size: 0.65rem;
  color: var(--text-dim, #555);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.9rem;
  border: none;
  background: transparent;
  color: var(--text-muted, #94a3b8);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.08s;
  text-align: left;
}

.nav-item:hover {
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--text, #e2e8f0);
}

.nav-item.active {
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--accent, #a855f7);
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 0;
  background: var(--accent, #a855f7);
  transition: height 0.08s;
}

.nav-item.active .nav-indicator {
  height: 60%;
}

.nav-icon {
  font-size: 1rem;
  width: 1.2rem;
  text-align: center;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-family: "Press Start 2P", cursive;
  font-size: 0.4rem;
  font-weight: 400;
  background: var(--danger, #ef4444);
  color: #fff;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.sidebar-footer {
  border-top: 1px solid var(--border-color, #2a2a4a);
  padding-top: 0.8rem;
}

.player-card {
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.player-top {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.player-level-label {
  font-size: 0.6rem;
  color: var(--text-dim, #555);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.player-level-value {
  font-family: "Press Start 2P", cursive;
  font-weight: 400;
  color: var(--accent, #a855f7);
  font-size: 0.75rem;
  text-shadow: 1px 1px 0 var(--accent-dark, #7e22ce);
}

.xp-bar {
  height: 8px;
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: var(--accent, #a855f7);
  transition: width 0.2s;
}

.player-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.xp-text {
  font-size: 0.68rem;
  color: var(--text-muted, #888);
}

.xp-total {
  font-size: 0.62rem;
  color: var(--text-dim, #555);
}

.theme-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.6rem;
}
</style>
