<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useBossStore } from "../stores/bossStore";
import PixelIcon from "./PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

const bossStore = useBossStore();
const boss = computed(() => bossStore.selectedBoss);

const allReqsMet = computed(() =>
  boss.value ? boss.value.requirements.every((r) => r.completed) : false
);

function difficultyStars(d: number) {
  return "★".repeat(d) + "☆".repeat(5 - d);
}

function reqIcon(type: string): string {
  switch (type) {
    case "tasks_completed": return "check";
    case "xp_earned": return "xp";
    case "level_reached": return "star";
    case "skill_unlocked": return "tree";
    case "specific_task": return "sword";
    default: return "scroll";
  }
}

async function refreshRequirements() {
  if (!boss.value) return;
  playClick();
  await bossStore.checkRequirements(boss.value.id);
}

async function handleDefeat() {
  if (!boss.value || !allReqsMet.value) return;
  playClick();
  try {
    await bossStore.defeatBoss(boss.value.id);
  } catch (e) {
    console.error("Defeat failed:", e);
  }
}

async function handleDelete() {
  if (!boss.value) return;
  playClick();
  await bossStore.removeBoss(boss.value.id);
}

function close() {
  playClick();
  bossStore.selectBoss(null);
}

onMounted(() => {
  if (boss.value && boss.value.status !== "defeated") {
    bossStore.checkRequirements(boss.value.id);
  }
});
</script>

<template>
  <div v-if="boss" class="boss-detail">
    <div class="detail-header">
      <div class="detail-title-row">
        <div class="detail-icon">
          <PixelIcon :name="boss.icon || 'skull'" :size="28" />
        </div>
        <div>
          <h3 class="detail-name">{{ boss.name }}</h3>
          <div class="detail-meta">
            <span class="detail-difficulty">{{ difficultyStars(boss.difficulty) }}</span>
            <span class="detail-xp">{{ boss.xp_reward }} XP</span>
          </div>
        </div>
      </div>
      <button class="detail-close" @click="close" @mouseenter="playHover">
        <PixelIcon name="cross" :size="10" />
      </button>
    </div>

    <p class="detail-desc" v-if="boss.description">{{ boss.description }}</p>

    <div class="detail-section">
      <div class="section-label">
        <PixelIcon name="scroll" :size="12" color="var(--warning)" />
        REQUISITOS
      </div>
      <div class="req-list">
        <div
          v-for="req in boss.requirements"
          :key="req.id"
          class="req-item"
          :class="{ completed: req.completed }"
        >
          <div class="req-icon">
            <PixelIcon :name="reqIcon(req.requirement_type)" :size="14"
              :color="req.completed ? 'var(--success)' : 'var(--text-dim)'" />
          </div>
          <div class="req-info">
            <span class="req-desc">{{ req.description }}</span>
            <div class="req-progress-row">
              <div class="req-progress-track">
                <div
                  class="req-progress-fill"
                  :class="{ done: req.completed }"
                  :style="{ width: (req.target_value > 0 ? Math.min(100, (req.current_value / req.target_value) * 100) : 0) + '%' }"
                ></div>
              </div>
              <span class="req-progress-text">{{ req.current_value }}/{{ req.target_value }}</span>
            </div>
          </div>
          <PixelIcon v-if="req.completed" name="check" :size="12" color="var(--success)" />
        </div>
      </div>
      <button class="btn-refresh" @click="refreshRequirements" @mouseenter="playHover" v-if="boss.status !== 'defeated'">
        <PixelIcon name="loop" :size="12" />
        Verificar Progreso
      </button>
    </div>

    <div class="detail-section" v-if="boss.rewards.length > 0">
      <div class="section-label">
        <PixelIcon name="chest" :size="12" color="var(--accent)" />
        RECOMPENSAS
      </div>
      <div class="reward-list">
        <div
          v-for="rew in boss.rewards"
          :key="rew.id"
          class="reward-item"
          :class="{ claimed: rew.claimed }"
        >
          <PixelIcon name="gem" :size="14"
            :color="rew.claimed ? 'var(--success)' : 'var(--accent)'" />
          <span class="reward-desc">{{ rew.description }}</span>
          <span class="reward-value">{{ rew.value }}</span>
        </div>
      </div>
    </div>

    <div class="detail-actions" v-if="boss.status !== 'defeated'">
      <button
        class="btn-defeat"
        :disabled="!allReqsMet"
        @click="handleDefeat"
        @mouseenter="playHover"
      >
        <PixelIcon name="sword" :size="14" />
        Derrotar Boss
      </button>
      <button class="btn-delete" @click="handleDelete" @mouseenter="playHover">
        <PixelIcon name="cross" :size="12" />
        Eliminar
      </button>
    </div>

    <div v-if="boss.status === 'defeated'" class="defeated-banner">
      <PixelIcon name="check" :size="18" color="var(--success)" />
      <span>BOSS DERROTADO</span>
      <span class="defeated-date">{{ boss.defeated_at?.split('T')[0] }}</span>
    </div>
  </div>

  <div v-else class="boss-detail-empty">
    <PixelIcon name="skull" :size="32" color="var(--text-dim)" />
    <span>Selecciona un boss para ver detalles</span>
  </div>
</template>

<style scoped>
.boss-detail {
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.detail-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.detail-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  flex-shrink: 0;
}
.detail-name {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text, #e2e8f0);
}
.detail-meta {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}
.detail-difficulty {
  font-size: 0.75rem;
  color: var(--warning, #facc15);
}
.detail-xp {
  font-family: "VT323", monospace;
  font-size: 0.85rem;
  color: var(--accent, #a855f7);
  font-weight: 700;
}
.detail-close {
  width: 26px;
  height: 26px;
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
.detail-close:hover {
  border-color: var(--danger, #ef4444);
  color: var(--danger, #ef4444);
}

.detail-desc {
  color: var(--text-muted, #94a3b8);
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: "Press Start 2P", cursive;
  font-size: 0.38rem;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.req-list, .reward-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.req-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  background: var(--bg-deep, #0a0a12);
  border: 1px solid var(--border-color, #312e81);
  transition: all 0.08s;
}
.req-item.completed {
  border-color: rgba(57, 255, 20, 0.2);
}
.req-icon {
  flex-shrink: 0;
  width: 24px;
  display: flex;
  justify-content: center;
}
.req-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.req-desc {
  font-family: "VT323", monospace;
  font-size: 0.8rem;
  color: var(--text, #e2e8f0);
}
.req-progress-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.req-progress-track {
  flex: 1;
  height: 4px;
  background: var(--card-bg, #1e1b4b);
  border: 1px solid var(--border-color, #312e81);
  overflow: hidden;
}
.req-progress-fill {
  height: 100%;
  background: var(--danger, #ef4444);
  transition: width 0.3s;
}
.req-progress-fill.done {
  background: var(--success, #39ff14);
}
.req-progress-text {
  font-family: "VT323", monospace;
  font-size: 0.7rem;
  color: var(--text-dim, #475569);
  white-space: nowrap;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: var(--bg-deep, #0a0a12);
  border: 1px solid var(--border-color, #312e81);
}
.reward-item.claimed {
  opacity: 0.6;
}
.reward-desc {
  flex: 1;
  font-family: "VT323", monospace;
  font-size: 0.8rem;
  color: var(--text, #e2e8f0);
}
.reward-value {
  font-family: "VT323", monospace;
  font-size: 0.8rem;
  color: var(--accent, #a855f7);
  font-weight: 700;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.8rem;
  background: transparent;
  border: 2px solid var(--border-color, #312e81);
  color: var(--info, #00f0ff);
  font-family: "VT323", monospace;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.08s;
  align-self: flex-start;
}
.btn-refresh:hover {
  border-color: var(--info, #00f0ff);
  background: rgba(0, 240, 255, 0.08);
}

.detail-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.btn-defeat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  justify-content: center;
  padding: 0.55rem 1rem;
  background: var(--danger, #ef4444);
  border: none;
  color: white;
  font-family: "VT323", monospace;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.08s;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}
.btn-defeat:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: translateY(-2px);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5);
}
.btn-defeat:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-delete {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.55rem 0.8rem;
  background: transparent;
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-dim, #475569);
  font-family: "VT323", monospace;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.08s;
}
.btn-delete:hover {
  border-color: var(--danger, #ef4444);
  color: var(--danger, #ef4444);
}

.defeated-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem;
  background: rgba(57, 255, 20, 0.08);
  border: 2px solid rgba(57, 255, 20, 0.3);
  font-family: "Press Start 2P", cursive;
  font-size: 0.45rem;
  color: var(--success, #39ff14);
}
.defeated-date {
  font-family: "VT323", monospace;
  font-size: 0.75rem;
  color: var(--text-dim, #475569);
}

.boss-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-dim, #475569);
  font-family: "VT323", monospace;
  font-size: 0.9rem;
}
</style>
