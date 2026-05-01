// ═══════════════════════════════════════════════════════════════
//  STORE: taskStore (Pinia - Gestión de Tareas)
// ═══════════════════════════════════════════════════════════════
// Un "store" en Pinia es como el "cerebro" de una parte de la app.
// Guarda datos (estado) y funciones (acciones) relacionados con las tareas.
// Cualquier componente puede usar este store para leer o modificar tareas.
// ═══════════════════════════════════════════════════════════════

// `defineStore`: función de Pinia para crear un store.
// El primer argumento "tasks" es el ID único del store.
// El segundo es una función que devuelve el estado y las acciones.
import { defineStore } from "pinia";

// `ref`: crea una variable reactiva (cuando cambia, Vue actualiza la UI).
// `computed`: crea una propiedad calculada (se recalcula automáticamente
//   cuando sus dependencias cambian).
// `reactive`: crea un objeto reactivo (todos sus campos son observables).
import { ref, computed, reactive } from "vue";

// Importamos los tipos (modelos) de datos para que TypeScript sepa qué forma tienen.
import type { Task, CreateTaskPayload, UpdateTaskPayload, TaskFilter } from "../models/Task";

// Importamos el servicio que habla con el backend (Rust/Tauri).
import * as tauriService from "../services/tauriService";

// Importamos el store de XP para refrescar los datos de XP
// cuando una tarea se completa o progresa (ganas XP).
import { useXpStore } from "./xpStore";

// ── CREACIÓN DEL STORE ──
export const useTaskStore = defineStore("tasks", () => {
  // ── ESTADO REACTIVO ──
  // `ref<Task[]>([])` crea una variable reactiva que es un array de Tasks.
  // Inicialmente está vacío ([]). Cuando se llena, todos los componentes
  // que lo usan se actualizan automáticamente.
  const tasks = ref<Task[]>([]);

  // `loading` indica si en este momento estamos esperando una respuesta del backend.
  // Útil para mostrar spinners o deshabilitar botones mientras carga.
  const loading = ref(false);

  // `error` guarda el texto de un error si algo sale mal.
  // null = no hay error. Si hay un string, muestra el mensaje.
  const error = ref<string | null>(null);

  // `filters` es un objeto reactivo con los filtros activos del usuario.
  // reactive hace que CUALQUIER cambio en sus propiedades sea detectado por Vue.
  const filters = reactive<TaskFilter>({
    type: null,            // Filtrar por categoría (ej: "coding")
    priority: null,        // Filtrar por prioridad (low, normal, high, critical)
    kind: null,            // Filtrar por tipo de tarea (finite, endless)
    showCompleted: false,  // true = muestra también tareas ya terminadas
  });

  // ── PROPIEDADES COMPUTADAS (computed) ──
  // Estas se recalculan AUTOMÁTICAMENTE cuando cambian `tasks` o `filters`.

  /** Lista de tareas VISIBLES según los filtros activos. */
  const filteredTasks = computed(() => {
    return tasks.value.filter((t) => {
      // Si no mostramos completadas Y la tarea está completada → la quitamos
      if (!filters.showCompleted && t.completed) return false;
      // Si hay filtro de tipo Y la tarea no incluye ese tipo → la quitamos
      if (filters.type && !t.types.includes(filters.type)) return false;
      // Si hay filtro de prioridad Y no coincide → la quitamos
      if (filters.priority && t.priority !== filters.priority) return false;
      // Si hay filtro de kind Y no coincide → la quitamos
      if (filters.kind && t.task_kind !== filters.kind) return false;
      return true; // Si pasó todos los filtros, se queda
    });
  });

  /** Cantidad de tareas completadas (todas, sin filtro). */
  const completedCount = computed(() => tasks.value.filter((t) => t.completed).length);

  /** Cantidad de tareas pendientes (todas, sin filtro). */
  const pendingCount = computed(() => tasks.value.filter((t) => !t.completed).length);

  /** Cantidad de tareas de tipo "endless" (repetibles). */
  const endlessCount = computed(() => tasks.value.filter((t) => t.task_kind === "endless").length);

  /** XP total calculado desde las tareas (para mostrar en stats).
   *  Suma XP de tareas finitas completadas + iteraciones de endless.
   */
  const totalXp = computed(() => {
    let xp = 0;
    for (const t of tasks.value) {
      if (t.completed) xp += t.xp_reward;
      if (t.task_kind === "endless") xp += t.xp_reward * t.iteration_count;
    }
    return xp;
  });

  /** Porcentaje de tareas finitas completadas (0-100).
   *  Solo cuenta tareas "finite"; endless no afectan este rate.
   */
  const completionRate = computed(() => {
    const finite = tasks.value.filter((t) => t.task_kind === "finite");
    if (finite.length === 0) return 0; // Evita división por cero
    const done = finite.filter((t) => t.completed).length;
    return Math.round((done / finite.length) * 100);
  });

  /** Lista ÚNICA y ORDENADA de todas las categorías/types existentes.
   *  Usa un `Set` para eliminar duplicados.
   */
  const allTypes = computed(() => {
    const set = new Set<string>();
    for (const t of tasks.value) {
      for (const type of t.types) set.add(type);
    }
    return Array.from(set).sort();
  });

  // ── FUNCIONES AUXILIARES ──

  /**
   * Actualiza una tarea en el array local `tasks`.
   * Si la encuentra por ID, la reemplaza. Si no, la agrega al inicio.
   * Esto evita tener que volver a pedir TODO el listado al backend.
   */
  function updateLocal(updated: Task) {
    const idx = tasks.value.findIndex((t) => t.id === updated.id);
    if (idx !== -1) tasks.value[idx] = updated;   // Reemplaza existente
    else tasks.value.unshift(updated);             // Agrega nueva al inicio
  }

  // ── ACCIONES (funciones que modifican datos) ──

  /**
   * Carga todas las tareas desde el backend (SQLite via Rust).
   * Pone `loading = true` mientras espera, y `false` al terminar.
   */
  async function fetchTasks() {
    loading.value = true;
    error.value = null;
    try {
      tasks.value = await tauriService.getTasks();
    } catch (e) {
      error.value = String(e);
      console.error("Error fetching tasks:", e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crea una tarea nueva en la base de datos.
   * `payload`: datos de la tarea (título, descripción, tipo, etc.).
   * Al crearla, la agrega al inicio del array local.
   */
  async function addTask(payload: CreateTaskPayload) {
    error.value = null;
    try {
      const newTask = await tauriService.createTask(payload);
      tasks.value.unshift(newTask); // `unshift` agrega al INICIO del array
      return newTask;
    } catch (e) {
      error.value = String(e);
      console.error("Error creating task:", e);
    }
  }

  /**
   * Edita una tarea existente (título, descripción, etc.).
   * Llama al backend, luego actualiza localmente con `updateLocal`.
   */
  async function editTask(payload: UpdateTaskPayload) {
    error.value = null;
    try {
      const updated = await tauriService.updateTask(payload);
      updateLocal(updated);
      return updated;
    } catch (e) {
      error.value = String(e);
      console.error("Error updating task:", e);
    }
  }

  /**
   * Cambia el progreso de una tarea (cuántos pasos lleva).
   * `taskId`: ID de la tarea.
   * `progress`: nuevo valor de progreso.
   * También refresca el store de XP porque avanzar puede dar XP.
   */
  async function setProgress(taskId: number, progress: number) {
    error.value = null;
    try {
      const updated = await tauriService.updateProgress(taskId, progress);
      updateLocal(updated);
      useXpStore().refresh(); // Refresca XP porque el progreso puede generar XP
      return updated;
    } catch (e) {
      error.value = String(e);
      console.error("Error updating progress:", e);
    }
  }

  /**
   * Marca una tarea como completada.
   * Para tareas "finite": se marcan done.
   * Para tareas "endless": suma una iteración.
   * Siempre refresca el XP store porque completar da XP.
   */
  async function markComplete(taskId: number) {
    error.value = null;
    try {
      const updated = await tauriService.completeTask(taskId);
      updateLocal(updated);
      useXpStore().refresh();
      return updated;
    } catch (e) {
      error.value = String(e);
      console.error("Error completing task:", e);
    }
  }

  /**
   * Elimina una tarea permanentemente.
   * Primero borra en el backend, luego quita del array local.
   */
  async function removeTask(taskId: number) {
    error.value = null;
    try {
      await tauriService.deleteTask(taskId);
      tasks.value = tasks.value.filter((t) => t.id !== taskId);
    } catch (e) {
      error.value = String(e);
      console.error("Error deleting task:", e);
    }
  }

  /**
   * Cambia un filtro individual.
   * `key`: nombre del filtro ("type", "priority", "kind", "showCompleted").
   * `value`: nuevo valor (string, boolean, o null para desactivar).
   */
  function setFilter(key: keyof TaskFilter, value: unknown) {
    // El `as Record<string, unknown>` es un truco de TypeScript
    // para poder asignar dinámicamente a una propiedad del objeto.
    (filters as Record<string, unknown>)[key] = value;
  }

  /** Restablece TODOS los filtros a su valor por defecto. */
  function resetFilters() {
    filters.type = null;
    filters.priority = null;
    filters.kind = null;
    filters.showCompleted = false;
  }

  // ── EXPORTACIÓN ──
  // Todo lo que retornamos aquí es ACCESIBLE desde los componentes
  // que usen `useTaskStore()`.
  return {
    tasks,           // Array de tareas
    loading,         // Estado de carga
    error,           // Mensaje de error
    filters,         // Filtros activos
    filteredTasks,   // Tareas filtradas (computed)
    completedCount,  // Conteo completadas (computed)
    pendingCount,    // Conteo pendientes (computed)
    endlessCount,    // Conteo endless (computed)
    totalXp,         // XP total (computed)
    completionRate,  // Porcentaje completado (computed)
    allTypes,        // Tipos únicos (computed)
    fetchTasks,      // Cargar tareas
    addTask,         // Crear tarea
    editTask,        // Editar tarea
    setProgress,     // Cambiar progreso
    markComplete,    // Completar tarea
    removeTask,      // Eliminar tarea
    setFilter,       // Cambiar filtro
    resetFilters,    // Limpiar filtros
  };
});
