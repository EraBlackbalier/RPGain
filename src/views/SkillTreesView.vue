<script setup lang="ts">
import { onMounted } from "vue";
import { useSkillStore } from "../stores/skillStore";
import SkillTreeCanvas from "../components/SkillTreeCanvas.vue";

const skillStore = useSkillStore();

const TREE_COLORS = [
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#3b82f6",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#84cc16",
];

function colorForIndex(i: number): string {
  return TREE_COLORS[i % TREE_COLORS.length];
}

onMounted(() => {
  skillStore.fetchTrees();
});

async function onUnlock(nodeId: number) {
  await skillStore.unlockNode(nodeId);
}
</script>

<template>
  <div class="skill-trees-page">
    <div class="page-header">
      <h2>Skill Trees</h2>
      <p class="subtitle">Panorámica de todos tus árboles de habilidades</p>
    </div>

    <div v-if="skillStore.trees.length === 0 && !skillStore.loading" class="empty-state">
      <p>No hay árboles de habilidades.</p>
      <p class="hint">Ve a la pestaña <strong>Skills</strong> para crear árboles y nodos.</p>
    </div>

    <div v-else class="trees-panorama">
      <SkillTreeCanvas
        v-for="(tree, i) in skillStore.trees"
        :key="tree.id"
        :tree="tree"
        :color="colorForIndex(i)"
        @unlock="onUnlock"
      />
    </div>

    <p v-if="skillStore.error" class="error-msg">{{ skillStore.error }}</p>
  </div>
</template>

<style scoped>
.skill-trees-page {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.page-header h2 {
  margin: 0;
}

.subtitle {
  color: #888;
  margin: 0;
}

.empty-state {
  text-align: center;
  color: #555;
  padding: 4rem 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state p {
  margin: 0.2rem 0;
}

.hint {
  font-size: 0.85rem;
  color: #666;
}

.hint strong {
  color: var(--accent, #7c3aed);
}

.trees-panorama {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2rem;
  overflow-x: auto;
  overflow-y: auto;
  padding-bottom: 1rem;
  min-height: 0;
}

.trees-panorama::-webkit-scrollbar {
  height: 6px;
}

.trees-panorama::-webkit-scrollbar-track {
  background: #0a0a1a;
  border-radius: 3px;
}

.trees-panorama::-webkit-scrollbar-thumb {
  background: #2a2a4a;
  border-radius: 3px;
}

.error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  text-align: center;
  margin-top: 1rem;
  flex-shrink: 0;
}
</style>
