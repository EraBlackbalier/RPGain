<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useNoteStore } from "../stores/noteStore";
import NoteCreateModal from "../components/NoteCreateModal.vue";
import NoteDetail from "../components/NoteDetail.vue";
import NoteList from "../components/NoteList.vue";
import PixelIcon from "../components/PixelIcon.vue";

const noteStore = useNoteStore();
const showCreate = ref(false);

onMounted(() => {
  noteStore.fetchNotes();
});
</script>

<template>
  <div class="notes-page">
    <div class="notes-header anim-slide-up">
      <div>
        <h2>Notas</h2>
        <p class="subtitle">Bloc de notas con markdown para planes, lore y builds</p>
      </div>
      <button class="btn-new" @click="showCreate = true">
        <PixelIcon name="book" :size="13" />
        <span>Nueva Nota</span>
      </button>
    </div>

    <div class="notes-layout anim-slide-up delay-1">
      <section class="notes-left">
        <div class="panel-title">
          <PixelIcon name="map" :size="14" color="var(--info)" />
          <span>Notas creadas</span>
        </div>
        <NoteList />
      </section>

      <section class="notes-right">
        <NoteDetail />
      </section>
    </div>

    <p v-if="noteStore.error" class="error-msg">{{ noteStore.error }}</p>
    <NoteCreateModal v-if="showCreate" @close="showCreate = false" />
  </div>
</template>

<style scoped>
.notes-page {
  height: 100%;
  max-width: 1180px;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-shrink: 0;
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
  box-shadow: var(--shadow-sm, 4px 4px 0 rgba(0, 0, 0, 0.5));
}

.btn-new:hover {
  filter: brightness(1.12);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 6px 6px 0 rgba(0, 0, 0, 0.5));
}

.notes-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  gap: 1rem;
}

.notes-left,
.notes-right {
  min-width: 0;
  min-height: 0;
}

.notes-left {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.notes-right {
  display: flex;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--info, #00f0ff);
  font-family: "Press Start 2P", cursive;
  font-size: 0.45rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.error-msg {
  color: var(--danger, #ef4444);
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 860px) {
  .notes-page {
    padding: 1rem;
  }

  .notes-layout {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}
</style>
