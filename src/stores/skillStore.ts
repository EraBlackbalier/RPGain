// ═══════════════════════════════════════════════════════════════
//  STORE: skillStore (Pinia - Gestión de Árboles de Habilidades)
// ═══════════════════════════════════════════════════════════════
// Este store maneja los "Skill Trees" (árboles de habilidades).
// Cada árbol está ligado a una categoría de tarea (ej: "coding").
// Dentro de cada árbol hay "nodos" que representan habilidades.
// Para desbloquear un nodo necesitas XP (ganada haciendo tareas de esa categoría).
// ═══════════════════════════════════════════════════════════════

import { defineStore } from "pinia";
import { ref, computed } from "vue";

// Importamos los tipos: SkillTree (árbol completo) y CreateSkillNodePayload (datos para crear nodo).
import type { SkillTree, CreateSkillNodePayload } from "../models/Skill";

// Importamos el servicio que habla con el backend (Rust/Tauri).
import * as tauriService from "../services/tauriService";

// ── CREACIÓN DEL STORE ──
export const useSkillStore = defineStore("skills", () => {
  // ── ESTADO REACTIVO ──

  // Array con todos los árboles de habilidades.
  // Cada SkillTree contiene: id, task_type, icon, available_xp, spent_xp, nodes[]
  const trees = ref<SkillTree[]>([]);

  // loading: true cuando estamos pidiendo datos al backend.
  const loading = ref(false);

  // error: string si algo falla; null si todo bien.
  const error = ref<string | null>(null);

  // ID del árbol actualmente seleccionado por el usuario.
  // `null` significa "ninguno seleccionado, muestra el primero por defecto".
  const selectedTreeId = ref<number | null>(null);

  // ── PROPIEDADES COMPUTADAS (computed) ──

  /**
   * Devuelve el árbol ACTUALMENTE seleccionado.
   * Si `selectedTreeId` es null, devuelve el primer árbol del array (si existe).
   * Si no hay árboles, devuelve null.
   * El `??` es "nullish coalescing": devuelve el valor de la derecha si la izquierda es null/undefined.
   */
  const selectedTree = computed(() => {
    if (selectedTreeId.value === null) return trees.value[0] ?? null;
    return trees.value.find((t) => t.id === selectedTreeId.value) ?? null;
  });

  /** Total de nodos desbloqueados en TODOS los árboles combinados. */
  const totalUnlocked = computed(() =>
    trees.value.reduce((sum, t) => sum + t.nodes.filter((n) => n.unlocked).length, 0)
  );

  /** Total de nodos (desbloqueados + bloqueados) en TODOS los árboles. */
  const totalNodes = computed(() =>
    trees.value.reduce((sum, t) => sum + t.nodes.length, 0)
  );

  // ── FUNCIONES AUXILIARES ──

  /**
   * Actualiza un árbol en el array local `trees`.
   * Si lo encuentra por ID, lo reemplaza. Si no, lo agrega al final.
   * Útil después de desbloquear un nodo (el backend devuelve el árbol actualizado).
   */
  function updateTree(updated: SkillTree) {
    const idx = trees.value.findIndex((t) => t.id === updated.id);
    if (idx !== -1) trees.value[idx] = updated;  // Reemplaza existente
    else trees.value.push(updated);              // Agrega nuevo
  }

  // ── ACCIONES ──

  /**
   * Carga todos los árboles de habilidades desde el backend (SQLite via Rust).
   * Incluye sus nodos, XP disponible, etc.
   */
  async function fetchTrees() {
    loading.value = true;
    error.value = null;
    try {
      trees.value = await tauriService.getSkillTrees();
    } catch (e) {
      error.value = String(e);
      console.error("Error fetching skill trees:", e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crea un nuevo árbol de habilidades para una categoría de tarea.
   * `taskType`: nombre de la categoría (ej: "coding", "fitness").
   * `icon`: nombre del icono pixel-art.
   * Llama al backend y agrega el árbol al array local.
   */
  async function addTree(taskType: string, icon: string) {
    error.value = null;
    try {
      const tree = await tauriService.createSkillTree(taskType, icon);
      trees.value.push(tree);
      return tree;
    } catch (e) {
      error.value = String(e);
      console.error("Error creating skill tree:", e);
    }
  }

  /**
   * Crea un nuevo nodo (habilidad) dentro de un árbol.
   * `payload`: datos del nodo (nombre, costo XP, tier, padre, etc.).
   * Después de crearlo en el backend, lo agrega al array de nodos del árbol local.
   */
  async function addNode(payload: CreateSkillNodePayload) {
    error.value = null;
    try {
      const node = await tauriService.createSkillNode(payload);
      // Buscamos el árbol al que pertenece este nodo.
      const tree = trees.value.find((t) => t.id === payload.tree_id);
      if (tree) tree.nodes.push(node); // Agregamos el nodo al árbol local
      return node;
    } catch (e) {
      error.value = String(e);
      console.error("Error creating skill node:", e);
    }
  }

  /**
   * Desbloquea un nodo gastando XP.
   * El backend verifica que tengas suficiente XP y que el padre esté desbloqueado.
   * Después actualiza el árbol local con los datos del backend.
   */
  async function unlockNode(nodeId: number) {
    error.value = null;
    try {
      const updatedTree = await tauriService.unlockSkillNode(nodeId);
      updateTree(updatedTree); // Sincronizamos el árbol actualizado
      return updatedTree;
    } catch (e) {
      error.value = String(e);
      console.error("Error unlocking node:", e);
    }
  }

  /**
   * Elimina un árbol de habilidades completo.
   * Primero borra en el backend, luego quita del array local.
   * Si el árbol borrado estaba seleccionado, limpia la selección.
   */
  async function removeTree(treeId: number) {
    error.value = null;
    try {
      await tauriService.deleteSkillTree(treeId);
      trees.value = trees.value.filter((t) => t.id !== treeId);
      if (selectedTreeId.value === treeId) selectedTreeId.value = null;
    } catch (e) {
      error.value = String(e);
      console.error("Error deleting skill tree:", e);
    }
  }

  /** Selecciona un árbol por ID. `null` = ninguno (mostrará el primero por defecto). */
  function selectTree(id: number | null) {
    selectedTreeId.value = id;
  }

  // ── EXPORTACIÓN ──
  // Todo lo que retornamos aquí es ACCESIBLE desde los componentes.
  return {
    trees,           // Array de árboles
    loading,       // Estado de carga
    error,         // Mensaje de error
    selectedTreeId,// ID del árbol seleccionado
    selectedTree,  // Árbol seleccionado (computed)
    totalUnlocked, // Total nodos desbloqueados (computed)
    totalNodes,    // Total nodos (computed)
    fetchTrees,    // Cargar árboles
    addTree,       // Crear árbol
    addNode,       // Crear nodo
    unlockNode,    // Desbloquear nodo
    removeTree,    // Eliminar árbol
    selectTree,    // Seleccionar árbol
  };
});
