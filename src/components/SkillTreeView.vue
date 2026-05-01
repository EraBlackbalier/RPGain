<script setup lang="ts">
import { computed } from "vue";
import type { SkillTree, SkillNode } from "../models/Skill";
import PixelIcon from "./PixelIcon.vue";

const props = defineProps<{
  tree: SkillTree;
}>();

const emit = defineEmits<{
  (e: "unlock", nodeId: number): void;
}>();

const remainingXp = computed(() => props.tree.available_xp - props.tree.spent_xp);

const tiers = computed(() => {
  const map = new Map<number, SkillNode[]>();
  for (const node of props.tree.nodes) {
    const list = map.get(node.tier) || [];
    list.push(node);
    map.set(node.tier, list);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
});

function canUnlock(node: SkillNode): boolean {
  if (node.unlocked) return false;
  if (node.xp_cost > remainingXp.value) return false;
  if (node.parent_id !== null) {
    const parent = props.tree.nodes.find((n) => n.id === node.parent_id);
    if (parent && !parent.unlocked) return false;
  }
  return true;
}

function isParentLocked(node: SkillNode): boolean {
  if (node.parent_id === null) return false;
  const parent = props.tree.nodes.find((n) => n.id === node.parent_id);
  return parent ? !parent.unlocked : false;
}
</script>

<template>
  <div class="skill-tree anim-slide-up">
    <div class="tree-header">
      <div class="tree-title-row">
        <PixelIcon class="tree-icon" :name="tree.icon || 'tree'" :size="20" :color="tree.icon ? '#a855f7' : '#a855f7'" />
        <h3 class="tree-name">{{ tree.task_type }}</h3>
      </div>
      <div class="tree-xp-info">
        <span class="xp-available">{{ remainingXp }} XP disponible</span>
        <span class="xp-spent">{{ tree.spent_xp }} gastado</span>
      </div>
      <div class="xp-bar-track">
        <div
          class="xp-bar-fill"
          :style="{ width: tree.available_xp > 0 ? Math.round((tree.spent_xp / tree.available_xp) * 100) + '%' : '0%' }"
        ></div>
      </div>
    </div>

    <div v-if="tree.nodes.length === 0" class="empty-tree anim-pop-in">
      <p>Este árbol no tiene nodos aún.</p>
    </div>

    <div v-else class="tiers">
      <div v-for="[tierNum, nodes] in tiers" :key="tierNum" class="tier-row anim-slide-up">
        <span class="tier-label">Tier {{ tierNum }}</span>
        <div class="tier-nodes">
          <button
            v-for="(node, idx) in nodes"
            :key="node.id"
            class="node-card anim-pop-in"
            :style="{ animationDelay: (idx * 0.06) + 's' }"
            :class="{
              unlocked: node.unlocked,
              available: canUnlock(node),
              locked: !node.unlocked && !canUnlock(node),
              'parent-locked': isParentLocked(node),
            }"
            @click="canUnlock(node) && emit('unlock', node.id)"
            :disabled="node.unlocked || !canUnlock(node)"
            :title="node.unlocked ? 'Desbloqueado' : canUnlock(node) ? 'Click para desbloquear' : isParentLocked(node) ? 'Nodo padre bloqueado' : 'XP insuficiente'"
          >
            <PixelIcon class="node-icon" :name="node.icon || 'star'" :size="16" />
            <span class="node-name">{{ node.name }}</span>
            <span v-if="node.description" class="node-desc">{{ node.description }}</span>
            <span class="node-cost" v-if="!node.unlocked">{{ node.xp_cost }} XP</span>
            <PixelIcon v-else class="node-unlocked-badge" name="check" :size="12" color="#39ff14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-tree {
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  padding: 1.2rem;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.tree-header {
  margin-bottom: 1.2rem;
}

.tree-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.tree-icon {
  font-size: 1.3rem;
}

.tree-name {
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: capitalize;
  margin: 0;
}

.tree-xp-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 0.3rem;
}

.xp-available {
  color: var(--accent, #7c3aed);
  font-weight: 600;
}

.xp-spent {
  color: #666;
}

.xp-bar-track {
  height: 8px;
  background: #0a0a12;
  border: 2px solid #312e81;
  overflow: hidden;
  margin-top: 0.4rem;
}

.xp-bar-fill {
  height: 100%;
  background: #a855f7;
  transition: width 0.2s;
}

.empty-tree {
  text-align: center;
  color: #555;
  padding: 1.5rem;
  font-size: 0.85rem;
}

.tiers {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tier-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tier-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #555;
  font-weight: 600;
}

.tier-nodes {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.node-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.6rem 0.8rem;
  min-width: 100px;
  border: 2px solid #312e81;
  background: #0a0a12;
  cursor: default;
  transition: all 0.08s;
  position: relative;
}

.node-card.unlocked {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
  cursor: default;
  animation: pixelGlow 1.5s steps(4) infinite;
}

.node-card.available:hover {
  border-color: #a855f7;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
  animation: pixelBounce 0.3s steps(3);
}

.node-card.available:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.node-card.locked {
  opacity: 0.45;
  cursor: not-allowed;
}

.node-card.parent-locked {
  opacity: 0.3;
  cursor: not-allowed;
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-unlocked-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: #39ff14;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
