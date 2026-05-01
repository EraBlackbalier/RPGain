<script setup lang="ts">
import { ref, computed } from "vue";
import type { TaskPriority, TaskKind } from "../models/Task";
import { useTaskStore } from "../stores/taskStore";

const emit = defineEmits<{
  (e: "close"): void;
}>();

const taskStore = useTaskStore();

const title = ref("");
const description = ref("");
const typesInput = ref("");
const priority = ref<TaskPriority>("normal");
const taskKind = ref<TaskKind>("finite");
const xpReward = ref(10);
const progressTotal = ref(1);

const isValid = computed(() => title.value.trim().length > 0);

async function submit() {
  if (!isValid.value) return;

  const types = typesInput.value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  await taskStore.addTask({
    title: title.value.trim(),
    description: description.value.trim(),
    types,
    priority: priority.value,
    task_kind: taskKind.value,
    xp_reward: xpReward.value,
    progress_total: progressTotal.value,
  });

  emit("close");
}
</script>

<template>
  <div class="modal-overlay anim-fade" @click.self="emit('close')">
    <div class="modal-card anim-pop-in">
      <h3>Nueva Misión</h3>

      <div class="form-group">
        <label>Título *</label>
        <input v-model="title" placeholder="Nombre de la misión..." autofocus />
      </div>

      <div class="form-group">
        <label>Descripción</label>
        <textarea v-model="description" placeholder="Descripción opcional..." rows="2"></textarea>
      </div>

      <div class="form-group">
        <label>Tipos <span class="hint">(separados por coma)</span></label>
        <input v-model="typesInput" placeholder="ej: coding, estudio, fitness" />
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label>Prioridad</label>
          <select v-model="priority">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div class="form-group half">
          <label>Tipo de tarea</label>
          <select v-model="taskKind">
            <option value="finite">Finite</option>
            <option value="endless">Endless</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label>Recompensa XP</label>
          <input type="number" v-model.number="xpReward" min="1" max="10000" />
        </div>

        <div class="form-group half">
          <label>Pasos totales</label>
          <input type="number" v-model.number="progressTotal" min="1" max="10000" />
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="emit('close')">Cancelar</button>
        <button class="btn-create" :disabled="!isValid" @click="submit">Crear Misión</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

@keyframes modalFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.anim-fade {
  animation: modalFade 0.1s steps(2) both;
}

.modal-card {
  background: var(--card-bg, #1a1a2e);
  border: 2px solid var(--border-color, #312e81);
  padding: 1.5rem;
  width: 420px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5);
}

.modal-card h3 {
  margin: 0 0 1.2rem 0;
  font-size: 1.2rem;
  color: var(--accent, #7c3aed);
}

.form-group {
  margin-bottom: 0.9rem;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hint {
  font-size: 0.65rem;
  color: #555;
  text-transform: none;
  letter-spacing: 0;
}

input,
textarea,
select {
  width: 100%;
  background: var(--bg, #16162a);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text, #e0e0e0);
  padding: 0.5em 0.7em;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--accent, #7c3aed);
}

textarea {
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 0.75rem;
}

.half {
  flex: 1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.2rem;
}

.btn-cancel,
.btn-create {
  padding: 0.5em 1.2em;
  font-size: 0.85rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.08s;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.btn-cancel {
  background: transparent;
  color: #888;
  border: 2px solid var(--border-color, #312e81);
}

.btn-cancel:hover {
  border-color: #666;
  color: #ccc;
}

.btn-create {
  background: var(--accent, #7c3aed);
  color: white;
}

.btn-create:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: translateY(-1px);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.btn-create:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.btn-create:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
