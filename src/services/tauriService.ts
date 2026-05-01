// ═══════════════════════════════════════════════════════════════
//  SERVICIO TAURI (Puente Frontend ↔ Backend)
// ═══════════════════════════════════════════════════════════════
// Este archivo es el "mensajero" entre el frontend (Vue) y el backend (Rust).
// Tauri expone funciones de Rust como comandos invocables desde JavaScript.
// Cada función aquí es un "wrapper" (envoltorio) que llama a una función Rust.
// La función `invoke` viene de Tauri: le dices el nombre del comando en Rust
// y los argumentos, y Tauri se encarga de enviarlo al backend y devolver la respuesta.
// ═══════════════════════════════════════════════════════════════

// Importamos la función `invoke` del core de Tauri para llamar comandos Rust.
import { invoke } from "@tauri-apps/api/core";

// Importamos los "modelos" (tipos de datos) para que TypeScript sepa
// qué forma tienen los datos que van y vienen del backend.
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "../models/Task";
import type { XPLog, XPByType } from "../models/XP";
import type { SkillTree, SkillNode, CreateSkillNodePayload } from "../models/Skill";

// ── TAREAS (Tasks) ──

/**
 * Obtiene TODAS las tareas guardadas en la base de datos (SQLite).
 * Llama al comando Rust `get_tasks`.
 * Devuelve un array de objetos Task.
 */
export async function getTasks(): Promise<Task[]> {
  return await invoke<Task[]>("get_tasks");
}

/**
 * Crea una tarea nueva en la base de datos.
 * Recibe un objeto `payload` con los datos de la tarea (título, descripción, etc.).
 * Llama al comando Rust `create_task` pasándole el payload.
 * Devuelve la tarea creada con su ID asignado.
 */
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return await invoke<Task>("create_task", { payload });
}

/**
 * Actualiza una tarea existente (por ejemplo, cambiar título o descripción).
 * Recibe un objeto `payload` que incluye el `id` de la tarea a editar.
 * Llama al comando Rust `update_task`.
 */
export async function updateTask(payload: UpdateTaskPayload): Promise<Task> {
  return await invoke<Task>("update_task", { payload });
}

/**
 * Cambia el progreso (pasos completados) de una tarea específica.
 * `taskId`: ID de la tarea a modificar.
 * `progress`: nuevo valor de progreso (ej: 2 de 5 pasos).
 * Llama al comando Rust `update_progress`.
 */
export async function updateProgress(taskId: number, progress: number): Promise<Task> {
  return await invoke<Task>("update_progress", { taskId, progress });
}

/**
 * Marca una tarea como completada.
 * Para tareas "finite", esto las marca done y otorga XP.
 * Para tareas "endless", esto suma una iteración y otorga XP.
 * Llama al comando Rust `complete_task`.
 */
export async function completeTask(taskId: number): Promise<Task> {
  return await invoke<Task>("complete_task", { taskId });
}

/**
 * Elimina permanentemente una tarea de la base de datos.
 * Recibe el `taskId` (número identificador).
 * Llama al comando Rust `delete_task`.
 * Devuelve `void` (nada) porque solo borra, no devuelve datos.
 */
export async function deleteTask(taskId: number): Promise<void> {
  return await invoke<void>("delete_task", { taskId });
}

// ── ESTADÍSTICAS ──

/**
 * Obtiene estadísticas globales del jugador:
 * - total_xp: suma de toda la experiencia ganada.
 * - tasks_completed: cuántas tareas finitas has terminado.
 * - tasks_total: cuántas tareas existen en total.
 * - endless_iterations: cuántas veces has completado tareas "endless".
 * Llama al comando Rust `get_stats`.
 */
export async function getStats(): Promise<{
  total_xp: number;
  tasks_completed: number;
  tasks_total: number;
  endless_iterations: number;
}> {
  return await invoke("get_stats");
}

// ── XP (Experiencia) ──

/**
 * Obtiene el historial de registros de XP.
 * Cada registro dice: "ganaste X XP por hacer Y tarea en Z fecha".
 * `limit` es opcional: si lo pasas, solo trae esa cantidad de registros.
 * Llama al comando Rust `get_xp_logs`.
 */
export async function getXpLogs(limit?: number): Promise<XPLog[]> {
  return await invoke<XPLog[]>("get_xp_logs", { limit: limit ?? null });
}

/**
 * Obtiene un resumen de XP agrupado por categoría/tipo de tarea.
 * Útil para gráficos de barras en Analytics.
 * Devuelve algo como: [{ task_type: "coding", total_xp: 150, log_count: 5 }, ...]
 * Llama al comando Rust `get_xp_by_type`.
 */
export async function getXpByType(): Promise<XPByType[]> {
  return await invoke<XPByType[]>("get_xp_by_type");
}

/**
 * Obtiene la suma TOTAL de toda la XP ganada en la historia de la app.
 * Es un solo número (ej: 1250).
 * Llama al comando Rust `get_total_logged_xp`.
 */
export async function getTotalLoggedXp(): Promise<number> {
  return await invoke<number>("get_total_logged_xp");
}

// ── SKILL TREES (Árboles de Habilidades) ──

/**
 * Obtiene todos los árboles de habilidades con sus nodos.
 * Cada árbol incluye su categoría, XP disponible, gastada, y lista de nodos.
 * Llama al comando Rust `get_skill_trees`.
 */
export async function getSkillTrees(): Promise<SkillTree[]> {
  return await invoke<SkillTree[]>("get_skill_trees");
}

/**
 * Crea un nuevo árbol de habilidades para una categoría de tarea.
 * `taskType`: nombre de la categoría (ej: "coding", "fitness").
 * `icon`: nombre del icono pixel-art que se mostrará.
 * Llama al comando Rust `create_skill_tree`.
 */
export async function createSkillTree(taskType: string, icon: string): Promise<SkillTree> {
  return await invoke<SkillTree>("create_skill_tree", { taskType, icon });
}

/**
 * Crea un nuevo nodo (habilidad) dentro de un árbol de habilidades.
 * `payload`: objeto con nombre, costo XP, tier, padre, etc.
 * Llama al comando Rust `create_skill_node`.
 */
export async function createSkillNode(payload: CreateSkillNodePayload): Promise<SkillNode> {
  return await invoke<SkillNode>("create_skill_node", { payload });
}

/**
 * Desbloquea un nodo de habilidad gastando XP.
 * El backend verifica automáticamente que tengas XP suficiente
 * y que el nodo padre ya esté desbloqueado.
 * `nodeId`: ID del nodo a desbloquear.
 * Llama al comando Rust `unlock_skill_node`.
 */
export async function unlockSkillNode(nodeId: number): Promise<SkillTree> {
  return await invoke<SkillTree>("unlock_skill_node", { nodeId });
}

/**
 * Elimina un árbol de habilidades completo (y todos sus nodos).
 * `treeId`: ID del árbol a borrar.
 * Llama al comando Rust `delete_skill_tree`.
 */
export async function deleteSkillTree(treeId: number): Promise<void> {
  return await invoke<void>("delete_skill_tree", { treeId });
}

// ── HEALTH CHECK ──

/**
 * Verifica que el backend Rust responde correctamente.
 * Es una simple prueba de conexión: si devuelve "ok", todo funciona.
 * Útil para diagnóstico o para saber si la app cargó bien.
 * Llama al comando Rust `health_check`.
 */
export async function healthCheck(): Promise<string> {
  return await invoke<string>("health_check");
}
