<script setup lang="ts">
import { computed, ref } from "vue";
import PixelIcon from "../components/PixelIcon.vue";
import { communityPackages, type CommunityPackage } from "../data/communityPackages";
import { useSessionStore } from "../stores/sessionStore";
import { useTaskStore } from "../stores/taskStore";
import { useSkillStore } from "../stores/skillStore";
import { useBossStore } from "../stores/bossStore";
import { useAttributeStore } from "../stores/attributeStore";
import * as tauriService from "../services/tauriService";

const sessionStore = useSessionStore();
const taskStore = useTaskStore();
const skillStore = useSkillStore();
const bossStore = useBossStore();
const attributeStore = useAttributeStore();

const installingId = ref<string | null>(null);
const message = ref<string | null>(null);
const selectedTag = ref<string | null>(null);
const installedIds = ref(loadInstalledIds());

const allTags = computed(() => {
  const tags = new Set<string>();
  for (const pack of communityPackages) {
    for (const tag of pack.tags) tags.add(tag);
  }
  return Array.from(tags).sort();
});

const visiblePackages = computed(() => {
  if (!selectedTag.value) return communityPackages;
  return communityPackages.filter((pack) => pack.tags.includes(selectedTag.value!));
});

function storageKey() {
  return `rpgain-community-packages:${sessionStore.activeSessionId ?? 1}`;
}

function loadInstalledIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) || "[]");
  } catch {
    return [];
  }
}

function persistInstalledIds(ids: string[]) {
  installedIds.value = ids;
  localStorage.setItem(storageKey(), JSON.stringify(ids));
}

function isInstalled(packageId: string) {
  return installedIds.value.includes(packageId);
}

async function installPackage(pack: CommunityPackage) {
  const sessionId = sessionStore.activeSessionId ?? 1;
  installingId.value = pack.id;
  message.value = null;

  try {
    for (const task of pack.tasks) {
      await tauriService.createTask({ ...task, session_id: sessionId });
    }

    const trees = await tauriService.getSkillTrees(sessionId);
    let tree = trees.find((item) => item.task_type === pack.skillTree.taskType);
    if (!tree) {
      tree = await tauriService.createSkillTree(
        sessionId,
        pack.skillTree.taskType,
        pack.skillTree.icon,
        pack.skillTree.color
      );
    }

    const nodeIds = new Map<string, number>();
    for (const node of pack.skillTree.nodes) {
      const created = await tauriService.createSkillNode({
        tree_id: tree.id,
        name: node.name,
        description: node.description,
        icon: node.icon,
        xp_cost: node.xp_cost,
        tier: node.tier,
        parent_id: node.parentKey ? nodeIds.get(node.parentKey) ?? null : null,
        requirements: node.requirements ?? [],
      });
      nodeIds.set(node.key, created.id);
    }

    for (const boss of pack.bosses) {
      await tauriService.createBoss({ ...boss, session_id: sessionId });
    }

    for (const attribute of pack.attributes) {
      await tauriService.createAttribute({ ...attribute, session_id: sessionId });
    }

    await Promise.all([
      taskStore.fetchTasks(),
      skillStore.fetchTrees(),
      bossStore.fetchBosses(),
      attributeStore.fetchAttributes(),
    ]);

    persistInstalledIds([...new Set([...installedIds.value, pack.id])]);
    message.value = `Paquete instalado: ${pack.title}`;
  } catch (error) {
    message.value = `No se pudo instalar "${pack.title}": ${String(error)}`;
  } finally {
    installingId.value = null;
  }
}
</script>

<template>
  <div class="packages-page">
    <div class="packages-header anim-slide-up">
      <div>
        <h2>Paquetes de la Comunidad</h2>
        <p class="subtitle">Plantillas listas para crear tareas, skill trees, bosses y recompensas.</p>
      </div>
      <div class="summary-chip">
        <PixelIcon name="bag" :size="14" color="var(--accent)" />
        <span>{{ communityPackages.length }} paquetes</span>
      </div>
    </div>

    <div class="filter-row anim-slide-up delay-1">
      <button class="tag-btn" :class="{ active: selectedTag === null }" @click="selectedTag = null">
        Todos
      </button>
      <button
        v-for="tag in allTags"
        :key="tag"
        class="tag-btn"
        :class="{ active: selectedTag === tag }"
        @click="selectedTag = tag"
      >
        {{ tag }}
      </button>
    </div>

    <p v-if="message" class="status-msg">{{ message }}</p>

    <div class="packages-grid anim-slide-up delay-2">
      <article
        v-for="pack in visiblePackages"
        :key="pack.id"
        class="package-card"
        :style="{ '--pack-color': pack.color }"
      >
        <div class="package-top">
          <div class="package-icon">
            <PixelIcon :name="pack.icon" :size="20" />
          </div>
          <div class="package-title-block">
            <h3>{{ pack.title }}</h3>
            <span>{{ pack.discipline }}</span>
          </div>
        </div>

        <p class="package-summary">{{ pack.summary }}</p>

        <div class="package-stats">
          <span>{{ pack.tasks.length }} tareas</span>
          <span>{{ pack.skillTree.nodes.length }} skills</span>
          <span>{{ pack.bosses.length }} boss</span>
        </div>

        <div class="package-tags">
          <span v-for="tag in pack.tags" :key="tag">{{ tag }}</span>
        </div>

        <button
          class="install-btn"
          :disabled="installingId !== null || isInstalled(pack.id)"
          @click="installPackage(pack)"
        >
          <PixelIcon :name="isInstalled(pack.id) ? 'check' : 'plus'" :size="12" />
          <span v-if="isInstalled(pack.id)">Instalado</span>
          <span v-else-if="installingId === pack.id">Instalando...</span>
          <span v-else>Instalar paquete</span>
        </button>
      </article>
    </div>
  </div>
</template>

<style scoped>
.packages-page {
  padding: 1.5rem 2rem;
  max-width: 1180px;
  min-height: 100%;
}

.packages-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.subtitle {
  color: var(--text-muted, #94a3b8);
  margin: 0;
}

.summary-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border: 2px solid var(--border-color, #312e81);
  background: var(--bg-deep, #0a0a12);
  color: var(--text-muted, #94a3b8);
  white-space: nowrap;
}

.filter-row {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.tag-btn {
  border: 2px solid var(--border-color, #312e81);
  background: transparent;
  color: var(--text-muted, #94a3b8);
  padding: 0.28rem 0.65rem;
  font-size: 0.82rem;
  transition: all 0.08s;
}

.tag-btn:hover,
.tag-btn.active {
  border-color: var(--accent, #a855f7);
  color: var(--accent-light, #c084fc);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
}

.status-msg {
  border: 2px solid var(--border-color, #312e81);
  background: var(--bg-deep, #0a0a12);
  color: var(--info, #00f0ff);
  padding: 0.45rem 0.7rem;
  margin: 0 0 1rem;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.package-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 300px;
  border: 2px solid color-mix(in srgb, var(--pack-color) 55%, var(--border-color));
  background: var(--card-bg, #1e1b4b);
  padding: 1rem;
  box-shadow: var(--shadow-sm, 4px 4px 0 rgba(0, 0, 0, 0.5));
}

.package-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.package-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--pack-color);
  color: var(--pack-color);
  background: color-mix(in srgb, var(--pack-color) 16%, transparent);
  flex-shrink: 0;
}

.package-title-block {
  min-width: 0;
}

.package-title-block h3 {
  margin: 0;
  color: var(--text, #e2e8f0);
  font-size: 1.1rem;
  line-height: 1.05;
}

.package-title-block span {
  color: var(--pack-color);
  font-family: "Press Start 2P", cursive;
  font-size: 0.4rem;
  text-transform: uppercase;
}

.package-summary {
  color: var(--text-muted, #94a3b8);
  margin: 0;
  min-height: 3rem;
}

.package-stats {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.package-stats span,
.package-tags span {
  border: 2px solid var(--border-color, #312e81);
  background: var(--bg-deep, #0a0a12);
  color: var(--text-muted, #94a3b8);
  padding: 0.18rem 0.45rem;
  font-size: 0.75rem;
}

.package-tags {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: auto;
}

.install-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 2px solid var(--pack-color);
  background: color-mix(in srgb, var(--pack-color) 20%, transparent);
  color: var(--text, #e2e8f0);
  padding: 0.5rem 0.7rem;
  font-family: "Press Start 2P", cursive;
  font-size: 0.42rem;
  text-transform: uppercase;
  transition: all 0.08s;
}

.install-btn:hover:not(:disabled) {
  background: var(--pack-color);
  color: #050505;
  box-shadow: var(--shadow-sm, 4px 4px 0 rgba(0, 0, 0, 0.5));
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
