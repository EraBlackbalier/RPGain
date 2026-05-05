<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAttributeStore } from "../stores/attributeStore";
import Inventory from "../components/Inventory.vue";
import AttributeCreateModal from "../components/AttributeCreateModal.vue";
import PixelIcon from "../components/PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

const attrStore = useAttributeStore();
const showCreate = ref(false);
const activeFilter = ref("all");

const filters = [
  { value: "all", label: "Todos", icon: "chest" },
  { value: "buff", label: "Buffs", icon: "potion" },
  { value: "title", label: "Titulos", icon: "crown" },
  { value: "badge", label: "Badges", icon: "shield" },
  { value: "perk", label: "Perks", icon: "star" },
];

function setFilter(f: string) {
  playClick();
  activeFilter.value = f;
}

onMounted(() => {
  attrStore.fetchAttributes();
});
</script>

<template>
  <div class="inventory-page">
    <div class="inv-header anim-slide-up">
      <div>
        <h2>Inventario</h2>
        <p class="subtitle">Atributos y recompensas persistentes</p>
      </div>
      <button class="btn-new" @click="showCreate = true">
        <PixelIcon name="gem" :size="12" />
        <span>Nuevo Atributo</span>
      </button>
    </div>

    <div class="inv-stats anim-slide-up delay-1">
      <div class="stat-chip accent-chip">
        <PixelIcon name="gem" :size="14" color="var(--accent)" />
        <span>{{ attrStore.attributes.length }} total</span>
      </div>
      <div class="stat-chip success-chip">
        <PixelIcon name="check" :size="14" color="var(--success)" />
        <span>{{ attrStore.unlockedCount }} desbloqueados</span>
      </div>
      <div class="stat-chip info-chip">
        <PixelIcon name="shield" :size="14" color="var(--info)" />
        <span>{{ attrStore.equippedCount }} equipados</span>
      </div>
      <div class="stat-chip warning-chip" v-if="attrStore.xpMultiplier !== 1">
        <PixelIcon name="xp" :size="14" color="var(--warning)" />
        <span>x{{ attrStore.xpMultiplier.toFixed(2) }} XP</span>
      </div>
      <div class="stat-chip warning-chip" v-if="attrStore.flatXpBonus > 0">
        <PixelIcon name="xp" :size="14" color="var(--warning)" />
        <span>+{{ attrStore.flatXpBonus }} XP/task</span>
      </div>
    </div>

    <div class="inv-filters anim-slide-up delay-2">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value }"
        @click="setFilter(f.value)"
        @mouseenter="playHover"
      >
        <PixelIcon :name="f.icon" :size="12" />
        {{ f.label }}
      </button>
    </div>

    <div class="anim-slide-up delay-3">
      <Inventory :filter="activeFilter" />
    </div>

    <AttributeCreateModal v-if="showCreate" @close="showCreate = false" />
  </div>
</template>

<style scoped>
.inventory-page {
  padding: 1.5rem 2rem;
  max-width: 1000px;
}

.inv-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.2rem;
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
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}
.btn-new:hover {
  filter: brightness(1.12);
  transform: translateY(-2px);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5);
}

.inv-stats {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.stat-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border: 2px solid;
  font-family: "VT323", monospace;
  font-size: 0.85rem;
}
.accent-chip {
  border-color: rgba(168, 85, 247, 0.3);
  color: var(--accent, #a855f7);
  background: rgba(168, 85, 247, 0.08);
}
.success-chip {
  border-color: rgba(57, 255, 20, 0.3);
  color: var(--success, #39ff14);
  background: rgba(57, 255, 20, 0.08);
}
.info-chip {
  border-color: rgba(0, 240, 255, 0.3);
  color: var(--info, #00f0ff);
  background: rgba(0, 240, 255, 0.08);
}
.warning-chip {
  border-color: rgba(250, 204, 21, 0.3);
  color: var(--warning, #facc15);
  background: rgba(250, 204, 21, 0.08);
}

.inv-filters {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.7rem;
  background: transparent;
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-muted, #94a3b8);
  font-family: "VT323", monospace;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.08s;
}
.filter-btn:hover {
  border-color: var(--border-hover, #4338ca);
  color: var(--text, #e2e8f0);
}
.filter-btn.active {
  border-color: var(--accent, #a855f7);
  color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
}
</style>
