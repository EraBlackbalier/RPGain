<script setup lang="ts">
import { computed, ref } from "vue";
import type { SkillTree, SkillNode } from "../models/Skill";
import PixelIcon from "./PixelIcon.vue";

const props = defineProps<{
  tree: SkillTree;
  color?: string;
  showLabel?: boolean;
}>();

/** Color efectivo: usa la prop `color` si se pasa, sino el color persistente del árbol. */
const treeColor = computed(() => props.color || props.tree.color || "#a855f7");

const emit = defineEmits<{
  (e: "unlock", nodeId: number): void;
}>();

const NODE_SIZE = 52;
const H_GAP = 80;
const V_GAP = 100;

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

const maxTier = computed(() => {
  if (tiers.value.length === 0) return 0;
  return tiers.value[tiers.value.length - 1][0];
});

interface NodePos {
  node: SkillNode;
  x: number;
  y: number;
}

/**
 * Calcula posiciones de nodos en un layout de árbol jerárquico.
 * - Los nodos raíz (tier 0) se centran.
 * - Los hijos de cada nodo se colocan DEBAJO y CENTRADOS respecto a su padre.
 * - Se detectan y corrigen solapamientos entre nodos del mismo tier.
 * - Todo el árbol se centra horizontalmente en el canvas.
 *
 * `x` es RELATIVO al centro del canvas (0 = centro).
 */
const rawPositions = computed<NodePos[]>(() => {
  const positions: NodePos[] = [];
  if (props.tree.nodes.length === 0) return positions;

  // Agrupar nodos por tier para procesar de arriba hacia abajo
  const nodesByTier = new Map<number, SkillNode[]>();
  for (const node of props.tree.nodes) {
    const list = nodesByTier.get(node.tier) || [];
    list.push(node);
    nodesByTier.set(node.tier, list);
  }

  const tierNums = Array.from(nodesByTier.keys()).sort((a, b) => a - b);

  // Helper: buscar posición ya asignada a un nodo
  function findPos(nodeId: number): NodePos | undefined {
    return positions.find((p) => p.node.id === nodeId);
  }

  for (const tierNum of tierNums) {
    const nodes = nodesByTier.get(tierNum)!;
    const tierY = (maxTier.value - tierNum) * V_GAP + 60;

    if (tierNum === 0) {
      // Raíces: distribuir centradas en x=0
      const totalWidth = (nodes.length - 1) * H_GAP;
      const startX = -totalWidth / 2;
      for (let i = 0; i < nodes.length; i++) {
        positions.push({
          node: nodes[i],
          x: startX + i * H_GAP,
          y: tierY,
        });
      }
    } else {
      // Agrupar hijos por su parent_id
      const byParent = new Map<number | null, SkillNode[]>();
      for (const node of nodes) {
        const pid = node.parent_id;
        const list = byParent.get(pid) || [];
        list.push(node);
        byParent.set(pid, list);
      }

      // Colocar cada grupo centrado bajo su padre
      for (const [parentId, children] of byParent) {
        let centerX = 0;
        if (parentId !== null) {
          const parentPos = findPos(parentId);
          if (parentPos) centerX = parentPos.x;
        }
        const childWidth = (children.length - 1) * H_GAP;
        const startX = centerX - childWidth / 2;
        for (let i = 0; i < children.length; i++) {
          positions.push({
            node: children[i],
            x: startX + i * H_GAP,
            y: tierY,
          });
        }
      }
    }

    // ── CORRECCIÓN DE SOLAPAMIENTOS ──
    // Ordenar nodos de este tier por x, y si dos están muy cerca,
    // empujar el de la derecha para mantener separación mínima H_GAP.
    const tierPos = positions
      .filter((p) => p.node.tier === tierNum)
      .sort((a, b) => a.x - b.x);

    for (let i = 1; i < tierPos.length; i++) {
      const prev = tierPos[i - 1];
      const curr = tierPos[i];
      if (curr.x - prev.x < H_GAP) {
        curr.x = prev.x + H_GAP;
      }
    }
  }

  return positions;
});

/** Ancho del canvas basado en el rango real de posiciones + márgenes. */
const canvasWidth = computed(() => {
  if (rawPositions.value.length === 0) return 300;
  const minX = Math.min(...rawPositions.value.map((p) => p.x));
  const maxX = Math.max(...rawPositions.value.map((p) => p.x));
  return Math.max(maxX - minX + NODE_SIZE + 80, 300);
});

/** Alto del canvas basado en la cantidad de tiers. */
const canvasHeight = computed(() => (maxTier.value + 1) * V_GAP + 140);

/** Posiciones finales con offset para centrar en el canvas real. */
const nodePositions = computed<NodePos[]>(() => {
  const offsetX = canvasWidth.value / 2;
  return rawPositions.value.map((p) => ({
    ...p,
    x: p.x + offsetX,
  }));
});

const connections = computed(() => {
  const lines: { x1: number; y1: number; x2: number; y2: number; unlocked: boolean }[] = [];
  for (const pos of nodePositions.value) {
    if (pos.node.parent_id !== null) {
      const parentPos = nodePositions.value.find((p) => p.node.id === pos.node.parent_id);
      if (parentPos) {
        lines.push({
          x1: parentPos.x,
          y1: parentPos.y,
          x2: pos.x,
          y2: pos.y,
          unlocked: parentPos.node.unlocked && pos.node.unlocked,
        });
      }
    }
  }
  return lines;
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

function pathD(c: { x1: number; y1: number; x2: number; y2: number }): string {
  const midY = (c.y1 + c.y2) / 2;
  return `M ${c.x1} ${c.y1} C ${c.x1} ${midY}, ${c.x2} ${midY}, ${c.x2} ${c.y2}`;
}

const hoveredNode = ref<number | null>(null);
</script>

<template>
  <div class="tree-canvas-wrap">
    <div v-if="showLabel !== false" class="tree-root-label">
      <PixelIcon class="root-icon" :name="tree.icon || 'tree'" :size="24" />
      <span class="root-name">{{ tree.task_type }}</span>
      <span class="root-xp" :style="{ color: treeColor }">{{ remainingXp }}</span>
    </div>

    <div class="tree-canvas" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
      <svg class="connections-svg" :width="canvasWidth" :height="canvasHeight">
        <!-- Definiciones de filtros SVG para glow pulsante -->
        <defs>
          <filter id="glow-pulse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-static" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Conexiones base (siempre visibles, tenues cuando bloqueadas) -->
        <path
          v-for="(c, i) in connections"
          :key="'base-' + i"
          :d="pathD(c)"
          fill="none"
          :stroke="c.unlocked ? treeColor : '#2a2a4a'"
          :stroke-width="c.unlocked ? 3 : 2"
          :opacity="c.unlocked ? 0.6 : 0.35"
          stroke-linecap="round"
        />

        <!-- Glow pulsante SOLO en conexiones desbloqueadas -->
        <path
          v-for="(c, i) in connections.filter(c => c.unlocked)"
          :key="'glow-' + i"
          :d="pathD(c)"
          fill="none"
          :stroke="treeColor"
          stroke-width="6"
          stroke-linecap="round"
          opacity="0.35"
          class="connection-glow"
          :style="{ filter: `drop-shadow(0 0 6px ${treeColor})` }"
        />
      </svg>

      <div
        v-for="pos in nodePositions"
        :key="pos.node.id"
        class="tree-node"
        :class="{
          unlocked: pos.node.unlocked,
          available: canUnlock(pos.node),
          locked: !pos.node.unlocked && !canUnlock(pos.node),
          hovered: hoveredNode === pos.node.id,
        }"
        :style="{
          left: pos.x - NODE_SIZE / 2 + 'px',
          top: pos.y - NODE_SIZE / 2 + 'px',
          width: NODE_SIZE + 'px',
          height: NODE_SIZE + 'px',
          '--node-color': treeColor,
          borderColor: pos.node.unlocked ? treeColor : canUnlock(pos.node) ? treeColor : '#2a2a4a',
          background: pos.node.unlocked ? treeColor + '22' : '#0a0a1a',
          boxShadow: pos.node.unlocked ? `0 0 14px ${treeColor}44` : canUnlock(pos.node) ? `0 0 10px ${treeColor}33` : 'none',
        }"
        @mouseenter="hoveredNode = pos.node.id"
        @mouseleave="hoveredNode = null"
        @click="canUnlock(pos.node) && emit('unlock', pos.node.id)"
      >
        <PixelIcon v-if="!pos.node.unlocked && !canUnlock(pos.node)" class="lock-icon" name="lock" :size="14" />
        <PixelIcon v-else class="node-icon" :name="pos.node.icon || 'star'" :size="18" />

        <div
          v-if="hoveredNode === pos.node.id"
          class="node-tooltip"
        >
          <strong>{{ pos.node.name }}</strong>
          <span v-if="pos.node.description" class="tt-desc">{{ pos.node.description }}</span>
          <span v-if="!pos.node.unlocked" class="tt-cost">{{ pos.node.xp_cost }} XP</span>
          <span v-else class="tt-done">Desbloqueado</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tree-canvas-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  min-width: 200px;
}

.tree-root-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  margin-top: 0.5rem;
  order: 2;
}

.root-icon {
  font-size: 1.6rem;
}

.root-name {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
}

.root-xp {
  font-size: 1.4rem;
  font-weight: 800;
}

.tree-canvas {
  position: relative;
  order: 1;
}

.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.tree-node {
  position: absolute;
  border: 2.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.08s;
  z-index: 1;
}

.tree-node.unlocked {
  cursor: default;
}

.tree-node.locked {
  cursor: not-allowed;
  opacity: 0.5;
}

.tree-node.available:hover {
  transform: scale(1.15);
  z-index: 5;
}

.lock-icon {
  font-size: 0.9rem;
  filter: grayscale(1);
  opacity: 0.6;
}

.node-icon {
  font-size: 1.2rem;
}

/* Glow pulsante en conexiones desbloqueadas */
.connection-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.55; }
}

.node-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: #13131f;
  border: 2px solid #312e81;
  padding: 0.5rem 0.7rem;
  min-width: 120px;
  max-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  z-index: 20;
  pointer-events: none;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.node-tooltip strong {
  font-size: 0.78rem;
  color: #e0e0e0;
}

.tt-desc {
  font-size: 0.65rem;
  color: #888;
}

.tt-cost {
  font-size: 0.7rem;
  color: var(--node-color, #7c3aed);
  font-weight: 700;
}

.tt-done {
  font-size: 0.7rem;
  color: #4ade80;
  font-weight: 600;
}
</style>
