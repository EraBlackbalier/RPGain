<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useTaskStore } from "../stores/taskStore";
import { useXpStore } from "../stores/xpStore";
import PixelIcon from "../components/PixelIcon.vue";
import ActivityChart from "../components/charts/ActivityChart.vue";
import TasksPerDayChart from "../components/charts/TasksPerDayChart.vue";
import XpByTypeChart from "../components/charts/XpByTypeChart.vue";
import LevelsChart from "../components/charts/LevelsChart.vue";

const taskStore = useTaskStore();
const xpStore = useXpStore();

onMounted(() => {
  xpStore.fetchAll();
  taskStore.fetchTasks();
});

const actionLabel: Record<string, string> = {
  complete: "Completada",
  progress: "Progreso",
  progress_complete: "Progreso (fin)",
  iteration: "Iteración",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const recentLogs = computed(() => xpStore.logs.slice(0, 20));
</script>

<template>
  <div class="analytics">
    <h2 class="anim-slide-up">Analytics</h2>
    <p class="subtitle anim-slide-up delay-1">Tu progreso y estadísticas</p>

    <div class="stats-row">
      <div class="stat-card accent anim-pop-in delay-1">
        <PixelIcon class="stat-icon" name="xp" :size="24" color="#a855f7" />
        <div>
          <span class="stat-value">{{ xpStore.totalLoggedXp }}</span>
          <span class="stat-label">XP Total</span>
        </div>
      </div>
      <div class="stat-card anim-pop-in delay-2">
        <PixelIcon class="stat-icon" name="check" :size="24" color="#39ff14" />
        <div>
          <span class="stat-value">{{ taskStore.completionRate }}%</span>
          <span class="stat-label">Completado</span>
        </div>
      </div>
      <div class="stat-card anim-pop-in delay-3">
        <PixelIcon class="stat-icon" name="sword" :size="24" color="#00f0ff" />
        <div>
          <span class="stat-value">{{ taskStore.tasks.length }}</span>
          <span class="stat-label">Misiones</span>
        </div>
      </div>
      <div class="stat-card anim-pop-in delay-4">
        <PixelIcon class="stat-icon" name="loop" :size="24" color="#facc15" />
        <div>
          <span class="stat-value">{{ taskStore.endlessCount }}</span>
          <span class="stat-label">Endless</span>
        </div>
      </div>
    </div>

    <div class="charts-grid anim-slide-up delay-2">
      <div class="chart-card full anim-pop-in">
        <h3 class="chart-title">Actividad — XP por día</h3>
        <ActivityChart :logs="xpStore.logs" />
      </div>

      <div class="chart-card anim-pop-in delay-1">
        <h3 class="chart-title">Tareas por día</h3>
        <TasksPerDayChart :tasks="taskStore.tasks" />
      </div>

      <div class="chart-card anim-pop-in delay-2">
        <h3 class="chart-title">XP por Tipo</h3>
        <XpByTypeChart :xp-by-type="xpStore.xpByType" />
      </div>

      <div class="chart-card anim-pop-in delay-3">
        <h3 class="chart-title">Niveles por Tipo</h3>
        <LevelsChart :xp-by-type="xpStore.xpByType" />
      </div>
    </div>

    <div class="section anim-slide-up delay-3" v-if="recentLogs.length > 0">
      <h3 class="section-title">Historial de XP</h3>
      <div class="xp-log-list">
        <div
          v-for="(log, idx) in recentLogs"
          :key="log.id"
          class="xp-log-item anim-slide-in"
          :style="{ animationDelay: (idx * 0.04) + 's' }"
        >
          <div class="log-left">
            <span class="log-action">{{ actionLabel[log.action] || log.action }}</span>
            <span class="log-type">{{ log.task_type }}</span>
          </div>
          <div class="log-right">
            <span class="log-xp">+{{ log.xp_amount }} XP</span>
            <span class="log-date">{{ formatDate(log.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <p v-if="xpStore.xpByType.length === 0 && recentLogs.length === 0" class="empty-state">
      Completa misiones para empezar a acumular XP.
    </p>
  </div>
</template>

<style scoped>
.analytics {
  padding: 1.5rem 2rem;
  max-width: 1100px;
}

.subtitle {
  color: var(--text-muted, #888);
  margin-bottom: 1.5rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.65rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 1rem;
  text-align: center;
  transition: all 0.08s;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.stat-card:hover {
  border-color: var(--border-hover, #4338ca);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  animation: pixelBounce 0.3s steps(3);
}

.stat-card.accent {
  border-color: rgba(168, 85, 247, 0.25);
}

.stat-card h3 {
  font-family: "Press Start 2P", cursive;
  font-size: 0.4rem;
  color: var(--text-muted, #94a3b8);
  margin: 0 0 0.3rem 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.big-number {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent, #a855f7);
}

.stat-icon {
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.62rem;
  color: var(--text-muted, #888);
  letter-spacing: 0.05em;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 1rem;
  transition: all 0.08s;
}

.chart-card:hover {
  border-color: var(--border-hover, #4338ca);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  animation: pixelBounce 0.3s steps(3);
}

.chart-card.full {
  grid-column: 1 / -1;
}

.chart-title {
  font-family: "Press Start 2P", cursive;
  font-size: 0.45rem;
  font-weight: 400;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 0.6rem 0;
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text, #e0e0e0);
  margin: 0 0 0.8rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.xp-log-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.xp-log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 0.55rem 0.85rem;
  transition: all 0.08s;
}

.xp-log-item:hover {
  border-color: var(--border-hover, #4338ca);
  background: var(--card-bg-hover, #252158);
}

.log-left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.log-action {
  font-size: 0.78rem;
  color: var(--text, #e0e0e0);
}

.log-type {
  font-size: 0.6rem;
  background: var(--accent-glow, rgba(124, 58, 237, 0.15));
  color: var(--accent, #7c3aed);
  padding: 0.12em 0.45em;
  border-radius: var(--radius-sm, 6px);
  text-transform: capitalize;
  border: 1px solid rgba(124, 58, 237, 0.1);
}

.log-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.log-xp {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--success, #22c55e);
}

.log-date {
  font-size: 0.65rem;
  color: var(--text-dim, #555);
}

.empty-state {
  text-align: center;
  color: var(--text-dim, #475569);
  padding: 3rem;
  background: var(--card-bg, #1e1b4b);
  border: 2px dashed var(--border-color, #312e81);
}
</style>
