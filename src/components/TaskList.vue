<script setup lang="ts">
import { useTaskStore } from "../stores/taskStore";
import TaskItem from "./TaskItem.vue";

const taskStore = useTaskStore();

function onComplete(id: number) {
  taskStore.markComplete(id);
}

function onDelete(id: number) {
  taskStore.removeTask(id);
}

function onProgress(id: number, value: number) {
  taskStore.setProgress(id, value);
}
</script>

<template>
  <div class="task-list">
    <div class="filters-bar anim-slide-up">
      <div class="filter-group">
        <select
          :value="taskStore.filters.kind ?? ''"
          @change="taskStore.setFilter('kind', ($event.target as HTMLSelectElement).value || null)"
        >
          <option value="">Todos los tipos</option>
          <option value="finite">Finite</option>
          <option value="endless">Endless</option>
        </select>

        <select
          :value="taskStore.filters.priority ?? ''"
          @change="taskStore.setFilter('priority', ($event.target as HTMLSelectElement).value || null)"
        >
          <option value="">Toda prioridad</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          v-if="taskStore.allTypes.length > 0"
          :value="taskStore.filters.type ?? ''"
          @change="taskStore.setFilter('type', ($event.target as HTMLSelectElement).value || null)"
        >
          <option value="">Todas las categorías</option>
          <option v-for="t in taskStore.allTypes" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="toggle-label">
          <input
            type="checkbox"
            :checked="taskStore.filters.showCompleted"
            @change="taskStore.setFilter('showCompleted', ($event.target as HTMLInputElement).checked)"
          />
          <span>Completadas</span>
        </label>

        <button
          v-if="taskStore.filters.type || taskStore.filters.priority || taskStore.filters.kind"
          class="clear-btn"
          @click="taskStore.resetFilters()"
        >Limpiar filtros</button>
      </div>
    </div>

    <div class="task-items">
      <TaskItem
        v-for="task in taskStore.filteredTasks"
        :key="task.id"
        :task="task"
        @complete="onComplete"
        @delete="onDelete"
        @progress="onProgress"
      />
      <p v-if="taskStore.filteredTasks.length === 0" class="empty-state anim-pop-in">
        {{ taskStore.tasks.length === 0
          ? 'No hay misiones. ¡Crea tu primera misión!'
          : 'No hay misiones con estos filtros.'
        }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 0.6rem 0.8rem;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

select {
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text, #e2e8f0);
  padding: 0.35em 0.6em;
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 0.08s;
}

select:focus {
  border-color: var(--accent, #a855f7);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
}

.toggle-label input[type="checkbox"] {
  accent-color: var(--accent, #a855f7);
}

.clear-btn {
  background: transparent;
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-muted, #94a3b8);
  padding: 0.3em 0.6em;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.08s;
}

.clear-btn:hover {
  border-color: var(--accent, #a855f7);
  color: var(--accent, #a855f7);
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  color: var(--text-dim, #475569);
  padding: 3rem 2rem;
  font-size: 0.85rem;
  background: var(--card-bg, #1e1b4b);
  border: 2px dashed var(--border-color, #312e81);
}
</style>
