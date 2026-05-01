<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTaskStore } from "../stores/taskStore";
import { useXpStore } from "../stores/xpStore";
import TaskList from "../components/TaskList.vue";
import TaskCreateModal from "../components/TaskCreateModal.vue";
import PixelIcon from "../components/PixelIcon.vue";

const taskStore = useTaskStore();
const xpStore = useXpStore();
const showCreate = ref(false);

onMounted(() => {
  taskStore.fetchTasks();
  xpStore.fetchAll();
});
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header anim-slide-up">
      <div>
        <h2>Dashboard</h2>
        <p class="subtitle">Tu centro de misiones</p>
      </div>
      <button class="btn-new" @click="showCreate = true">
        <PixelIcon name="xp" :size="12" />
        <span>Nueva Misión</span>
      </button>
    </div>

    <div class="stats-row">
      <div class="stat-card accent anim-pop-in delay-1">
        <div class="stat-icon-wrap accent-bg"><PixelIcon name="xp" :size="20" color="#a855f7" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ xpStore.totalLoggedXp }}</span>
          <span class="stat-label">XP Total</span>
        </div>
      </div>
      <div class="stat-card anim-pop-in delay-2">
        <div class="stat-icon-wrap warning-bg"><PixelIcon name="clock" :size="20" color="#facc15" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ taskStore.pendingCount }}</span>
          <span class="stat-label">Pendientes</span>
        </div>
      </div>
      <div class="stat-card anim-pop-in delay-3">
        <div class="stat-icon-wrap success-bg"><PixelIcon name="check" :size="20" color="#39ff14" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ taskStore.completedCount }}</span>
          <span class="stat-label">Completadas</span>
        </div>
      </div>
      <div class="stat-card anim-pop-in delay-4">
        <div class="stat-icon-wrap info-bg"><PixelIcon name="loop" :size="20" color="#00f0ff" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ taskStore.endlessCount }}</span>
          <span class="stat-label">Endless</span>
        </div>
      </div>
    </div>

    <div class="completion-bar-section anim-slide-up delay-2" v-if="taskStore.tasks.length > 0">
      <div class="completion-header">
        <span class="completion-label">Progreso general</span>
        <span class="completion-pct">{{ taskStore.completionRate }}%</span>
      </div>
      <div class="completion-track">
        <div class="completion-fill" :style="{ width: taskStore.completionRate + '%' }"></div>
      </div>
    </div>

    <div v-if="xpStore.topTypes.length > 0" class="xp-types-row anim-slide-up delay-3">
      <div
        v-for="entry in xpStore.topTypes.slice(0, 5)"
        :key="entry.task_type"
        class="xp-type-chip"
      >
        <span class="xp-type-name">{{ entry.task_type }}</span>
        <span class="xp-type-value">{{ entry.total_xp }} XP</span>
      </div>
    </div>

    <div class="section-header anim-slide-in delay-3">
      <h3 class="section-title">Misiones</h3>
      <span class="section-count">{{ taskStore.filteredTasks.length }} tareas</span>
    </div>

    <TaskList />

    <TaskCreateModal v-if="showCreate" @close="showCreate = false" />
  </div>
</template>

<style scoped>
.dashboard {
  padding: 1.5rem 2rem;
  max-width: 900px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.subtitle {
  color: var(--text-muted, #94a3b8);
  margin: 0;
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--accent, #a855f7);
  color: white;
  border: none;
  padding: 0.55em 1.2em;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.08s;
  white-space: nowrap;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.btn-new:hover {
  filter: brightness(1.12);
  transform: translateY(-2px);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5);
}

.btn-new:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.btn-icon {
  font-size: 1.1rem;
  font-weight: 700;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.65rem;
  margin-bottom: 1.2rem;
}

.stat-card {
  background: var(--card-bg, #1e1b4b);
  padding: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 2px solid var(--border-color, #312e81);
  transition: all 0.08s;
}

.stat-card:hover {
  border-color: var(--border-hover, #4338ca);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  animation: pixelBounce 0.3s steps(3);
}

.stat-card.accent {
  border-color: rgba(168, 85, 247, 0.3);
}

.stat-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.accent-bg {
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--accent, #a855f7);
}

.warning-bg {
  background: var(--warning-bg, rgba(250, 204, 21, 0.08));
  color: var(--warning, #facc15);
}

.success-bg {
  background: var(--success-bg, rgba(57, 255, 20, 0.08));
  color: var(--success, #39ff14);
}

.info-bg {
  background: var(--info-bg, rgba(0, 240, 255, 0.08));
  color: var(--info, #00f0ff);
}

.stat-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text, #e2e8f0);
  line-height: 1.2;
}

.stat-label {
  font-family: "Press Start 2P", cursive;
  font-size: 0.42rem;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.completion-bar-section {
  margin-bottom: 1.2rem;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 0.75rem 1rem;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.completion-label {
  font-family: "Press Start 2P", cursive;
  font-size: 0.45rem;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.completion-pct {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent, #a855f7);
}

.completion-track {
  height: 8px;
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: var(--accent, #a855f7);
  transition: width 0.2s;
  min-width: 2px;
}

.xp-types-row {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.xp-type-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  border: 2px solid rgba(168, 85, 247, 0.15);
  padding: 0.3em 0.75em;
  transition: all 0.08s;
}

.xp-type-chip:hover {
  border-color: rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.2);
}

.xp-type-name {
  font-size: 0.7rem;
  color: var(--text, #e2e8f0);
  text-transform: capitalize;
}

.xp-type-value {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--accent, #a855f7);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-title {
  font-family: "Press Start 2P", cursive;
  font-size: 0.5rem;
  font-weight: 400;
  color: var(--text, #e2e8f0);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.section-count {
  font-size: 0.7rem;
  color: var(--text-dim, #475569);
}
</style>
