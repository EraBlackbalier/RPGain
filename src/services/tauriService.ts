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
import type { Character } from "../models/Character";
import type { Session } from "../models/Session";
import type { Boss, CreateBossPayload } from "../models/Boss";
import type { Attribute, CreateAttributePayload } from "../models/Attribute";
import type { Note, CreateNotePayload, UpdateNotePayload } from "../models/Note";

// ── TAREAS (Tasks) ──

/**
 * Obtiene TODAS las tareas guardadas en la base de datos (SQLite).
 * Llama al comando Rust `get_tasks`.
 * Devuelve un array de objetos Task.
 */
export async function getTasks(sessionId: number): Promise<Task[]> {
  return await invoke<Task[]>("get_tasks", { sessionId });
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
export async function getStats(sessionId: number): Promise<{
  total_xp: number;
  tasks_completed: number;
  tasks_total: number;
  endless_iterations: number;
}> {
  return await invoke("get_stats", { sessionId });
}

// ── XP (Experiencia) ──

/**
 * Obtiene el historial de registros de XP.
 * Cada registro dice: "ganaste X XP por hacer Y tarea en Z fecha".
 * `limit` es opcional: si lo pasas, solo trae esa cantidad de registros.
 * Llama al comando Rust `get_xp_logs`.
 */
export async function getXpLogs(sessionId: number, limit?: number): Promise<XPLog[]> {
  return await invoke<XPLog[]>("get_xp_logs", { sessionId, limit: limit ?? null });
}

/**
 * Obtiene un resumen de XP agrupado por categoría/tipo de tarea.
 * Útil para gráficos de barras en Analytics.
 * Devuelve algo como: [{ task_type: "coding", total_xp: 150, log_count: 5 }, ...]
 * Llama al comando Rust `get_xp_by_type`.
 */
export async function getXpByType(sessionId: number): Promise<XPByType[]> {
  return await invoke<XPByType[]>("get_xp_by_type", { sessionId });
}

/**
 * Obtiene la suma TOTAL de toda la XP ganada en la historia de la app.
 * Es un solo número (ej: 1250).
 * Llama al comando Rust `get_total_logged_xp`.
 */
export async function getTotalLoggedXp(sessionId: number): Promise<number> {
  return await invoke<number>("get_total_logged_xp", { sessionId });
}

// ── SKILL TREES (Árboles de Habilidades) ──

/**
 * Obtiene todos los árboles de habilidades con sus nodos.
 * Cada árbol incluye su categoría, XP disponible, gastada, y lista de nodos.
 * Llama al comando Rust `get_skill_trees`.
 */
export async function getSkillTrees(sessionId: number): Promise<SkillTree[]> {
  return await invoke<SkillTree[]>("get_skill_trees", { sessionId });
}

/**
 * Crea un nuevo árbol de habilidades para una categoría de tarea.
 * `taskType`: nombre de la categoría (ej: "coding", "fitness").
 * `icon`: nombre del icono pixel-art que se mostrará.
 * `color`: color HEX del árbol (ej: "#a855f7").
 * Llama al comando Rust `create_skill_tree`.
 */
export async function createSkillTree(sessionId: number, taskType: string, icon: string, color: string): Promise<SkillTree> {
  return await invoke<SkillTree>("create_skill_tree", { sessionId, taskType, icon, color });
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
 * Verifica si un nodo cumple todos sus requisitos adicionales
 * (atributos equipados, bosses derrotados, nivel alcanzado, etc).
 * `nodeId`: ID del nodo a verificar.
 * `sessionId`: ID de la sesión activa.
 * Llama al comando Rust `check_skill_node_requirements`.
 */
export async function checkSkillNodeRequirements(nodeId: number, sessionId: number): Promise<boolean> {
  return await invoke<boolean>("check_skill_node_requirements", { nodeId, sessionId });
}

/**
 * Elimina un árbol de habilidades completo (y todos sus nodos).
 * `treeId`: ID del árbol a borrar.
 * Llama al comando Rust `delete_skill_tree`.
 */
export async function deleteSkillTree(treeId: number): Promise<void> {
  return await invoke<void>("delete_skill_tree", { treeId });
}

// ── CHARACTERS & SESSIONS ──

export async function getCharacters(): Promise<Character[]> {
  return await invoke<Character[]>("get_characters");
}

export async function createCharacter(name: string): Promise<Character> {
  return await invoke<Character>("create_character", { name });
}

export async function getSessions(characterId: number): Promise<Session[]> {
  return await invoke<Session[]>("get_sessions", { characterId });
}

export async function createSession(characterId: number, name: string): Promise<Session> {
  return await invoke<Session>("create_session", { characterId, name });
}

export async function setActiveSession(sessionId: number): Promise<Session> {
  return await invoke<Session>("set_active_session", { sessionId });
}

export async function getActiveSession(): Promise<Session | null> {
  return await invoke<Session | null>("get_active_session");
}

// ── BOSSES ──

export async function getBosses(sessionId: number): Promise<Boss[]> {
  return await invoke<Boss[]>("get_bosses", { sessionId });
}

export async function createBoss(payload: CreateBossPayload): Promise<Boss> {
  return await invoke<Boss>("create_boss", { payload });
}

export async function deleteBoss(bossId: number): Promise<void> {
  return await invoke<void>("delete_boss", { bossId });
}

export async function updateBossRequirement(requirementId: number, currentValue: number): Promise<Boss> {
  return await invoke<Boss>("update_boss_requirement", { requirementId, currentValue });
}

export async function defeatBoss(bossId: number, sessionId: number): Promise<Boss> {
  return await invoke<Boss>("defeat_boss", { bossId, sessionId });
}

export async function checkBossRequirements(bossId: number, sessionId: number): Promise<Boss> {
  return await invoke<Boss>("check_boss_requirements", { bossId, sessionId });
}

// ── ATTRIBUTES ──

export async function getAttributes(sessionId: number): Promise<Attribute[]> {
  return await invoke<Attribute[]>("get_attributes", { sessionId });
}

export async function createAttribute(payload: CreateAttributePayload): Promise<Attribute> {
  return await invoke<Attribute>("create_attribute", { payload });
}

export async function deleteAttribute(attributeId: number): Promise<void> {
  return await invoke<void>("delete_attribute", { attributeId });
}

export async function unlockAttribute(attributeId: number): Promise<Attribute> {
  return await invoke<Attribute>("unlock_attribute", { attributeId });
}

export async function toggleEquipAttribute(attributeId: number): Promise<Attribute> {
  return await invoke<Attribute>("toggle_equip_attribute", { attributeId });
}

export async function getActiveEffects(sessionId: number): Promise<Attribute[]> {
  return await invoke<Attribute[]>("get_active_effects", { sessionId });
}

// ── IMPORT / EXPORT ──

export async function exportSessionData(sessionId: number): Promise<string> {
  return await invoke<string>("export_session_data", { sessionId });
}

export async function importSessionData(sessionId: number, jsonData: string): Promise<string> {
  return await invoke<string>("import_session_data", { sessionId, jsonData });
}

// ── NOTAS (Notes - Bloc de Notas) ──

/**
 * Obtiene todas las notas de la sesión activa.
 */
export async function getNotes(sessionId: number): Promise<Note[]> {
  return await invoke<Note[]>("get_notes", { sessionId });
}

/**
 * Crea una nueva nota.
 */
export async function createNote(payload: CreateNotePayload): Promise<Note> {
  return await invoke<Note>("create_note", { payload });
}

/**
 * Actualiza una nota existente.
 */
export async function updateNote(payload: UpdateNotePayload): Promise<Note> {
  return await invoke<Note>("update_note", { payload });
}

/**
 * Elimina una nota.
 */
export async function deleteNote(noteId: number): Promise<void> {
  return await invoke<void>("delete_note", { noteId });
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
