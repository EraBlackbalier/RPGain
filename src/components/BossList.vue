<script setup lang="ts">
import { useBossStore } from "../stores/bossStore";
import PixelIcon from "./PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

const bossStore = useBossStore();

function statusLabel(status: string) {
  switch (status) {
    case "defeated": return "DEFEATED";
    case "in_progress": return "READY";
    case "available": return "ACTIVE";
    case "locked": return "LOCKED";
    default: return status.toUpperCase();
  }
}

function statusClass(status: string) {
  switch (status) {
    case "defeated": return "status-defeated";
    case "in_progress": return "status-ready";
    case "available": return "status-active";
    default: return "status-locked";
  }
}

function difficultyStars(d: number) {
  return "★".repeat(d) + "☆".repeat(5 - d);
}

function progressPercent(boss: any): number {
  if (!boss.requirements || boss.requirements.length === 0) return 100;
  const total = boss.requirements.reduce((s: number, r: any) => s + r.target_value, 0);
  const current = boss.requirements.reduce((s: number, r: any) => s + r.current_value, 0);
  if (total === 0) return 100;
  return Math.round((current / total) * 100);
}

function selectBoss(id: number) {
  playClick();
  bossStore.selectBoss(id);
}
</script>

<template>
  <div class="boss-list">
    <div
      v-for="boss in bossStore.bosses"
      :key="boss.id"
      class="boss-card"
      :class="[statusClass(boss.status), { selected: bossStore.selectedBossId === boss.id }]"
      @click="selectBoss(boss.id)"
      @mouseenter="playHover"
    >
      <div class="boss-icon-wrap">
        <PixelIcon :name="boss.icon || 'skull'" :size="24" />
      </div>
      <div class="boss-info">
        <div class="boss-top-row">
          <span class="boss-name">{{ boss.name }}</span>
          <span class="boss-status" :class="statusClass(boss.status)">{{ statusLabel(boss.status) }}</span>
        </div>
        <div class="boss-meta">
          <span class="boss-difficulty">{{ difficultyStars(boss.difficulty) }}</span>
          <span class="boss-xp">{{ boss.xp_reward }} XP</span>
        </div>
        <div class="boss-progress-track">
          <div class="boss-progress-fill" :class="statusClass(boss.status)" :style="{ width: progressPercent(boss) + '%' }"></div>
        </div>
        <div class="boss-req-count">
          {{ boss.requirements.filter((r: any) => r.completed).length }}/{{ boss.requirements.length }} requisitos
        </div>
      </div>
    </div>

    <div v-if="bossStore.bosses.length === 0 && !bossStore.loading" class="boss-empty">
      <PixelIcon name="skull" :size="28" color="var(--text-dim)" />
      <span>No hay bosses aun. Crea tu primer reto!</span>
    </div>
  </div>
</template>

<style scoped>
.boss-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.boss-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  cursor: pointer;
  transition: all 0.08s;
}
.boss-card:hover {
  border-color: var(--border-hover, #4338ca);
  background: var(--card-bg-hover, #252158);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}
.boss-card.selected {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
}
.boss-card.status-defeated {
  opacity: 0.65;
}

.boss-icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  flex-shrink: 0;
}

.boss-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.boss-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.boss-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text, #e2e8f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.boss-status {
  font-family: "Press Start 2P", cursive;
  font-size: 0.35rem;
  padding: 0.2em 0.5em;
  border: 1px solid;
  flex-shrink: 0;
}
.boss-status.status-defeated {
  color: var(--success, #39ff14);
  border-color: var(--success, #39ff14);
}
.boss-status.status-ready {
  color: var(--warning, #facc15);
  border-color: var(--warning, #facc15);
}
.boss-status.status-active {
  color: var(--danger, #ef4444);
  border-color: var(--danger, #ef4444);
}
.boss-status.status-locked {
  color: var(--text-dim, #475569);
  border-color: var(--text-dim, #475569);
}

.boss-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.boss-difficulty {
  font-size: 0.7rem;
  color: var(--warning, #facc15);
  letter-spacing: 0.05em;
}
.boss-xp {
  font-family: "VT323", monospace;
  font-size: 0.75rem;
  color: var(--accent, #a855f7);
}

.boss-progress-track {
  height: 4px;
  background: var(--bg-deep, #0a0a12);
  border: 1px solid var(--border-color, #312e81);
  overflow: hidden;
}
.boss-progress-fill {
  height: 100%;
  transition: width 0.3s;
}
.boss-progress-fill.status-defeated { background: var(--success, #39ff14); }
.boss-progress-fill.status-ready { background: var(--warning, #facc15); }
.boss-progress-fill.status-active { background: var(--danger, #ef4444); }
.boss-progress-fill.status-locked { background: var(--text-dim, #475569); }

.boss-req-count {
  font-family: "VT323", monospace;
  font-size: 0.7rem;
  color: var(--text-dim, #475569);
}

.boss-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--text-dim, #475569);
  font-family: "VT323", monospace;
  font-size: 0.9rem;
}
</style>
