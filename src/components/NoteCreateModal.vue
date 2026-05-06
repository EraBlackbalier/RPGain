<script setup lang="ts">
import { ref } from "vue";
import { useNoteStore } from "../stores/noteStore";
import PixelIcon from "./PixelIcon.vue";

const emit = defineEmits<{
  (e: "close"): void;
}>();

const noteStore = useNoteStore();

const title = ref("");
const description = ref("");
const content = ref("");
const color = ref("#a855f7");

const COLOR_OPTIONS = [
  "#a855f7", "#22c55e", "#ef4444", "#3b82f6", "#f97316",
  "#06b6d4", "#ec4899", "#eab308", "#f43f5e", "#8b5cf6",
];

async function createNote() {
  if (!title.value.trim()) return;

  await noteStore.addNote({
    title: title.value.trim(),
    description: description.value.trim(),
    content: content.value,
    color: color.value,
  });

  // Limpiar y cerrar
  title.value = "";
  description.value = "";
  content.value = "";
  color.value = "#a855f7";
  emit("close");
}
</script>

<template>
  <div class="modal-overlay anim-fade" @click.self="emit('close')">
    <div class="modal-card anim-pop-in">
      <div class="modal-header">
        <h3>Nueva Nota</h3>
        <button class="btn-close" @click="emit('close')">
          <PixelIcon name="x" :size="16" />
        </button>
      </div>

      <div class="form-group">
        <label>Título *</label>
        <input v-model="title" type="text" placeholder="Mi nueva nota..." autofocus />
      </div>

      <div class="form-group">
        <label>Descripción breve</label>
        <input v-model="description" type="text" placeholder="Describe el contenido..." />
      </div>

      <div class="form-group">
        <label>Color</label>
        <div class="color-picker">
          <button
            v-for="c in COLOR_OPTIONS"
            :key="c"
            class="color-option"
            :class="{ selected: color === c }"
            :style="{ backgroundColor: c }"
            @click="color = c"
            type="button"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Contenido inicial (Markdown)</label>
        <textarea
          v-model="content"
          placeholder="Escribe tu contenido aquí...
Puedes usar **negrita**, *cursiva*, [links](https://...) y más."
          class="content-textarea"
        ></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="emit('close')">Cancelar</button>
        <button class="btn-accent" :disabled="!title.trim()" @click="createNote">Crear Nota</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  background: #1e1b4b;
  border: 2px solid #312e81;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  color: #a855f7;
  font-size: 1.3rem;
}

.btn-close {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 2px solid #312e81;
  background: #0a0a12;
  color: #a855f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  border-color: #a855f7;
  background: #1a1a2e;
}

.form-group {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-group input,
.form-group textarea {
  padding: 0.7rem;
  background: #0a0a12;
  border: 2px solid #312e81;
  color: #e0e0e0;
  font-family: inherit;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.3);
}

.content-textarea {
  resize: vertical;
  min-height: 150px;
  font-family: "Courier New", monospace;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.color-option {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid #312e81;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.05);
}

.color-option.selected {
  border-width: 3px;
  box-shadow: 0 0 12px currentColor;
}

.modal-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-cancel {
  padding: 0.6rem 1.2rem;
  background: #0a0a12;
  border: 2px solid #312e81;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: #888;
  color: #aaa;
}

.btn-accent {
  padding: 0.6rem 1.5rem;
  background: #a855f7;
  border: 2px solid #a855f7;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accent:hover:not(:disabled) {
  background: #9333ea;
  border-color: #9333ea;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.5);
}

.btn-accent:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
