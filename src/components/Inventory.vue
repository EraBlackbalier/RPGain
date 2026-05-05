<script setup lang="ts">
import { computed } from "vue";
import { useAttributeStore } from "../stores/attributeStore";
import type { Attribute } from "../models/Attribute";
import PixelIcon from "./PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

const attrStore = useAttributeStore();

const props = defineProps<{
  filter?: string; // category filter: "all" | "buff" | "title" | "badge" | "perk"
}>();

const filtered = computed(() => {
  if (!props.filter || props.filter === "all") return attrStore.attributes;
  return attrStore.attributes.filter((a) => a.category === props.filter);
});

function rarityLabel(r: number): string {
  switch (r) {
    case 1: return "Common";
    case 2: return "Uncommon";
    case 3: return "Rare";
    case 4: return "Epic";
    case 5: return "Legendary";
    default: return "Common";
  }
}

function rarityClass(r: number): string {
  switch (r) {
    case 1: return "rarity-common";
    case 2: return "rarity-uncommon";
    case 3: return "rarity-rare";
    case 4: return "rarity-epic";
    case 5: return "rarity-legendary";
    default: return "rarity-common";
  }
}

function effectLabel(attr: Attribute): string {
  switch (attr.effect_type) {
    case "xp_multiplier": return `x${attr.effect_value} XP`;
    case "flat_xp": return `+${attr.effect_value} XP`;
    case "stat_boost": return `+${attr.effect_value} Stat`;
    case "cosmetic": return "Cosmetico";
    default: return attr.effect_type;
  }
}

async function handleUnlock(id: number) {
  playClick();
  await attrStore.unlock(id);
}

async function handleToggleEquip(id: number) {
  playClick();
  await attrStore.toggleEquip(id);
}

async function handleDelete(id: number) {
  playClick();
  await attrStore.removeAttribute(id);
}
</script>

<template>
  <div class="inventory-grid">
    <div
      v-for="attr in filtered"
      :key="attr.id"
      class="inv-card"
      :class="[rarityClass(attr.rarity), { locked: !attr.unlocked, equipped: attr.equipped }]"
      @mouseenter="playHover"
    >
      <div class="inv-card-top">
        <div class="inv-icon" :class="rarityClass(attr.rarity)">
          <PixelIcon :name="attr.icon || 'gem'" :size="22" />
        </div>
        <div class="inv-rarity-badge" :class="rarityClass(attr.rarity)">
          {{ rarityLabel(attr.rarity) }}
        </div>
      </div>

      <div class="inv-card-body">
        <span class="inv-name">{{ attr.name }}</span>
        <span class="inv-desc" v-if="attr.description">{{ attr.description }}</span>
        <div class="inv-tags">
          <span class="inv-tag category-tag">{{ attr.category }}</span>
          <span class="inv-tag effect-tag">{{ effectLabel(attr) }}</span>
          <span class="inv-tag source-tag" v-if="attr.source !== 'manual'">{{ attr.source }}</span>
        </div>
      </div>

      <div class="inv-card-actions">
        <template v-if="!attr.unlocked">
          <button class="inv-btn unlock-btn" @click="handleUnlock(attr.id)" title="Desbloquear">
            <PixelIcon name="key" :size="12" />
            Unlock
          </button>
        </template>
        <template v-else>
          <button
            class="inv-btn equip-btn"
            :class="{ active: attr.equipped }"
            @click="handleToggleEquip(attr.id)"
            :title="attr.equipped ? 'Desequipar' : 'Equipar'"
          >
            <PixelIcon :name="attr.equipped ? 'check' : 'shield'" :size="12" />
            {{ attr.equipped ? 'Equipped' : 'Equip' }}
          </button>
        </template>
        <button class="inv-btn del-btn" @click="handleDelete(attr.id)" title="Eliminar">
          <PixelIcon name="cross" :size="10" />
        </button>
      </div>

      <div v-if="!attr.unlocked" class="inv-lock-overlay">
        <PixelIcon name="key" :size="28" color="var(--text-dim)" />
      </div>
    </div>

    <div v-if="filtered.length === 0" class="inv-empty">
      <PixelIcon name="chest" :size="28" color="var(--text-dim)" />
      <span>Inventario vacio. Derrota bosses para ganar atributos!</span>
    </div>
  </div>
</template>

<style scoped>
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 0.6rem;
}

.inv-card {
  position: relative;
  background: var(--card-bg, #1e1b4b);
  border: 2px solid var(--border-color, #312e81);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.08s;
}
.inv-card:hover {
  border-color: var(--border-hover, #4338ca);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}
.inv-card.locked {
  opacity: 0.55;
}
.inv-card.equipped {
  border-color: var(--success, #39ff14);
  box-shadow: 0 0 8px rgba(57, 255, 20, 0.15);
}

/* Rarity borders */
.inv-card.rarity-common { border-left: 3px solid #9ca3af; }
.inv-card.rarity-uncommon { border-left: 3px solid #22c55e; }
.inv-card.rarity-rare { border-left: 3px solid #3b82f6; }
.inv-card.rarity-epic { border-left: 3px solid #a855f7; }
.inv-card.rarity-legendary { border-left: 3px solid #f59e0b; }

.inv-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.6rem 0.3rem;
}

.inv-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
}
.inv-icon.rarity-common { color: #9ca3af; }
.inv-icon.rarity-uncommon { color: #22c55e; }
.inv-icon.rarity-rare { color: #3b82f6; }
.inv-icon.rarity-epic { color: #a855f7; }
.inv-icon.rarity-legendary { color: #f59e0b; }

.inv-rarity-badge {
  font-family: "Press Start 2P", cursive;
  font-size: 0.3rem;
  padding: 0.15em 0.4em;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.inv-rarity-badge.rarity-common { color: #9ca3af; border-color: #9ca3af; }
.inv-rarity-badge.rarity-uncommon { color: #22c55e; border-color: #22c55e; }
.inv-rarity-badge.rarity-rare { color: #3b82f6; border-color: #3b82f6; }
.inv-rarity-badge.rarity-epic { color: #a855f7; border-color: #a855f7; }
.inv-rarity-badge.rarity-legendary { color: #f59e0b; border-color: #f59e0b; }

.inv-card-body {
  padding: 0.3rem 0.6rem 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
}

.inv-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text, #e2e8f0);
  line-height: 1.2;
}

.inv-desc {
  font-family: "VT323", monospace;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  line-height: 1.3;
}

.inv-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
}
.inv-tag {
  font-family: "Press Start 2P", cursive;
  font-size: 0.28rem;
  padding: 0.15em 0.35em;
  border: 1px solid;
  text-transform: uppercase;
}
.category-tag { color: var(--info, #00f0ff); border-color: rgba(0, 240, 255, 0.3); }
.effect-tag { color: var(--accent, #a855f7); border-color: rgba(168, 85, 247, 0.3); }
.source-tag { color: var(--warning, #facc15); border-color: rgba(250, 204, 21, 0.3); }

.inv-card-actions {
  display: flex;
  gap: 0.3rem;
  padding: 0.4rem 0.6rem;
  border-top: 1px solid var(--border-color, #312e81);
}

.inv-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.5rem;
  font-family: "VT323", monospace;
  font-size: 0.75rem;
  cursor: pointer;
  border: 2px solid;
  background: transparent;
  transition: all 0.08s;
}

.unlock-btn {
  color: var(--warning, #facc15);
  border-color: rgba(250, 204, 21, 0.3);
  flex: 1;
  justify-content: center;
}
.unlock-btn:hover {
  background: rgba(250, 204, 21, 0.1);
  border-color: var(--warning, #facc15);
}

.equip-btn {
  color: var(--text-muted, #94a3b8);
  border-color: var(--border-color, #312e81);
  flex: 1;
  justify-content: center;
}
.equip-btn:hover {
  border-color: var(--success, #39ff14);
  color: var(--success, #39ff14);
}
.equip-btn.active {
  color: var(--success, #39ff14);
  border-color: var(--success, #39ff14);
  background: rgba(57, 255, 20, 0.08);
}

.del-btn {
  color: var(--text-dim, #475569);
  border-color: transparent;
  padding: 0.3rem;
}
.del-btn:hover {
  color: var(--danger, #ef4444);
  border-color: var(--danger, #ef4444);
}

.inv-lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;
}

.inv-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem;
  color: var(--text-dim, #475569);
  font-family: "VT323", monospace;
  font-size: 0.9rem;
}
</style>
