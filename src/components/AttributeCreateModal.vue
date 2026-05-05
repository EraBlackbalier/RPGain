<script setup lang="ts">
import { reactive } from "vue";
import { useAttributeStore } from "../stores/attributeStore";
import type { AttributeCategory, AttributeSource } from "../models/Attribute";
import PixelIcon from "./PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

const emit = defineEmits<{ (e: "close"): void }>();
const attrStore = useAttributeStore();

const form = reactive({
  name: "",
  description: "",
  icon: "gem",
  category: "buff" as AttributeCategory,
  source: "manual" as AttributeSource,
  effect_type: "cosmetic" as string,
  effect_value: 0,
  rarity: 1,
});

const icons = ["gem", "shield", "star", "crown", "potion", "scroll", "sword", "heart", "key", "chest"];
const categories = [
  { value: "buff", label: "Buff" },
  { value: "title", label: "Titulo" },
  { value: "badge", label: "Badge" },
  { value: "perk", label: "Perk" },
];
const effectTypes = [
  { value: "cosmetic", label: "Cosmetico" },
  { value: "xp_multiplier", label: "Multiplicador XP" },
  { value: "flat_xp", label: "Bonus XP plano" },
  { value: "stat_boost", label: "Stat Boost" },
];

async function submit() {
  if (!form.name.trim()) return;
  playClick();
  await attrStore.addAttribute({
    name: form.name.trim(),
    description: form.description.trim(),
    icon: form.icon,
    category: form.category,
    source: form.source,
    source_id: null,
    effect_type: form.effect_type,
    effect_value: form.effect_value,
    rarity: form.rarity,
  });
  emit("close");
}

function cancel() {
  playClick();
  emit("close");
}
</script>

<template>
  <div class="modal-overlay" @click.self="cancel">
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title">NUEVO ATRIBUTO</h3>
        <button class="modal-close" @click="cancel" @mouseenter="playHover">
          <PixelIcon name="cross" :size="10" />
        </button>
      </div>

      <div class="modal-body">
        <div class="field">
          <label class="field-label">Nombre</label>
          <input class="field-input" v-model="form.name" placeholder="Ej: Amuleto de Sabiduria" />
        </div>

        <div class="field">
          <label class="field-label">Descripcion</label>
          <textarea class="field-input field-textarea" v-model="form.description" placeholder="Que hace este atributo..." rows="2"></textarea>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label">Icono</label>
            <div class="icon-picker">
              <button
                v-for="ic in icons" :key="ic"
                class="icon-btn" :class="{ active: form.icon === ic }"
                @click="form.icon = ic; playClick()"
                @mouseenter="playHover"
              >
                <PixelIcon :name="ic" :size="14" />
              </button>
            </div>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label">Categoria</label>
            <select class="field-select" v-model="form.category">
              <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Efecto</label>
            <select class="field-select" v-model="form.effect_type">
              <option v-for="e in effectTypes" :key="e.value" :value="e.value">{{ e.label }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Valor</label>
            <input class="field-input field-small" type="number" v-model.number="form.effect_value" step="0.1" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label">Rareza</label>
            <div class="rarity-picker">
              <button
                v-for="r in 5" :key="r"
                class="rarity-btn"
                :class="[{ active: form.rarity >= r }, 'r-' + r]"
                @click="form.rarity = r; playClick()"
              >★</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="cancel" @mouseenter="playHover">Cancelar</button>
        <button class="btn-create" @click="submit" @mouseenter="playHover" :disabled="!form.name.trim()">
          <PixelIcon name="gem" :size="12" />
          Crear Atributo
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}
.modal-box {
  background: var(--card-bg, #1e1b4b);
  border: 3px solid var(--border-color, #312e81);
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.7);
  width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid var(--border-color, #312e81);
}
.modal-title {
  font-family: "Press Start 2P", cursive;
  font-size: 0.5rem;
  color: var(--accent, #a855f7);
  margin: 0;
}
.modal-close {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-muted, #94a3b8);
  cursor: pointer; padding: 0; transition: all 0.08s;
}
.modal-close:hover { border-color: var(--danger); color: var(--danger); }

.modal-body {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field { display: flex; flex-direction: column; gap: 0.2rem; }
.field-label {
  font-family: "Press Start 2P", cursive;
  font-size: 0.35rem;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
}
.field-input {
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text, #e2e8f0);
  font-family: "VT323", monospace;
  font-size: 0.9rem;
  padding: 0.35rem 0.5rem;
  outline: none;
  transition: border-color 0.08s;
}
.field-input:focus { border-color: var(--accent, #a855f7); }
.field-textarea { resize: vertical; min-height: 40px; }
.field-small { width: 80px; }
.field-select {
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text, #e2e8f0);
  font-family: "VT323", monospace;
  font-size: 0.85rem;
  padding: 0.3rem 0.4rem;
  outline: none;
}
.field-row { display: flex; gap: 0.5rem; align-items: flex-end; }

.icon-picker { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.icon-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-dim); cursor: pointer; padding: 0;
  transition: all 0.08s;
}
.icon-btn:hover { border-color: var(--accent); }
.icon-btn.active { border-color: var(--accent); background: var(--accent-glow); }

.rarity-picker { display: flex; gap: 0.15rem; }
.rarity-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none;
  color: var(--text-dim); cursor: pointer;
  font-size: 1.1rem; padding: 0; transition: color 0.08s;
}
.rarity-btn.active.r-1 { color: #9ca3af; }
.rarity-btn.active.r-2 { color: #22c55e; }
.rarity-btn.active.r-3 { color: #3b82f6; }
.rarity-btn.active.r-4 { color: #a855f7; }
.rarity-btn.active.r-5 { color: #f59e0b; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-top: 2px solid var(--border-color, #312e81);
}
.btn-cancel {
  padding: 0.45rem 1rem;
  background: transparent;
  border: 2px solid var(--border-color, #312e81);
  color: var(--text-muted, #94a3b8);
  font-family: "VT323", monospace;
  font-size: 0.9rem;
  cursor: pointer;
}
.btn-cancel:hover { border-color: var(--text-muted); }
.btn-create {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 1.2rem;
  background: var(--accent, #a855f7);
  border: none;
  color: white;
  font-family: "VT323", monospace;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  transition: all 0.08s;
}
.btn-create:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-2px); }
.btn-create:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
