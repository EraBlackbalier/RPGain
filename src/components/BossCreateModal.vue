<script setup lang="ts">
import { ref, reactive } from "vue";
import { useBossStore } from "../stores/bossStore";
import type { CreateRequirementPayload, CreateRewardPayload } from "../models/Boss";
import PixelIcon from "./PixelIcon.vue";
import { playClick, playHover } from "../composables/usePixelSound";

const emit = defineEmits<{ (e: "close"): void }>();
const bossStore = useBossStore();

const form = reactive({
  name: "",
  description: "",
  icon: "skull",
  difficulty: 3,
  xp_reward: 100,
});

const requirements = ref<CreateRequirementPayload[]>([
  { requirement_type: "tasks_completed", description: "Completar 5 misiones", target_value: 5 },
]);

const rewards = ref<CreateRewardPayload[]>([
  { reward_type: "xp", value: "100", description: "Bonus XP por derrota" },
]);

const icons = ["skull", "shield", "sword", "crown", "gem", "potion", "scroll", "star"];
const reqTypes = [
  { value: "tasks_completed", label: "Tareas completadas" },
  { value: "xp_earned", label: "XP ganada" },
  { value: "level_reached", label: "Nivel alcanzado" },
  { value: "skill_unlocked", label: "Skills desbloqueadas" },
];
const rewTypes = [
  { value: "xp", label: "XP" },
  { value: "title", label: "Titulo" },
  { value: "badge", label: "Badge" },
];

function addRequirement() {
  playClick();
  requirements.value.push({ requirement_type: "tasks_completed", description: "", target_value: 1 });
}

function removeRequirement(idx: number) {
  playClick();
  requirements.value.splice(idx, 1);
}

function addReward() {
  playClick();
  rewards.value.push({ reward_type: "xp", value: "", description: "" });
}

function removeReward(idx: number) {
  playClick();
  rewards.value.splice(idx, 1);
}

async function submit() {
  if (!form.name.trim()) return;
  playClick();
  await bossStore.addBoss({
    name: form.name.trim(),
    description: form.description.trim(),
    icon: form.icon,
    difficulty: form.difficulty,
    xp_reward: form.xp_reward,
    requirements: requirements.value.filter((r) => r.description.trim() !== ""),
    rewards: rewards.value.filter((r) => r.description.trim() !== ""),
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
        <h3 class="modal-title">NUEVO BOSS</h3>
        <button class="modal-close" @click="cancel" @mouseenter="playHover">
          <PixelIcon name="cross" :size="10" />
        </button>
      </div>

      <div class="modal-body">
        <div class="field">
          <label class="field-label">Nombre</label>
          <input class="field-input" v-model="form.name" placeholder="Ej: Dragon del Caos" />
        </div>

        <div class="field">
          <label class="field-label">Descripcion</label>
          <textarea class="field-input field-textarea" v-model="form.description" placeholder="Describe el reto..." rows="2"></textarea>
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
          <div class="field">
            <label class="field-label">Dificultad</label>
            <div class="diff-picker">
              <button
                v-for="d in 5" :key="d"
                class="diff-btn" :class="{ active: form.difficulty >= d }"
                @click="form.difficulty = d; playClick()"
              >★</button>
            </div>
          </div>
          <div class="field">
            <label class="field-label">XP Reward</label>
            <input class="field-input field-small" type="number" v-model.number="form.xp_reward" min="10" step="10" />
          </div>
        </div>

        <div class="section-divider">
          <span class="divider-label">REQUISITOS</span>
        </div>
        <div v-for="(req, i) in requirements" :key="i" class="inline-row">
          <select class="field-select" v-model="req.requirement_type">
            <option v-for="rt in reqTypes" :key="rt.value" :value="rt.value">{{ rt.label }}</option>
          </select>
          <input class="field-input flex-1" v-model="req.description" placeholder="Descripcion..." />
          <input class="field-input field-tiny" type="number" v-model.number="req.target_value" min="1" />
          <button class="btn-inline-del" @click="removeRequirement(i)">
            <PixelIcon name="cross" :size="8" />
          </button>
        </div>
        <button class="btn-add-row" @click="addRequirement" @mouseenter="playHover">+ Requisito</button>

        <div class="section-divider">
          <span class="divider-label">RECOMPENSAS</span>
        </div>
        <div v-for="(rew, i) in rewards" :key="i" class="inline-row">
          <select class="field-select" v-model="rew.reward_type">
            <option v-for="rt in rewTypes" :key="rt.value" :value="rt.value">{{ rt.label }}</option>
          </select>
          <input class="field-input flex-1" v-model="rew.description" placeholder="Descripcion..." />
          <input class="field-input field-small" v-model="rew.value" placeholder="Valor" />
          <button class="btn-inline-del" @click="removeReward(i)">
            <PixelIcon name="cross" :size="8" />
          </button>
        </div>
        <button class="btn-add-row" @click="addReward" @mouseenter="playHover">+ Recompensa</button>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="cancel" @mouseenter="playHover">Cancelar</button>
        <button class="btn-create" @click="submit" @mouseenter="playHover" :disabled="!form.name.trim()">
          <PixelIcon name="skull" :size="12" />
          Crear Boss
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
  width: 520px;
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
  color: var(--danger, #ef4444);
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
.field-tiny { width: 55px; text-align: center; }
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

.diff-picker { display: flex; gap: 0.15rem; }
.diff-btn {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none;
  color: var(--text-dim); cursor: pointer;
  font-size: 1rem; padding: 0;
}
.diff-btn.active { color: var(--warning, #facc15); }

.section-divider {
  border-top: 1px solid var(--border-color, #312e81);
  padding-top: 0.4rem;
  margin-top: 0.2rem;
}
.divider-label {
  font-family: "Press Start 2P", cursive;
  font-size: 0.32rem;
  color: var(--text-dim, #475569);
  letter-spacing: 0.06em;
}

.inline-row {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}
.flex-1 { flex: 1; }

.btn-inline-del {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-dim); cursor: pointer; padding: 0;
  flex-shrink: 0;
}
.btn-inline-del:hover { border-color: var(--danger); color: var(--danger); }

.btn-add-row {
  background: transparent;
  border: 2px dashed var(--border-color, #312e81);
  color: var(--text-dim, #475569);
  font-family: "VT323", monospace;
  font-size: 0.8rem;
  padding: 0.3rem;
  cursor: pointer;
  transition: all 0.08s;
}
.btn-add-row:hover {
  border-color: var(--accent);
  color: var(--accent);
}

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
  background: var(--danger, #ef4444);
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
