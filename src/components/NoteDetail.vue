<script setup lang="ts">
import { ref, computed } from "vue";
import { useNoteStore } from "../stores/noteStore";
import PixelIcon from "./PixelIcon.vue";

const noteStore = useNoteStore();
const isEditing = ref(false);
const editTitle = ref("");
const editDesc = ref("");
const editContent = ref("");
const editColor = ref("");

const COLOR_OPTIONS = [
  "#a855f7", "#22c55e", "#ef4444", "#3b82f6", "#f97316",
  "#06b6d4", "#ec4899", "#eab308", "#f43f5e", "#8b5cf6",
];

const htmlContent = computed(() => {
  if (!noteStore.selectedNote) return "";
  return renderMarkdown(noteStore.selectedNote.content || "");
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return "#";
}

function renderInline(value: string): string {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    return `<a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noreferrer">${label}</a>`;
  });
  return html;
}

function flushList(html: string[], listItems: string[], ordered: boolean) {
  if (listItems.length === 0) return;
  html.push(`<${ordered ? "ol" : "ul"}>${listItems.join("")}</${ordered ? "ol" : "ul"}>`);
  listItems.length = 0;
}

function renderMarkdown(markdown: string): string {
  const html: string[] = [];
  const listItems: string[] = [];
  let listOrdered = false;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (const line of markdown.split(/\r?\n/)) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList(html, listItems, listOrdered);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushList(html, listItems, listOrdered);
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushList(html, listItems, listOrdered);
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushList(html, listItems, listOrdered);
      html.push("<hr>");
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushList(html, listItems, listOrdered);
      html.push(`<blockquote>${renderInline(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      if (listItems.length > 0 && listOrdered !== isOrdered) {
        flushList(html, listItems, listOrdered);
      }
      listOrdered = isOrdered;
      listItems.push(`<li>${renderInline((ordered || unordered)![1])}</li>`);
      continue;
    }

    flushList(html, listItems, listOrdered);
    html.push(`<p>${renderInline(trimmed)}</p>`);
  }

  if (inCodeBlock) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  }
  flushList(html, listItems, listOrdered);
  return html.join("");
}

function startEdit() {
  if (!noteStore.selectedNote) return;
  editTitle.value = noteStore.selectedNote.title;
  editDesc.value = noteStore.selectedNote.description;
  editContent.value = noteStore.selectedNote.content;
  editColor.value = noteStore.selectedNote.color;
  isEditing.value = true;
}

async function saveEdit() {
  if (!noteStore.selectedNote) return;
  await noteStore.updateNote({
    id: noteStore.selectedNote.id,
    title: editTitle.value,
    description: editDesc.value,
    content: editContent.value,
    color: editColor.value,
  });
  isEditing.value = false;
}

async function deleteNote() {
  if (!noteStore.selectedNote) return;
  if (confirm(`¿Eliminar nota "${noteStore.selectedNote.title}"?`)) {
    await noteStore.deleteNote(noteStore.selectedNote.id);
  }
}

function cancelEdit() {
  isEditing.value = false;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div v-if="!noteStore.selectedNote" class="note-detail empty">
    <p>Selecciona una nota para verla</p>
  </div>

  <div v-else class="note-detail">
    <div v-if="!isEditing" class="note-view">
      <div class="note-header">
        <div class="note-header-top">
          <div class="note-title-section">
            <div class="note-color" :style="{ backgroundColor: noteStore.selectedNote.color }"></div>
            <h2 class="note-title">{{ noteStore.selectedNote.title }}</h2>
          </div>
          <div class="note-actions">
            <button class="btn-icon" @click="startEdit" title="Editar">
              <PixelIcon name="pencil" :size="14" />
            </button>
            <button class="btn-icon danger" @click="deleteNote" title="Eliminar">
              <PixelIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
        <p class="note-description">{{ noteStore.selectedNote.description }}</p>
        <p class="note-timestamp">Actualizado: {{ formatDate(noteStore.selectedNote.updated_at) }}</p>
      </div>

      <div class="note-markdown-view">
        <div class="markdown-content" v-html="htmlContent"></div>
      </div>
    </div>

    <div v-else class="note-edit">
      <div class="edit-header">
        <h3>Editar Nota</h3>
      </div>

      <div class="form-group">
        <label>Título *</label>
        <input v-model="editTitle" type="text" placeholder="Título de la nota" />
      </div>

      <div class="form-group">
        <label>Descripción breve</label>
        <input v-model="editDesc" type="text" placeholder="Descripción corta" />
      </div>

      <div class="form-group">
        <label>Color</label>
        <div class="color-picker">
          <button
            v-for="color in COLOR_OPTIONS"
            :key="color"
            class="color-option"
            :class="{ selected: editColor === color }"
            :style="{ backgroundColor: color }"
            @click="editColor = color"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Contenido (Markdown)</label>
        <textarea
          v-model="editContent"
          placeholder="Escribe tu contenido en markdown..."
          class="note-textarea"
        ></textarea>
      </div>

      <div class="edit-actions">
        <button class="btn-secondary" @click="cancelEdit">Cancelar</button>
        <button class="btn-accent" @click="saveEdit" :disabled="!editTitle.trim()">Guardar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.note-detail.empty {
  align-items: center;
  justify-content: center;
  color: #666;
}

.note-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.note-header {
  padding: 1rem;
  background: #0a0a12;
  border: 2px solid #312e81;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.note-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.note-title-section {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
}

.note-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.note-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
  color: #e0e0e0;
}

.note-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #312e81;
  background: #0a0a12;
  cursor: pointer;
  transition: all 0.2s;
  color: #a855f7;
}

.btn-icon:hover {
  border-color: #a855f7;
  background: #1a1a2e;
}

.btn-icon.danger {
  color: #ef4444;
}

.btn-icon.danger:hover {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.note-description {
  font-size: 0.95rem;
  color: #ccc;
  margin: 0;
}

.note-timestamp {
  font-size: 0.75rem;
  color: #666;
  margin: 0;
}

.note-markdown-view {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
  background: #0a0a12;
  border: 2px solid #312e81;
}

.markdown-content {
  color: #e0e0e0;
  line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: #a855f7;
  margin: 1rem 0 0.5rem 0;
  font-weight: 700;
}

.markdown-content :deep(h1) {
  font-size: 1.8rem;
  border-bottom: 2px solid #312e81;
  padding-bottom: 0.5rem;
}

.markdown-content :deep(h2) {
  font-size: 1.4rem;
}

.markdown-content :deep(h3) {
  font-size: 1.1rem;
}

.markdown-content :deep(code) {
  background: #1a1a2e;
  color: #22c55e;
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  font-family: "Courier New", monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background: #1a1a2e;
  color: #22c55e;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #a855f7;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #999;
  font-style: italic;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.markdown-content :deep(li) {
  margin: 0.5rem 0;
}

.markdown-content :deep(a) {
  color: #06b6d4;
  text-decoration: none;
  border-bottom: 1px solid #06b6d4;
}

.markdown-content :deep(a:hover) {
  color: #22c55e;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 2px solid #312e81;
  margin: 1.5rem 0;
}

.note-edit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
  background: #0a0a12;
  border: 2px solid #312e81;
}

.edit-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #a855f7;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
  padding: 0.6rem;
  background: #1a1a2e;
  border: 2px solid #312e81;
  color: #e0e0e0;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #a855f7;
  background: #0a0a12;
}

.note-textarea {
  resize: vertical;
  min-height: 200px;
  font-family: "Courier New", monospace;
  font-size: 0.9rem;
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
  transform: scale(1.1);
}

.color-option.selected {
  border-width: 3px;
  box-shadow: 0 0 8px currentColor;
}

.edit-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
}
</style>
