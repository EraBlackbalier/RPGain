<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════
//  COMPONENTE: SplashScreen (Pantalla de Inicio + Selección)
// ═══════════════════════════════════════════════════════════════
// Pantalla inicial estilo retro. Ahora incluye flujo de selección
// de personaje y sesión antes de entrar al juego.
// Flujo:
//   1. Splash inicial (logo + botones)
//   2. Crear personaje (si no hay) o lista de personajes
//   3. Crear sesión o lista de sesiones del personaje
//   4. Iniciar juego con la sesión seleccionada
// ═══════════════════════════════════════════════════════════════
import { ref, onMounted } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import PixelIcon from "./PixelIcon.vue";
import { playStart, playHover, playClick } from "../composables/usePixelSound";
import * as tauriService from "../services/tauriService";
import type { Character } from "../models/Character";
import type { Session } from "../models/Session";
import { useSessionStore } from "../stores/sessionStore";

// ── EMITS ──
const emit = defineEmits<{
  (e: "start"): void;
}>();

// ── TIPOS DE PANTALLA ──
type Screen = "splash" | "create-character" | "characters" | "sessions" | "create-session";

// ── ESTADO ──
const screen = ref<Screen>("splash");
const characters = ref<Character[]>([]);
const sessions = ref<Session[]>([]);
const selectedCharacter = ref<Character | null>(null);
const newCharName = ref("");
const newSessionName = ref("");
const loading = ref(false);
const errorMsg = ref<string | null>(null);
const flashing = ref(false);

const sessionStore = useSessionStore();

// ── CARGA INICIAL ──
onMounted(async () => {
  await loadCharacters();
});

async function loadCharacters() {
  loading.value = true;
  errorMsg.value = null;
  try {
    characters.value = await tauriService.getCharacters();
    if (characters.value.length === 0) {
      // No hay personajes: ir directo a crear
      screen.value = "create-character";
    }
  } catch (e) {
    errorMsg.value = String(e);
  } finally {
    loading.value = false;
  }
}

async function loadSessionsForChar(charId: number) {
  loading.value = true;
  errorMsg.value = null;
  try {
    sessions.value = await tauriService.getSessions(charId);
  } catch (e) {
    errorMsg.value = String(e);
  } finally {
    loading.value = false;
  }
}

// ── ACCIONES DE PERSONAJE ──
async function createCharacter() {
  if (!newCharName.value.trim()) return;
  playClick();
  loading.value = true;
  try {
    const char = await tauriService.createCharacter(newCharName.value.trim());
    characters.value.push(char);
    selectedCharacter.value = char;
    newCharName.value = "";
    // Ir a crear la primera sesión para este personaje
    await loadSessionsForChar(char.id);
    screen.value = "create-session";
  } catch (e) {
    errorMsg.value = String(e);
  } finally {
    loading.value = false;
  }
}

function selectCharacter(char: Character) {
  playClick();
  selectedCharacter.value = char;
  loadSessionsForChar(char.id);
  screen.value = "sessions";
}

// ── ACCIONES DE SESIÓN ──
async function createSession() {
  if (!newSessionName.value.trim() || !selectedCharacter.value) return;
  playClick();
  loading.value = true;
  try {
    const sess = await tauriService.createSession(
      selectedCharacter.value.id,
      newSessionName.value.trim()
    );
    sessions.value.push(sess);
    newSessionName.value = "";
    await selectSession(sess.id);
  } catch (e) {
    errorMsg.value = String(e);
  } finally {
    loading.value = false;
  }
}

async function selectSession(sessionId: number) {
  playClick();
  await sessionStore.setActiveSession(sessionId);
  await startGame();
}

// ── INICIAR JUEGO ──
async function startGame() {
  flashing.value = true;
  playStart();
  await new Promise((r) => setTimeout(r, 500));
  const appWindow = getCurrentWindow();
  await appWindow.setResizable(true);
  await appWindow.setSize({ type: "Logical", width: 1200, height: 800 } as any);
  await appWindow.center();
  emit("start");
}
</script>

<template>
  <div class="splash" :class="{ flash: flashing }">
    <div class="splash-inner" :class="{ shrink: flashing }">

      <!-- ═══════ PANTALLA: SPLASH INICIAL ═══════ -->
      <template v-if="screen === 'splash'">
        <div class="logo-block" @mouseenter="playHover">
          <PixelIcon name="shield" :size="32" color="var(--accent)" />
        </div>
        <h1 class="game-title">RPGain</h1>
        <p class="subtitle">Quest Manager</p>
        <div class="divider"></div>

        <button class="menu-btn" @mouseenter="playHover" @click="screen = 'create-character'; playClick()">
          <PixelIcon name="sword" :size="12" />
          <span>Nueva Partida</span>
        </button>

        <button v-if="characters.length > 0" class="menu-btn alt" @mouseenter="playHover" @click="screen = 'characters'; playClick()">
          <PixelIcon name="scroll" :size="12" />
          <span>Continuar</span>
        </button>

        <p class="version">v1.0.0</p>
      </template>

      <!-- ═══════ PANTALLA: CREAR PERSONAJE ═══════ -->
      <template v-else-if="screen === 'create-character'">
        <div class="logo-block">
          <PixelIcon name="user" :size="28" color="var(--info)" />
        </div>
        <h2 class="screen-title">Nuevo Heroe</h2>
        <div class="divider"></div>
        <p class="hint">Escribe el nombre de tu personaje</p>
        <input
          v-model="newCharName"
          class="retro-input"
          placeholder="Ej: Arthas, Link..."
          @keyup.enter="createCharacter"
        />
        <button class="menu-btn" @click="createCharacter" @mouseenter="playHover">
          <PixelIcon name="sword" :size="12" />
          <span>Crear Personaje</span>
        </button>
        <button v-if="characters.length > 0" class="back-btn" @click="screen = 'splash'">
          &lt; Atras
        </button>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <p v-if="loading" class="hint">Cargando...</p>
      </template>

      <!-- ═══════ PANTALLA: LISTA DE PERSONAJES ═══════ -->
      <template v-else-if="screen === 'characters'">
        <div class="logo-block">
          <PixelIcon name="users" :size="28" color="var(--warning)" />
        </div>
        <h2 class="screen-title">Elije tu Heroe</h2>
        <div class="divider"></div>
        <div class="list">
          <button
            v-for="c in characters"
            :key="c.id"
            class="list-item"
            @mouseenter="playHover"
            @click="selectCharacter(c)"
          >
            <PixelIcon name="user" :size="12" />
            <span>{{ c.name }}</span>
          </button>
        </div>
        <button class="menu-btn alt" @click="screen = 'create-character'; playClick()">
          <PixelIcon name="plus" :size="12" />
          <span>Nuevo Heroe</span>
        </button>
        <button class="back-btn" @click="screen = 'splash'">
          &lt; Atras
        </button>
      </template>

      <!-- ═══════ PANTALLA: LISTA DE SESIONES ═══════ -->
      <template v-else-if="screen === 'sessions'">
        <div class="logo-block">
          <PixelIcon name="scroll" :size="28" color="var(--success)" />
        </div>
        <h2 class="screen-title">Sesiones de {{ selectedCharacter?.name }}</h2>
        <div class="divider"></div>
        <div class="list">
          <button
            v-for="s in sessions"
            :key="s.id"
            class="list-item"
            :class="{ active: s.is_active }"
            @mouseenter="playHover"
            @click="selectSession(s.id)"
          >
            <PixelIcon name="scroll" :size="12" :color="s.is_active ? 'var(--success)' : 'var(--text-muted)'" />
            <span>{{ s.name }}</span>
          </button>
        </div>
        <button class="menu-btn alt" @click="screen = 'create-session'; playClick()">
          <PixelIcon name="plus" :size="12" />
          <span>Nueva Sesion</span>
        </button>
        <button class="back-btn" @click="screen = 'characters'">
          &lt; Atras
        </button>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </template>

      <!-- ═══════ PANTALLA: CREAR SESION ═══════ -->
      <template v-else-if="screen === 'create-session'">
        <div class="logo-block">
          <PixelIcon name="scroll" :size="28" color="var(--accent)" />
        </div>
        <h2 class="screen-title">Nueva Sesion</h2>
        <p class="hint">{{ selectedCharacter?.name }}</p>
        <div class="divider"></div>
        <input
          v-model="newSessionName"
          class="retro-input"
          placeholder="Ej: Main, Hardcore, Speedrun..."
          @keyup.enter="createSession"
        />
        <button class="menu-btn" @click="createSession" @mouseenter="playHover">
          <PixelIcon name="sword" :size="12" />
          <span>Crear Sesion</span>
        </button>
        <button class="back-btn" @click="screen = 'sessions'">
          &lt; Atras
        </button>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <p v-if="loading" class="hint">Cargando...</p>
      </template>

    </div>

    <!-- Efectos visuales -->
    <div class="scanlines"></div>
    <div v-if="flashing" class="flash-overlay"></div>
  </div>
</template>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg-deep, #0a0a12);
  display: flex;
  align-items: center;
  justify-content: center;
  image-rendering: pixelated;
}
.splash.flash {
  animation: screenFlash 0.5s steps(5) forwards;
}

.splash-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  padding: 1rem;
  border: 3px solid var(--border-color, #312e81);
  background: var(--bg, #13131f);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.6);
  width: 280px;
  max-height: 90vh;
  overflow-y: auto;
}
.splash-inner.shrink {
  animation: pixelShrink 0.5s steps(5) forwards;
}

.logo-block {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 2px solid var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  margin-bottom: 0.2rem;
  flex-shrink: 0;
}

.game-title {
  font-family: "Press Start 2P", cursive;
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--accent, #a855f7);
  text-shadow: 3px 3px 0px var(--accent-dark, #7e22ce);
  margin: 0;
  letter-spacing: 0.06em;
}

.screen-title {
  font-family: "Press Start 2P", cursive;
  font-size: 0.6rem;
  font-weight: 400;
  color: var(--accent-light, #c084fc);
  margin: 0;
  letter-spacing: 0.04em;
}

.subtitle {
  font-family: "VT323", monospace;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  margin: 0;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hint {
  font-family: "VT323", monospace;
  font-size: 0.7rem;
  color: var(--text-dim, #475569);
  margin: 0;
}

.error {
  font-family: "VT323", monospace;
  font-size: 0.7rem;
  color: var(--danger, #ef4444);
  margin: 0;
}

.divider {
  width: 70%;
  height: 2px;
  background: var(--border-color, #312e81);
  margin: 0.3rem 0;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 2px solid var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--accent-light, #c084fc);
  font-family: "Press Start 2P", cursive;
  font-size: 0.42rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.08s;
  margin: 0.2rem 0;
}
.menu-btn:hover {
  background: var(--accent, #a855f7);
  color: #000;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
}
.menu-btn.alt {
  border-color: var(--border-color, #312e81);
  background: transparent;
  color: var(--text-muted, #94a3b8);
}
.menu-btn.alt:hover {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
  color: var(--accent-light, #c084fc);
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--text-dim, #475569);
  font-family: "VT323", monospace;
  font-size: 0.65rem;
  cursor: pointer;
  padding: 0.2rem;
  transition: color 0.08s;
}
.back-btn:hover {
  color: var(--text-muted, #94a3b8);
}

.retro-input {
  width: 100%;
  background: var(--bg-deep, #0a0a12);
  border: 2px solid var(--border-color, #312e81);
  color: var(--text, #e2e8f0);
  font-family: inherit;
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  text-align: center;
}
.retro-input:focus {
  outline: none;
  border-color: var(--accent, #a855f7);
}

.list {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.2rem;
  max-height: 140px;
  overflow-y: auto;
}
.list-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem;
  border: 2px solid var(--border-color, #312e81);
  background: var(--bg-deep, #0a0a12);
  color: var(--text, #e2e8f0);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.08s;
}
.list-item:hover {
  border-color: var(--accent, #a855f7);
  background: var(--accent-glow, rgba(168, 85, 247, 0.15));
}
.list-item.active {
  border-color: var(--success, #39ff14);
  color: var(--success, #39ff14);
}

.version {
  font-family: "VT323", monospace;
  font-size: 0.55rem;
  color: var(--text-dim, #475569);
  margin: 0;
}

.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.08),
    rgba(0, 0, 0, 0.08) 1px,
    transparent 1px,
    transparent 3px
  );
  z-index: 1;
}

.flash-overlay {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  animation: flashBurst 0.5s steps(5) forwards;
}

@keyframes pixelShrink {
  0% { transform: scale(1); opacity: 1; }
  40% { transform: scale(0.7); opacity: 0.6; }
  70% { transform: scale(0.3); opacity: 0.2; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes screenFlash {
  0% { background: var(--bg-deep, #0a0a12); }
  40% { background: #2a1a4a; }
  70% { background: #553388; }
  100% { background: var(--bg-deep, #0a0a12); }
}

@keyframes flashBurst {
  0% { opacity: 0; }
  30% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0; }
}
</style>
