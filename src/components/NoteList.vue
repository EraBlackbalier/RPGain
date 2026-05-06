<script setup lang="ts">
import { computed } from "vue";
import { useNoteStore } from "../stores/noteStore";
import PixelIcon from "./PixelIcon.vue";

const noteStore = useNoteStore();

const displayNotes = computed(() => noteStore.sortedNotes);

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
}

function truncateDescription(text: string, length: number = 60): string {
  return text.length > length ? text.substring(0, length) + "..." : text;
}
</script>

<template>
  <div class="notes-list">
    <div v-if="displayNotes.length === 0" class="empty-state">
      <p>No hay notas aún.</p>
      <p class="hint">Crea tu primera nota para empezar.</p>
    </div>

    <div v-else class="notes-container">
      <button
        v-for="note in displayNotes"
        :key="note.id"
        class="note-item"
        :class="{ active: noteStore.selectedNoteId === note.id }"
        @click="noteStore.selectNote(note.id)"
      >
        <div class="note-color" :style="{ backgroundColor: note.color }"></div>
        <div class="note-content">
          <div class="note-title">{{ note.title }}</div>
          <div class="note-desc">{{ truncateDescription(note.description) }}</div>
          <div class="note-date">{{ formatDate(note.updated_at) }}</div>
        </div>
        <PixelIcon name="arrow-right" :size="12" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: #666;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.empty-state .hint {
  font-size: 0.8rem;
  color: #555;
}

.notes-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem;
  background: #0a0a12;
  border: 2px solid #312e81;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.note-item:hover {
  border-color: #7c3aed;
  background: #1a1a2e;
  transform: translateX(4px);
}

.note-item.active {
  border-color: #a855f7;
  background: #16213e;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
}

.note-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.note-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.note-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-desc {
  font-size: 0.75rem;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.note-date {
  font-size: 0.65rem;
  color: #666;
}
</style>
