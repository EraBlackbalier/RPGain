<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useBossStore } from "../stores/bossStore";
import BossList from "../components/BossList.vue";
import BossDetail from "../components/BossDetail.vue";
import BossCreateModal from "../components/BossCreateModal.vue";
import PixelIcon from "../components/PixelIcon.vue";

const bossStore = useBossStore();
const showCreate = ref(false);

onMounted(async () => {
  await bossStore.fetchBosses();
  await bossStore.checkAllRequirements();
});
</script>

<template>
  <div class="bosses-page">
    <div class="bosses-header anim-slide-up">
      <div>
        <h2>Bosses</h2>
        <p class="subtitle">Retos complejos con grandes recompensas</p>
      </div>
      <button class="btn-new" @click="showCreate = true">
        <PixelIcon name="skull" :size="12" />
        <span>Nuevo Boss</span>
      </button>
    </div>

    <div class="bosses-stats anim-slide-up delay-1">
      <div class="stat-chip danger-chip">
        <PixelIcon name="skull" :size="14" color="var(--danger)" />
        <span>{{ bossStore.availableCount }} activos</span>
      </div>
      <div class="stat-chip warning-chip">
        <PixelIcon name="sword" :size="14" color="var(--warning)" />
        <span>{{ bossStore.readyToDefeat }} listos</span>
      </div>
      <div class="stat-chip success-chip">
        <PixelIcon name="check" :size="14" color="var(--success)" />
        <span>{{ bossStore.defeatedCount }} derrotados</span>
      </div>
    </div>

    <div class="bosses-layout anim-slide-up delay-2">
      <div class="bosses-left">
        <BossList />
      </div>
      <div class="bosses-right">
        <BossDetail />
      </div>
    </div>

    <BossCreateModal v-if="showCreate" @close="showCreate = false" />
  </div>
</template>

<style scoped>
.bosses-page {
  padding: 1.5rem 2rem;
  max-width: 1000px;
}

.bosses-header {
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
  background: var(--danger, #ef4444);
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

.bosses-stats {
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
.danger-chip {
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--danger, #ef4444);
  background: rgba(239, 68, 68, 0.08);
}
.warning-chip {
  border-color: rgba(250, 204, 21, 0.3);
  color: var(--warning, #facc15);
  background: rgba(250, 204, 21, 0.08);
}
.success-chip {
  border-color: rgba(57, 255, 20, 0.3);
  color: var(--success, #39ff14);
  background: rgba(57, 255, 20, 0.08);
}

.bosses-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: flex-start;
}
.bosses-left, .bosses-right {
  min-width: 0;
}
</style>
