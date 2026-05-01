<script setup lang="ts">
import { computed } from "vue";
import type { Task } from "../models/Task";
import PixelIcon from "./PixelIcon.vue";
import { playHover, playComplete, playError, playTick } from "../composables/usePixelSound";

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  (e: "complete", id: number): void;
  (e: "delete", id: number): void;
  (e: "progress", id: number, value: number): void;
}>();

const progressPercent = computed(() => {
  if (props.task.progress_total <= 0) return 0;
  return Math.round((props.task.progress / props.task.progress_total) * 100);
});

const priorityColor = computed(() => {
  const map: Record<string, string> = {
    low: "#3b82f6",
    normal: "#8b5cf6",
    high: "#f59e0b",
    critical: "#ef4444",
  };
  return map[props.task.priority] || map.normal;
});

const priorityLabel = computed(() => {
  const map: Record<string, string> = {
    low: "BAJA",
    normal: "NORMAL",
    high: "ALTA",
    critical: "CRÍTICA",
  };
  return map[props.task.priority] || "NORMAL";
});

const isEndless = computed(() => props.task.task_kind === "endless");

function onComplete() {
  playComplete();
  emit("complete", props.task.id);
}

function onDelete() {
  playError();
  emit("delete", props.task.id);
}

function incrementProgress() {
  if (props.task.progress < props.task.progress_total) {
    playTick();
    emit("progress", props.task.id, props.task.progress + 1);
  }
}

function decrementProgress() {
  if (props.task.progress > 0) {
    playTick();
    emit("progress", props.task.id, props.task.progress - 1);
  }
}
</script>

<template>
  <div
    class="task-item anim-slide-up"
    :class="{ completed: task.completed, endless: isEndless }"
  >
    <div class="priority-bar" :style="{ background: priorityColor }"></div>

    <div class="task-body">
      <div class="task-top">
        <div class="task-left">
          <div class="task-header">
            <strong class="task-title">{{ task.title }}</strong>
            <span v-if="isEndless" class="badge endless-badge">ENDLESS</span>
            <span v-else-if="task.completed" class="badge done-badge">DONE</span>
          </div>

          <p v-if="task.description" class="task-desc">{{ task.description }}</p>

          <div class="task-meta">
            <span
              v-for="type in task.types"
              :key="type"
              class="type-tag"
            >{{ type }}</span>
            <span class="priority-tag" :style="{ color: priorityColor, borderColor: priorityColor + '44' }">{{ priorityLabel }}</span>
          </div>
        </div>

        <div class="task-right">
          <span class="task-xp">+{{ task.xp_reward }} XP</span>
          <div class="task-actions">
            <button
              class="action-btn complete-btn"
              @click="onComplete"
              @mouseenter="playHover"
              :disabled="task.completed && !isEndless"
              :title="isEndless ? 'Completar iteración' : 'Completar'"
            >
              <PixelIcon :name="isEndless ? 'loop' : 'check'" :size="12" />
              <span class="action-label">{{ isEndless ? "Iterar" : "Completar" }}</span>
            </button>
            <button
              class="action-btn delete-btn"
              @click="onDelete"
              @mouseenter="playHover"
              title="Eliminar"
            >
              <PixelIcon name="cross" :size="12" />
            </button>
          </div>
        </div>
      </div>

      <div class="task-bottom">
        <div class="progress-section" v-if="task.progress_total > 0">
          <div class="progress-row">
            <div class="progress-bar-wrap">
              <div
                class="progress-bar-fill"
                :style="{ width: progressPercent + '%', background: priorityColor }"
              ></div>
            </div>
            <span class="progress-pct">{{ progressPercent }}%</span>
          </div>
          <div class="progress-controls">
            <button class="prog-btn" @click="decrementProgress" @mouseenter="playHover" :disabled="task.progress <= 0 || task.completed">−</button>
            <span class="progress-text">{{ task.progress }} / {{ task.progress_total }}</span>
            <button class="prog-btn" @click="incrementProgress" @mouseenter="playHover" :disabled="task.completed && !isEndless">+</button>
            <span v-if="isEndless" class="iteration-badge">{{ task.iteration_count }} iteraciones</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-item {
  display: flex;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  overflow: hidden;
  transition: all 0.08s;
}

.task-item:hover {
  border-color: var(--border-hover, #4338ca);
  background: var(--card-bg-hover, #252158);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  animation: pixelBounce 0.3s steps(3);
}

.task-item.completed {
  opacity: 0.5;
}

.task-item.completed:hover {
  opacity: 0.7;
}

.priority-bar {
  width: 4px;
  flex-shrink: 0;
}

.task-body {
  flex: 1;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

.task-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.task-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.task-title {
  font-size: 0.95rem;
  color: var(--text, #e0e0e0);
}

.badge {
  font-family: "Press Start 2P", cursive;
  font-size: 0.45rem;
  font-weight: 400;
  padding: 0.3em 0.55em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.endless-badge {
  background: var(--info-bg, rgba(0, 240, 255, 0.08));
  color: #00f0ff;
  border: 2px solid rgba(0, 240, 255, 0.2);
}

.done-badge {
  background: var(--success-bg, rgba(57, 255, 20, 0.08));
  color: #39ff14;
  border: 2px solid rgba(57, 255, 20, 0.2);
}

.task-desc {
  font-size: 0.8rem;
  color: var(--text-muted, #888);
  margin: 0;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.type-tag {
  font-family: "Press Start 2P", cursive;
  font-size: 0.45rem;
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--accent, #a855f7);
  padding: 0.3em 0.55em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 2px solid rgba(168, 85, 247, 0.15);
}

.priority-tag {
  font-family: "Press Start 2P", cursive;
  font-size: 0.42rem;
  font-weight: 400;
  padding: 0.25em 0.5em;
  border: 2px solid;
  letter-spacing: 0.04em;
}

.task-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.task-xp {
  color: var(--accent, #a855f7);
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  padding: 0.2em 0.6em;
  border: 2px solid rgba(168, 85, 247, 0.2);
}

.task-actions {
  display: flex;
  gap: 0.3rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  border: 2px solid var(--border-color, #312e81);
  background: transparent;
  color: var(--text-muted, #94a3b8);
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0.3em 0.5em;
  transition: all 0.08s;
  white-space: nowrap;
}

.action-icon {
  font-size: 0.8rem;
}

.action-label {
  font-size: 0.65rem;
  font-weight: 600;
}

.action-btn.complete-btn {
  background: var(--success-bg, rgba(57, 255, 20, 0.08));
  color: var(--success, #39ff14);
  border: 2px solid var(--success, #39ff14);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.action-btn.complete-btn:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: translateY(-1px);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.action-btn.complete-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.action-btn.delete-btn:hover {
  filter: brightness(1.2);
  transform: translateY(-1px);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.action-btn.delete-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.prog-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text, #e2e8f0);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
  transition: all 0.08s;
}

.prog-btn:hover:not(:disabled) {
  border-color: var(--accent, #a855f7);
  color: var(--accent, #a855f7);
  transform: translateY(-1px);
}

.prog-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.prog-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-muted, #888);
  font-weight: 500;
}

.iteration-badge {
  font-family: "Press Start 2P", cursive;
  font-size: 0.45rem;
  color: #00f0ff;
  background: var(--info-bg, rgba(0, 240, 255, 0.08));
  padding: 0.25em 0.5em;
  margin-left: auto;
  font-weight: 400;
  border: 2px solid rgba(0, 240, 255, 0.2);
}
</style>
