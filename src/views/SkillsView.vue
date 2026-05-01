<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSkillStore } from "../stores/skillStore";
import SkillTreeView from "../components/SkillTreeView.vue";
import PixelIcon from "../components/PixelIcon.vue";

const skillStore = useSkillStore();

const ICON_OPTIONS = [
  "sword", "shield", "star", "heart", "flame", "bolt",
  "gem", "skull", "potion", "crown", "map", "book",
  "rune", "eye", "bag", "key", "dice", "tree",
];

const showCreateTree = ref(false);
const newTreeType = ref("");
const newTreeIcon = ref("");

const showCreateNode = ref(false);
const newNodeName = ref("");
const newNodeDesc = ref("");
const newNodeIcon = ref("");
const newNodeCost = ref(50);
const newNodeTier = ref(0);
const newNodeParent = ref<number | null>(null);

onMounted(() => {
  skillStore.fetchTrees();
});

async function createTree() {
  if (!newTreeType.value.trim()) return;
  await skillStore.addTree(newTreeType.value.trim().toLowerCase(), newTreeIcon.value.trim());
  newTreeType.value = "";
  newTreeIcon.value = "";
  showCreateTree.value = false;
}

async function createNode() {
  const tree = skillStore.selectedTree;
  if (!tree || !newNodeName.value.trim()) return;
  await skillStore.addNode({
    tree_id: tree.id,
    name: newNodeName.value.trim(),
    description: newNodeDesc.value.trim(),
    icon: newNodeIcon.value.trim(),
    xp_cost: newNodeCost.value,
    tier: newNodeTier.value,
    parent_id: newNodeParent.value,
  });
  newNodeName.value = "";
  newNodeDesc.value = "";
  newNodeIcon.value = "";
  newNodeCost.value = 50;
  newNodeTier.value = 0;
  newNodeParent.value = null;
  showCreateNode.value = false;
}

async function onUnlock(nodeId: number) {
  await skillStore.unlockNode(nodeId);
}
</script>

<template>
  <div class="skills">
    <div class="skills-header anim-slide-up">
      <div>
        <h2>Árbol de Habilidades</h2>
        <p class="subtitle">Desbloquea habilidades con tu XP por categoría</p>
      </div>
      <div class="header-actions">
        <button class="btn-accent" @click="showCreateTree = true">+ Nuevo Árbol</button>
        <button
          v-if="skillStore.selectedTree"
          class="btn-secondary"
          @click="showCreateNode = true"
        >+ Nuevo Nodo</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card anim-pop-in delay-1">
        <span class="stat-value">{{ skillStore.trees.length }}</span>
        <span class="stat-label">Árboles</span>
      </div>
      <div class="stat-card anim-pop-in delay-2">
        <span class="stat-value">{{ skillStore.totalUnlocked }}</span>
        <span class="stat-label">Desbloqueados</span>
      </div>
      <div class="stat-card anim-pop-in delay-3">
        <span class="stat-value">{{ skillStore.totalNodes }}</span>
        <span class="stat-label">Nodos Total</span>
      </div>
    </div>

    <div v-if="skillStore.trees.length > 1" class="tree-tabs anim-slide-up delay-2">
      <button
        v-for="(tree, idx) in skillStore.trees"
        :key="tree.id"
        class="tree-tab anim-pop-in"
        :class="{ active: skillStore.selectedTree?.id === tree.id }"
        :style="{ animationDelay: (idx * 0.04) + 's' }"
        @click="skillStore.selectTree(tree.id)"
      >
        <PixelIcon :name="tree.icon || 'tree'" :size="14" />
        <span>{{ tree.task_type }}</span>
      </button>
    </div>

    <SkillTreeView
      v-if="skillStore.selectedTree"
      :tree="skillStore.selectedTree"
      @unlock="onUnlock"
    />

    <p v-else-if="!skillStore.loading" class="empty-state anim-pop-in">
      No hay árboles de habilidades. Crea uno para empezar.
    </p>

    <p v-if="skillStore.error" class="error-msg">{{ skillStore.error }}</p>

    <!-- Create Tree Modal -->
    <div v-if="showCreateTree" class="modal-overlay anim-fade" @click.self="showCreateTree = false">
      <div class="modal-card anim-pop-in">
        <h3>Nuevo Árbol de Habilidades</h3>
        <div class="form-group">
          <label>Tipo (categoría de tarea) *</label>
          <input v-model="newTreeType" placeholder="ej: coding, fitness, estudio" autofocus />
        </div>
        <div class="form-group">
          <label>Icono</label>
          <div class="icon-picker">
            <button
              v-for="icon in ICON_OPTIONS"
              :key="icon"
              class="icon-option"
              :class="{ selected: newTreeIcon === icon }"
              @click="newTreeIcon = icon"
              type="button"
            >
              <PixelIcon :name="icon" :size="16" />
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateTree = false">Cancelar</button>
          <button class="btn-accent" :disabled="!newTreeType.trim()" @click="createTree">Crear</button>
        </div>
      </div>
    </div>

    <!-- Create Node Modal -->
    <div v-if="showCreateNode" class="modal-overlay anim-fade" @click.self="showCreateNode = false">
      <div class="modal-card anim-pop-in">
        <h3>Nuevo Nodo — {{ skillStore.selectedTree?.task_type }}</h3>
        <div class="form-group">
          <label>Nombre *</label>
          <input v-model="newNodeName" placeholder="ej: Concentración Avanzada" autofocus />
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <input v-model="newNodeDesc" placeholder="Descripción opcional..." />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Icono</label>
            <div class="icon-picker">
              <button
                v-for="icon in ICON_OPTIONS"
                :key="icon"
                class="icon-option"
                :class="{ selected: newNodeIcon === icon }"
                @click="newNodeIcon = icon"
                type="button"
              >
                <PixelIcon :name="icon" :size="16" />
              </button>
            </div>
          </div>
          <div class="form-group half">
            <label>Costo XP</label>
            <input type="number" v-model.number="newNodeCost" min="1" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label>Tier</label>
            <input type="number" v-model.number="newNodeTier" min="0" max="10" />
          </div>
          <div class="form-group half">
            <label>Nodo padre</label>
            <select v-model="newNodeParent">
              <option :value="null">Ninguno (raíz)</option>
              <option
                v-for="node in skillStore.selectedTree?.nodes"
                :key="node.id"
                :value="node.id"
              >{{ node.name }} (Tier {{ node.tier }})</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateNode = false">Cancelar</button>
          <button class="btn-accent" :disabled="!newNodeName.trim()" @click="createNode">Crear Nodo</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skills {
  padding: 1.5rem 2rem;
  max-width: 900px;
}

.skills-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.subtitle {
  color: #888;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-accent {
  background: var(--accent, #a855f7);
  color: white;
  border: none;
  padding: 0.5em 1em;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.08s;
  white-space: nowrap;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.btn-accent:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: translateY(-2px);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5);
}

.btn-accent:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.btn-accent:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text-muted, #94a3b8);
  border: 2px solid var(--border-color, #312e81);
  padding: 0.5em 1em;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.08s;
  white-space: nowrap;
}

.btn-secondary:hover {
  border-color: var(--accent, #a855f7);
  color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

.btn-secondary:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.stats-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  flex: 1;
  background: var(--card-bg, #1e1b4b);
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid var(--border-color, #312e81);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent, #7c3aed);
}

.stat-label {
  font-size: 0.7rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tree-tabs {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tree-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4em 0.8em;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-muted, #94a3b8);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.08s;
  font-family: inherit;
  text-transform: capitalize;
}

.tree-tab:hover {
  border-color: var(--accent, #a855f7);
  color: var(--text, #e2e8f0);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

.tree-tab:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.tree-tab.active {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--accent, #a855f7);
}

.empty-state {
  text-align: center;
  color: #555;
  padding: 3rem;
}

.error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  text-align: center;
  margin-top: 1rem;
}

/* Modals */
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
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 1.5rem;
  width: 440px;
  max-width: 90vw;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5);
}

.modal-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--accent, #7c3aed);
  text-transform: capitalize;
}

.form-group {
  margin-bottom: 0.8rem;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

input,
select {
  width: 100%;
  background: var(--bg, #13131f);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text, #e2e8f0);
  padding: 0.45em 0.7em;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}

input:focus,
select:focus {
  border-color: var(--accent, #7c3aed);
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
  margin-top: 1rem;
}

.btn-cancel {
  background: transparent;
  color: var(--text-muted, #94a3b8);
  border: 2px solid var(--border-color, #312e81);
  padding: 0.45em 1em;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-cancel:hover {
  border-color: var(--border-hover, #4338ca);
  color: var(--text, #e2e8f0);
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.icon-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg, #13131f);
  border: 2px solid var(--border-color, #312e81);
  cursor: pointer;
  transition: all 0.08s;
  padding: 0;
}

.icon-option:hover {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
}

.icon-option.selected {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.3));
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
</style>
