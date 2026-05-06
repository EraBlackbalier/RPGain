mod db;

use db::Database;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State};
use rusqlite::{params, OptionalExtension};
use tauri_plugin_autostart::MacosLauncher;

// --- Models ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: i64,
    pub session_id: i64,
    pub title: String,
    pub description: String,
    pub types: Vec<String>,
    pub priority: String,
    pub task_kind: String,
    pub xp_reward: i64,
    pub progress: i64,
    pub progress_total: i64,
    pub completed: bool,
    pub iteration_count: i64,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskPayload {
    pub session_id: i64,
    pub title: String,
    pub description: String,
    pub types: Vec<String>,
    pub priority: String,
    pub task_kind: String,
    pub xp_reward: i64,
    pub progress_total: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskPayload {
    pub id: i64,
    pub title: Option<String>,
    pub description: Option<String>,
    pub types: Option<Vec<String>>,
    pub priority: Option<String>,
    pub xp_reward: Option<i64>,
    pub progress_total: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct Stats {
    pub total_xp: i64,
    pub tasks_completed: i64,
    pub tasks_total: i64,
    pub endless_iterations: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct XPLog {
    pub id: i64,
    pub task_id: i64,
    pub task_type: String,
    pub action: String,
    pub xp_amount: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct XPByType {
    pub task_type: String,
    pub total_xp: i64,
    pub log_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkillTree {
    pub id: i64,
    pub session_id: i64,
    pub task_type: String,
    pub icon: String,
    pub color: String,
    pub created_at: String,
    pub nodes: Vec<SkillNode>,
    pub available_xp: i64,
    pub spent_xp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkillNodeRequirement {
    pub id: i64,
    pub node_id: i64,
    pub requirement_type: String,
    pub target_value: i64,
    pub reference_id: Option<i64>,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkillNode {
    pub id: i64,
    pub tree_id: i64,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub xp_cost: i64,
    pub tier: i64,
    pub parent_id: Option<i64>,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
    pub requirements: Vec<SkillNodeRequirement>,
}

#[derive(Debug, Deserialize)]
pub struct CreateNodeRequirementPayload {
    pub requirement_type: String,
    pub target_value: i64,
    pub reference_id: Option<i64>,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSkillNodePayload {
    pub tree_id: i64,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub xp_cost: i64,
    pub tier: i64,
    pub parent_id: Option<i64>,
    pub requirements: Vec<CreateNodeRequirementPayload>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Character {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: i64,
    pub character_id: i64,
    pub character_name: String,
    pub name: String,
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Boss {
    pub id: i64,
    pub session_id: i64,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub difficulty: i64,
    pub status: String,
    pub xp_reward: i64,
    pub created_at: String,
    pub defeated_at: Option<String>,
    pub requirements: Vec<BossRequirement>,
    pub rewards: Vec<BossReward>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BossRequirement {
    pub id: i64,
    pub boss_id: i64,
    pub requirement_type: String,
    pub description: String,
    pub target_value: i64,
    pub current_value: i64,
    pub completed: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BossReward {
    pub id: i64,
    pub boss_id: i64,
    pub reward_type: String,
    pub value: String,
    pub description: String,
    pub claimed: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateBossPayload {
    pub session_id: i64,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub difficulty: i64,
    pub xp_reward: i64,
    pub requirements: Vec<CreateRequirementPayload>,
    pub rewards: Vec<CreateRewardPayload>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRequirementPayload {
    pub requirement_type: String,
    pub description: String,
    pub target_value: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateRewardPayload {
    pub reward_type: String,
    pub value: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Attribute {
    pub id: i64,
    pub session_id: i64,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub category: String,
    pub source: String,
    pub source_id: Option<i64>,
    pub effect_type: String,
    pub effect_value: f64,
    pub rarity: i64,
    pub unlocked: bool,
    pub equipped: bool,
    pub unlocked_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAttributePayload {
    pub session_id: i64,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub category: String,
    pub source: String,
    pub source_id: Option<i64>,
    pub effect_type: String,
    pub effect_value: f64,
    pub rarity: i64,
}

// --- Helpers ---

fn row_to_task(row: &rusqlite::Row) -> rusqlite::Result<Task> {
    let types_json: String = row.get(4)?;
    let types: Vec<String> = serde_json::from_str(&types_json).unwrap_or_default();
    Ok(Task {
        id: row.get(0)?,
        session_id: row.get(1)?,
        title: row.get(2)?,
        description: row.get(3)?,
        types,
        priority: row.get(5)?,
        task_kind: row.get(6)?,
        xp_reward: row.get(7)?,
        progress: row.get(8)?,
        progress_total: row.get(9)?,
        completed: row.get::<_, i64>(10)? != 0,
        iteration_count: row.get(11)?,
        created_at: row.get(12)?,
        completed_at: row.get(13)?,
    })
}

const TASK_SELECT: &str =
    "SELECT id, session_id, title, description, types, priority, task_kind, xp_reward, progress, progress_total, completed, iteration_count, created_at, completed_at FROM tasks";

fn fetch_task_by_id(conn: &rusqlite::Connection, task_id: i64) -> Result<Task, String> {
    let sql = format!("{} WHERE id = ?1", TASK_SELECT);
    conn.query_row(&sql, params![task_id], row_to_task)
        .map_err(|e| format!("Task not found: {}", e))
}

fn log_xp(conn: &rusqlite::Connection, session_id: i64, task_id: i64, task_types: &[String], action: &str, xp_amount: i64) -> Result<(), String> {
    let now = chrono::Local::now().to_rfc3339();
    let types = if task_types.is_empty() {
        vec!["general".to_string()]
    } else {
        task_types.to_vec()
    };
    for t in &types {
        conn.execute(
            "INSERT INTO xp_logs (session_id, task_id, task_type, action, xp_amount, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![session_id, task_id, t, action, xp_amount, now],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

// --- Commands ---

#[tauri::command]
fn health_check() -> String {
    "RPGain backend is running!".to_string()
}

#[tauri::command]
fn get_tasks(db: State<Database>, session_id: i64) -> Result<Vec<Task>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let sql = format!("{} WHERE session_id = ?1 ORDER BY completed ASC, created_at DESC", TASK_SELECT);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map(params![session_id], row_to_task)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks)
}

#[tauri::command]
fn create_task(db: State<Database>, payload: CreateTaskPayload) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    let types_json = serde_json::to_string(&payload.types).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO tasks (session_id, title, description, types, priority, task_kind, xp_reward, progress_total, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            payload.session_id,
            payload.title,
            payload.description,
            types_json,
            payload.priority,
            payload.task_kind,
            payload.xp_reward,
            payload.progress_total,
            now
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    fetch_task_by_id(&conn, id)
}

#[tauri::command]
fn update_task(db: State<Database>, payload: UpdateTaskPayload) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut sets: Vec<String> = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref title) = payload.title {
        sets.push("title = ?".to_string());
        values.push(Box::new(title.clone()));
    }
    if let Some(ref description) = payload.description {
        sets.push("description = ?".to_string());
        values.push(Box::new(description.clone()));
    }
    if let Some(ref types) = payload.types {
        let json = serde_json::to_string(types).map_err(|e| e.to_string())?;
        sets.push("types = ?".to_string());
        values.push(Box::new(json));
    }
    if let Some(ref priority) = payload.priority {
        sets.push("priority = ?".to_string());
        values.push(Box::new(priority.clone()));
    }
    if let Some(xp_reward) = payload.xp_reward {
        sets.push("xp_reward = ?".to_string());
        values.push(Box::new(xp_reward));
    }
    if let Some(progress_total) = payload.progress_total {
        sets.push("progress_total = ?".to_string());
        values.push(Box::new(progress_total));
    }

    if sets.is_empty() {
        return fetch_task_by_id(&conn, payload.id);
    }

    values.push(Box::new(payload.id));
    let sql = format!("UPDATE tasks SET {} WHERE id = ?", sets.join(", "));
    let params_ref: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    conn.execute(&sql, params_ref.as_slice()).map_err(|e| e.to_string())?;

    fetch_task_by_id(&conn, payload.id)
}

#[tauri::command]
fn update_progress(db: State<Database>, task_id: i64, progress: i64) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let task = fetch_task_by_id(&conn, task_id)?;

    let new_progress = progress.max(0).min(task.progress_total);

    let steps_done = new_progress - task.progress;

    // Apply active attribute XP effects
    let (multiplier, flat_bonus) = get_active_xp_effects(&conn, task.session_id)?;
    let apply_xp = |base_xp: i64| -> i64 {
        ((base_xp as f64 * multiplier) as i64 + flat_bonus).max(0)
    };

    if new_progress >= task.progress_total && task.task_kind == "finite" {
        let now = chrono::Local::now().to_rfc3339();
        conn.execute(
            "UPDATE tasks SET progress = ?1, completed = 1, completed_at = ?2 WHERE id = ?3",
            params![new_progress, now, task_id],
        )
        .map_err(|e| e.to_string())?;
        if steps_done > 0 {
            let xp = (task.xp_reward as f64 * steps_done as f64 / task.progress_total as f64).round() as i64;
            log_xp(&conn, task.session_id, task_id, &task.types, "progress_complete", apply_xp(xp.max(1)))?;
        }
    } else if steps_done > 0 {
        conn.execute(
            "UPDATE tasks SET progress = ?1 WHERE id = ?2",
            params![new_progress, task_id],
        )
        .map_err(|e| e.to_string())?;
        let xp = (task.xp_reward as f64 * steps_done as f64 / task.progress_total as f64).round() as i64;
        log_xp(&conn, task.session_id, task_id, &task.types, "progress", apply_xp(xp.max(1)))?;
    } else {
        conn.execute(
            "UPDATE tasks SET progress = ?1 WHERE id = ?2",
            params![new_progress, task_id],
        )
        .map_err(|e| e.to_string())?;
    }

    fetch_task_by_id(&conn, task_id)
}

#[tauri::command]
fn complete_task(db: State<Database>, task_id: i64) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let task = fetch_task_by_id(&conn, task_id)?;
    let now = chrono::Local::now().to_rfc3339();

    // Apply active attribute XP effects
    let (multiplier, flat_bonus) = get_active_xp_effects(&conn, task.session_id)?;
    let adjusted_xp = ((task.xp_reward as f64 * multiplier) as i64) + flat_bonus;
    let final_xp = adjusted_xp.max(0);

    if task.task_kind == "endless" {
        conn.execute(
            "UPDATE tasks SET iteration_count = iteration_count + 1, progress = 0 WHERE id = ?1",
            params![task_id],
        )
        .map_err(|e| e.to_string())?;
        log_xp(&conn, task.session_id, task_id, &task.types, "iteration", final_xp)?;
    } else {
        conn.execute(
            "UPDATE tasks SET completed = 1, progress = progress_total, completed_at = ?1 WHERE id = ?2",
            params![now, task_id],
        )
        .map_err(|e| e.to_string())?;
        log_xp(&conn, task.session_id, task_id, &task.types, "complete", final_xp)?;
    }

    fetch_task_by_id(&conn, task_id)
}

#[tauri::command]
fn delete_task(db: State<Database>, task_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tasks WHERE id = ?1", params![task_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_stats(db: State<Database>, session_id: i64) -> Result<Stats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let tasks_total: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks WHERE session_id = ?1", params![session_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let tasks_completed: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks WHERE completed = 1 AND session_id = ?1", params![session_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let total_xp: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(xp_reward), 0) FROM tasks WHERE completed = 1 AND session_id = ?1",
            params![session_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let endless_iterations: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(iteration_count), 0) FROM tasks WHERE task_kind = 'endless' AND session_id = ?1",
            params![session_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let endless_xp: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(xp_reward * iteration_count), 0) FROM tasks WHERE task_kind = 'endless' AND session_id = ?1",
            params![session_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(Stats {
        total_xp: total_xp + endless_xp,
        tasks_completed,
        tasks_total,
        endless_iterations,
    })
}

#[tauri::command]
fn get_xp_logs(db: State<Database>, session_id: i64, limit: Option<i64>) -> Result<Vec<XPLog>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(100);
    let mut stmt = conn
        .prepare("SELECT id, task_id, task_type, action, xp_amount, created_at FROM xp_logs WHERE session_id = ?1 ORDER BY created_at DESC LIMIT ?2")
        .map_err(|e| e.to_string())?;

    let logs = stmt
        .query_map(params![session_id, lim], |row| {
            Ok(XPLog {
                id: row.get(0)?,
                task_id: row.get(1)?,
                task_type: row.get(2)?,
                action: row.get(3)?,
                xp_amount: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(logs)
}

#[tauri::command]
fn get_xp_by_type(db: State<Database>, session_id: i64) -> Result<Vec<XPByType>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT task_type, COALESCE(SUM(xp_amount), 0), COUNT(*) FROM xp_logs WHERE session_id = ?1 GROUP BY task_type ORDER BY SUM(xp_amount) DESC")
        .map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(params![session_id], |row| {
            Ok(XPByType {
                task_type: row.get(0)?,
                total_xp: row.get(1)?,
                log_count: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(results)
}

#[tauri::command]
fn get_total_logged_xp(db: State<Database>, session_id: i64) -> Result<i64, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let total: i64 = conn
        .query_row("SELECT COALESCE(SUM(xp_amount), 0) FROM xp_logs WHERE session_id = ?1", params![session_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(total)
}

// --- Skill Tree helpers ---

fn get_xp_for_type(conn: &rusqlite::Connection, task_type: &str) -> Result<i64, String> {
    conn.query_row(
        "SELECT COALESCE(SUM(xp_amount), 0) FROM xp_logs WHERE task_type = ?1",
        params![task_type],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())
}

fn get_spent_xp_for_tree(conn: &rusqlite::Connection, tree_id: i64) -> Result<i64, String> {
    conn.query_row(
        "SELECT COALESCE(SUM(xp_cost), 0) FROM skill_nodes WHERE tree_id = ?1 AND unlocked = 1",
        params![tree_id],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())
}

fn fetch_requirements_for_node(conn: &rusqlite::Connection, node_id: i64) -> Result<Vec<SkillNodeRequirement>, String> {
    let mut stmt = conn
        .prepare("SELECT id, node_id, requirement_type, target_value, reference_id, description FROM skill_node_requirements WHERE node_id = ?1")
        .map_err(|e| e.to_string())?;
    let reqs = stmt
        .query_map(params![node_id], |row| {
            Ok(SkillNodeRequirement {
                id: row.get(0)?,
                node_id: row.get(1)?,
                requirement_type: row.get(2)?,
                target_value: row.get(3)?,
                reference_id: row.get(4)?,
                description: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(reqs)
}

fn fetch_nodes_for_tree(conn: &rusqlite::Connection, tree_id: i64) -> Result<Vec<SkillNode>, String> {
    let mut stmt = conn
        .prepare("SELECT id, tree_id, name, description, icon, xp_cost, tier, parent_id, unlocked, unlocked_at FROM skill_nodes WHERE tree_id = ?1 ORDER BY tier ASC, id ASC")
        .map_err(|e| e.to_string())?;
    let nodes = stmt
        .query_map(params![tree_id], |row| {
            let node_id: i64 = row.get(0)?;
            let reqs = fetch_requirements_for_node(conn, node_id).unwrap_or_default();
            Ok(SkillNode {
                id: node_id,
                tree_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                icon: row.get(4)?,
                xp_cost: row.get(5)?,
                tier: row.get(6)?,
                parent_id: row.get(7)?,
                unlocked: row.get::<_, i64>(8)? != 0,
                unlocked_at: row.get(9)?,
                requirements: reqs,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(nodes)
}

fn build_skill_tree(conn: &rusqlite::Connection, id: i64, session_id: i64, task_type: &str, icon: &str, color: &str, created_at: &str) -> Result<SkillTree, String> {
    let nodes = fetch_nodes_for_tree(conn, id)?;
    let available_xp = get_xp_for_type(conn, task_type)?;
    let spent_xp = get_spent_xp_for_tree(conn, id)?;
    Ok(SkillTree {
        id,
        session_id,
        task_type: task_type.to_string(),
        icon: icon.to_string(),
        color: color.to_string(),
        created_at: created_at.to_string(),
        nodes,
        available_xp,
        spent_xp,
    })
}

// --- Skill Tree commands ---

#[tauri::command]
fn get_skill_trees(db: State<Database>, session_id: i64) -> Result<Vec<SkillTree>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, task_type, icon, color, created_at FROM skill_trees WHERE session_id = ?1 ORDER BY task_type ASC")
        .map_err(|e| e.to_string())?;
    let rows: Vec<(i64, String, String, String, String)> = stmt
        .query_map(params![session_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut trees = Vec::new();
    for (id, task_type, icon, color, created_at) in rows {
        trees.push(build_skill_tree(&conn, id, session_id, &task_type, &icon, &color, &created_at)?);
    }
    Ok(trees)
}

#[tauri::command]
fn create_skill_tree(db: State<Database>, session_id: i64, task_type: String, icon: String, color: String) -> Result<SkillTree, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT INTO skill_trees (session_id, task_type, icon, color, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![session_id, task_type, icon, color, now],
    )
    .map_err(|e| format!("Tree already exists or error: {}", e))?;
    let id = conn.last_insert_rowid();
    build_skill_tree(&conn, id, session_id, &task_type, &icon, &color, &now)
}

#[tauri::command]
fn create_skill_node(db: State<Database>, payload: CreateSkillNodePayload) -> Result<SkillNode, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO skill_nodes (tree_id, name, description, icon, xp_cost, tier, parent_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![payload.tree_id, payload.name, payload.description, payload.icon, payload.xp_cost, payload.tier, payload.parent_id],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();

    // Insert requirements
    for req in &payload.requirements {
        conn.execute(
            "INSERT INTO skill_node_requirements (node_id, requirement_type, target_value, reference_id, description) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, req.requirement_type, req.target_value, req.reference_id, req.description],
        ).map_err(|e| e.to_string())?;
    }

    let reqs = fetch_requirements_for_node(&conn, id)?;
    Ok(SkillNode {
        id,
        tree_id: payload.tree_id,
        name: payload.name,
        description: payload.description,
        icon: payload.icon,
        xp_cost: payload.xp_cost,
        tier: payload.tier,
        parent_id: payload.parent_id,
        unlocked: false,
        unlocked_at: None,
        requirements: reqs,
    })
}

fn validate_node_requirements(conn: &rusqlite::Connection, session_id: i64, node_id: i64) -> Result<(), String> {
    let reqs = fetch_requirements_for_node(conn, node_id)?;
    for req in reqs {
        let met = match req.requirement_type.as_str() {
            "attribute_equipped" => {
                if let Some(ref_id) = req.reference_id {
                    let count: i64 = conn.query_row(
                        "SELECT COUNT(*) FROM attributes WHERE id = ?1 AND session_id = ?2 AND unlocked = 1 AND equipped = 1",
                        params![ref_id, session_id], |row| row.get(0)
                    ).unwrap_or(0);
                    count >= req.target_value
                } else {
                    false
                }
            }
            "nodes_unlocked" => {
                let count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM skill_nodes WHERE unlocked = 1 AND tree_id IN (SELECT id FROM skill_trees WHERE session_id = ?1)",
                    params![session_id], |row| row.get(0)
                ).unwrap_or(0);
                count >= req.target_value
            }
            "bosses_defeated" => {
                let count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM bosses WHERE session_id = ?1 AND status = 'defeated'",
                    params![session_id], |row| row.get(0)
                ).unwrap_or(0);
                count >= req.target_value
            }
            "level_reached" => {
                let total_xp: i64 = conn.query_row(
                    "SELECT COALESCE(SUM(xp_amount), 0) FROM xp_logs WHERE session_id = ?1",
                    params![session_id], |row| row.get(0)
                ).unwrap_or(0);
                let level = total_xp / 100 + 1;
                level >= req.target_value
            }
            _ => true,
        };
        if !met {
            return Err(format!("Requirement not met: {}", req.description));
        }
    }
    Ok(())
}

#[tauri::command]
fn check_skill_node_requirements(db: State<Database>, node_id: i64, session_id: i64) -> Result<bool, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    match validate_node_requirements(&conn, session_id, node_id) {
        Ok(_) => Ok(true),
        Err(_e) => Ok(false),
    }
}

#[tauri::command]
fn unlock_skill_node(db: State<Database>, node_id: i64) -> Result<SkillTree, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let node_id_val = node_id;
    let (nid, tree_id, name, description, icon, xp_cost, tier, parent_id, unlocked, unlocked_at): (i64, i64, String, String, String, i64, i64, Option<i64>, i64, Option<String>) = conn
        .query_row(
            "SELECT id, tree_id, name, description, icon, xp_cost, tier, parent_id, unlocked, unlocked_at FROM skill_nodes WHERE id = ?1",
            params![node_id_val],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?, row.get(7)?, row.get(8)?, row.get(9)?)),
        )
        .map_err(|e| format!("Node not found: {}", e))?;

    let reqs = fetch_requirements_for_node(&conn, nid).unwrap_or_default();
    let node = SkillNode {
        id: nid,
        tree_id,
        name,
        description,
        icon,
        xp_cost,
        tier,
        parent_id,
        unlocked: unlocked != 0,
        unlocked_at,
        requirements: reqs,
    };

    if node.unlocked {
        return Err("Node already unlocked".to_string());
    }

    if let Some(pid) = node.parent_id {
        let parent_unlocked: bool = conn
            .query_row("SELECT unlocked FROM skill_nodes WHERE id = ?1", params![pid], |row| {
                Ok(row.get::<_, i64>(0)? != 0)
            })
            .map_err(|e| e.to_string())?;
        if !parent_unlocked {
            return Err("Parent node not unlocked yet".to_string());
        }
    }

    let tree_type: String = conn
        .query_row("SELECT task_type FROM skill_trees WHERE id = ?1", params![node.tree_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let available = get_xp_for_type(&conn, &tree_type)?;
    let spent = get_spent_xp_for_tree(&conn, node.tree_id)?;
    let remaining = available - spent;

    if remaining < node.xp_cost {
        return Err(format!("Not enough XP: need {} but only {} available", node.xp_cost, remaining));
    }

    // Validate advanced requirements
    let tree_session_id: i64 = conn
        .query_row("SELECT session_id FROM skill_trees WHERE id = ?1", params![node.tree_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    validate_node_requirements(&conn, tree_session_id, node_id)?;

    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "UPDATE skill_nodes SET unlocked = 1, unlocked_at = ?1 WHERE id = ?2",
        params![now, node_id],
    )
    .map_err(|e| e.to_string())?;

    let (tree_icon, tree_color, tree_created, tree_session_id): (String, String, String, i64) = conn
        .query_row("SELECT icon, color, created_at, session_id FROM skill_trees WHERE id = ?1", params![node.tree_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)))
        .map_err(|e| e.to_string())?;

    build_skill_tree(&conn, node.tree_id, tree_session_id, &tree_type, &tree_icon, &tree_color, &tree_created)
}

#[tauri::command]
fn delete_skill_tree(db: State<Database>, tree_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM skill_nodes WHERE tree_id = ?1", params![tree_id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM skill_trees WHERE id = ?1", params![tree_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// --- Character & Session commands ---

#[tauri::command]
fn get_characters(db: State<Database>) -> Result<Vec<Character>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, created_at FROM characters ORDER BY id ASC").map_err(|e| e.to_string())?;
    let chars = stmt
        .query_map([], |row| Ok(Character { id: row.get(0)?, name: row.get(1)?, created_at: row.get(2)? }))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(chars)
}

#[tauri::command]
fn create_character(db: State<Database>, name: String) -> Result<Character, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    conn.execute("INSERT INTO characters (name, created_at) VALUES (?1, ?2)", params![name, now]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(Character { id, name, created_at: now })
}

#[tauri::command]
fn get_sessions(db: State<Database>, character_id: i64) -> Result<Vec<Session>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT s.id, s.character_id, c.name as character_name, s.name, s.is_active, s.created_at FROM sessions s JOIN characters c ON c.id = s.character_id WHERE s.character_id = ?1 ORDER BY s.id ASC")
        .map_err(|e| e.to_string())?;
    let sessions = stmt
        .query_map(params![character_id], |row| Ok(Session {
            id: row.get(0)?,
            character_id: row.get(1)?,
            character_name: row.get(2)?,
            name: row.get(3)?,
            is_active: row.get::<_, i64>(4)? != 0,
            created_at: row.get(5)?,
        }))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(sessions)
}

#[tauri::command]
fn create_session(db: State<Database>, character_id: i64, name: String) -> Result<Session, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT INTO sessions (character_id, name, is_active, created_at) VALUES (?1, ?2, 0, ?3)",
        params![character_id, name, now],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let character_name: String = conn
        .query_row("SELECT name FROM characters WHERE id = ?1", params![character_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(Session { id, character_id, character_name, name, is_active: false, created_at: now })
}

#[tauri::command]
fn set_active_session(db: State<Database>, session_id: i64) -> Result<Session, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    // Desactivar todas las sesiones
    conn.execute("UPDATE sessions SET is_active = 0", []).map_err(|e| e.to_string())?;
    // Activar la elegida
    conn.execute("UPDATE sessions SET is_active = 1 WHERE id = ?1", params![session_id]).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT s.id, s.character_id, c.name as character_name, s.name, s.is_active, s.created_at FROM sessions s JOIN characters c ON c.id = s.character_id WHERE s.id = ?1")
        .map_err(|e| e.to_string())?;
    let session = stmt
        .query_row(params![session_id], |row| Ok(Session {
            id: row.get(0)?,
            character_id: row.get(1)?,
            character_name: row.get(2)?,
            name: row.get(3)?,
            is_active: row.get::<_, i64>(4)? != 0,
            created_at: row.get(5)?,
        }))
        .map_err(|e| e.to_string())?;
    Ok(session)
}

#[tauri::command]
fn get_active_session(db: State<Database>) -> Result<Option<Session>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT s.id, s.character_id, c.name as character_name, s.name, s.is_active, s.created_at FROM sessions s JOIN characters c ON c.id = s.character_id WHERE s.is_active = 1 LIMIT 1")
        .map_err(|e| e.to_string())?;
    let session = stmt
        .query_row([], |row| Ok(Session {
            id: row.get(0)?,
            character_id: row.get(1)?,
            character_name: row.get(2)?,
            name: row.get(3)?,
            is_active: row.get::<_, i64>(4)? != 0,
            created_at: row.get(5)?,
        }))
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(session)
}

// --- Boss Commands ---

fn fetch_boss_full(conn: &rusqlite::Connection, boss_id: i64) -> Result<Boss, String> {
    let mut stmt = conn.prepare(
        "SELECT id, session_id, name, description, icon, difficulty, status, xp_reward, created_at, defeated_at FROM bosses WHERE id = ?1"
    ).map_err(|e| e.to_string())?;
    let mut boss = stmt.query_row(params![boss_id], |row| {
        Ok(Boss {
            id: row.get(0)?,
            session_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            icon: row.get(4)?,
            difficulty: row.get(5)?,
            status: row.get(6)?,
            xp_reward: row.get(7)?,
            created_at: row.get(8)?,
            defeated_at: row.get(9)?,
            requirements: Vec::new(),
            rewards: Vec::new(),
        })
    }).map_err(|e| format!("Boss not found: {}", e))?;

    let mut req_stmt = conn.prepare(
        "SELECT id, boss_id, requirement_type, description, target_value, current_value, completed FROM boss_requirements WHERE boss_id = ?1 ORDER BY id ASC"
    ).map_err(|e| e.to_string())?;
    boss.requirements = req_stmt.query_map(params![boss_id], |row| {
        Ok(BossRequirement {
            id: row.get(0)?,
            boss_id: row.get(1)?,
            requirement_type: row.get(2)?,
            description: row.get(3)?,
            target_value: row.get(4)?,
            current_value: row.get(5)?,
            completed: row.get::<_, i64>(6)? != 0,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let mut rew_stmt = conn.prepare(
        "SELECT id, boss_id, reward_type, value, description, claimed FROM boss_rewards WHERE boss_id = ?1 ORDER BY id ASC"
    ).map_err(|e| e.to_string())?;
    boss.rewards = rew_stmt.query_map(params![boss_id], |row| {
        Ok(BossReward {
            id: row.get(0)?,
            boss_id: row.get(1)?,
            reward_type: row.get(2)?,
            value: row.get(3)?,
            description: row.get(4)?,
            claimed: row.get::<_, i64>(5)? != 0,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(boss)
}

#[tauri::command]
fn get_bosses(db: State<Database>, session_id: i64) -> Result<Vec<Boss>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id FROM bosses WHERE session_id = ?1 ORDER BY id ASC"
    ).map_err(|e| e.to_string())?;
    let ids: Vec<i64> = stmt.query_map(params![session_id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
    let mut bosses = Vec::new();
    for id in ids {
        bosses.push(fetch_boss_full(&conn, id)?);
    }
    Ok(bosses)
}

#[tauri::command]
fn create_boss(db: State<Database>, payload: CreateBossPayload) -> Result<Boss, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT INTO bosses (session_id, name, description, icon, difficulty, status, xp_reward, created_at) VALUES (?1, ?2, ?3, ?4, ?5, 'available', ?6, ?7)",
        params![payload.session_id, payload.name, payload.description, payload.icon, payload.difficulty, payload.xp_reward, now],
    ).map_err(|e| e.to_string())?;
    let boss_id = conn.last_insert_rowid();

    for req in &payload.requirements {
        conn.execute(
            "INSERT INTO boss_requirements (boss_id, requirement_type, description, target_value) VALUES (?1, ?2, ?3, ?4)",
            params![boss_id, req.requirement_type, req.description, req.target_value],
        ).map_err(|e| e.to_string())?;
    }

    for rew in &payload.rewards {
        conn.execute(
            "INSERT INTO boss_rewards (boss_id, reward_type, value, description) VALUES (?1, ?2, ?3, ?4)",
            params![boss_id, rew.reward_type, rew.value, rew.description],
        ).map_err(|e| e.to_string())?;
    }

    fetch_boss_full(&conn, boss_id)
}

#[tauri::command]
fn delete_boss(db: State<Database>, boss_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM boss_rewards WHERE boss_id = ?1", params![boss_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM boss_requirements WHERE boss_id = ?1", params![boss_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM bosses WHERE id = ?1", params![boss_id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn update_boss_requirement(db: State<Database>, requirement_id: i64, current_value: i64) -> Result<Boss, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Get the requirement's target and boss_id
    let (boss_id, target_value): (i64, i64) = conn.query_row(
        "SELECT boss_id, target_value FROM boss_requirements WHERE id = ?1",
        params![requirement_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|e| format!("Requirement not found: {}", e))?;

    let clamped = current_value.min(target_value);
    let completed = if clamped >= target_value { 1 } else { 0 };
    conn.execute(
        "UPDATE boss_requirements SET current_value = ?1, completed = ?2 WHERE id = ?3",
        params![clamped, completed, requirement_id],
    ).map_err(|e| e.to_string())?;

    // Check if all requirements for this boss are completed
    let pending: i64 = conn.query_row(
        "SELECT COUNT(*) FROM boss_requirements WHERE boss_id = ?1 AND completed = 0",
        params![boss_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    if pending == 0 {
        // All requirements met — check current status
        let status: String = conn.query_row(
            "SELECT status FROM bosses WHERE id = ?1", params![boss_id], |row| row.get(0),
        ).map_err(|e| e.to_string())?;
        if status != "defeated" {
            conn.execute(
                "UPDATE bosses SET status = 'in_progress' WHERE id = ?1 AND status != 'defeated'",
                params![boss_id],
            ).map_err(|e| e.to_string())?;
        }
    }

    fetch_boss_full(&conn, boss_id)
}

#[tauri::command]
fn defeat_boss(db: State<Database>, boss_id: i64, session_id: i64) -> Result<Boss, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Verify all requirements are completed
    let pending: i64 = conn.query_row(
        "SELECT COUNT(*) FROM boss_requirements WHERE boss_id = ?1 AND completed = 0",
        params![boss_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    if pending > 0 {
        return Err(format!("Boss has {} unmet requirements", pending));
    }

    let now = chrono::Local::now().to_rfc3339();

    // Mark boss as defeated
    conn.execute(
        "UPDATE bosses SET status = 'defeated', defeated_at = ?1 WHERE id = ?2",
        params![now, boss_id],
    ).map_err(|e| e.to_string())?;

    // Claim all rewards
    conn.execute(
        "UPDATE boss_rewards SET claimed = 1 WHERE boss_id = ?1",
        params![boss_id],
    ).map_err(|e| e.to_string())?;

    // Grant XP reward
    let xp_reward: i64 = conn.query_row(
        "SELECT xp_reward FROM bosses WHERE id = ?1", params![boss_id], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let boss_name: String = conn.query_row(
        "SELECT name FROM bosses WHERE id = ?1", params![boss_id], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO xp_logs (session_id, task_id, task_type, action, xp_amount, created_at) VALUES (?1, 0, 'boss', ?2, ?3, ?4)",
        params![session_id, format!("Defeated boss: {}", boss_name), xp_reward, now],
    ).map_err(|e| e.to_string())?;

    fetch_boss_full(&conn, boss_id)
}

#[tauri::command]
fn check_boss_requirements(db: State<Database>, boss_id: i64, session_id: i64) -> Result<Boss, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Auto-evaluate requirements based on actual session data
    let mut req_stmt = conn.prepare(
        "SELECT id, requirement_type, target_value FROM boss_requirements WHERE boss_id = ?1"
    ).map_err(|e| e.to_string())?;
    let reqs: Vec<(i64, String, i64)> = req_stmt.query_map(params![boss_id], |row| {
        Ok((row.get(0)?, row.get(1)?, row.get(2)?))
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    for (req_id, req_type, target) in &reqs {
        let current: i64 = match req_type.as_str() {
            "tasks_completed" => {
                conn.query_row(
                    "SELECT COUNT(*) FROM tasks WHERE session_id = ?1 AND completed = 1",
                    params![session_id], |row| row.get(0),
                ).unwrap_or(0)
            }
            "xp_earned" => {
                conn.query_row(
                    "SELECT COALESCE(SUM(xp_amount), 0) FROM xp_logs WHERE session_id = ?1",
                    params![session_id], |row| row.get(0),
                ).unwrap_or(0)
            }
            "level_reached" => {
                let total_xp: i64 = conn.query_row(
                    "SELECT COALESCE(SUM(xp_amount), 0) FROM xp_logs WHERE session_id = ?1",
                    params![session_id], |row| row.get(0),
                ).unwrap_or(0);
                total_xp / 100 + 1
            }
            "skill_unlocked" => {
                conn.query_row(
                    "SELECT COUNT(*) FROM skill_nodes sn JOIN skill_trees st ON st.id = sn.tree_id WHERE st.session_id = ?1 AND sn.unlocked = 1",
                    params![session_id], |row| row.get(0),
                ).unwrap_or(0)
            }
            _ => 0,
        };
        let clamped = current.min(*target);
        let completed = if clamped >= *target { 1 } else { 0 };
        conn.execute(
            "UPDATE boss_requirements SET current_value = ?1, completed = ?2 WHERE id = ?3",
            params![clamped, completed, req_id],
        ).map_err(|e| e.to_string())?;
    }

    // Update boss status based on requirements
    let pending: i64 = conn.query_row(
        "SELECT COUNT(*) FROM boss_requirements WHERE boss_id = ?1 AND completed = 0",
        params![boss_id], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let status: String = conn.query_row(
        "SELECT status FROM bosses WHERE id = ?1", params![boss_id], |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    if status != "defeated" {
        let new_status = if pending == 0 { "in_progress" } else { "available" };
        conn.execute(
            "UPDATE bosses SET status = ?1 WHERE id = ?2",
            params![new_status, boss_id],
        ).map_err(|e| e.to_string())?;
    }

    fetch_boss_full(&conn, boss_id)
}

// --- Attribute Commands ---

const ATTR_SELECT: &str =
    "SELECT id, session_id, name, description, icon, category, source, source_id, effect_type, effect_value, rarity, unlocked, equipped, unlocked_at FROM attributes";

fn row_to_attribute(row: &rusqlite::Row) -> rusqlite::Result<Attribute> {
    Ok(Attribute {
        id: row.get(0)?,
        session_id: row.get(1)?,
        name: row.get(2)?,
        description: row.get(3)?,
        icon: row.get(4)?,
        category: row.get(5)?,
        source: row.get(6)?,
        source_id: row.get(7)?,
        effect_type: row.get(8)?,
        effect_value: row.get(9)?,
        rarity: row.get(10)?,
        unlocked: row.get::<_, i64>(11)? != 0,
        equipped: row.get::<_, i64>(12)? != 0,
        unlocked_at: row.get(13)?,
    })
}

#[tauri::command]
fn get_attributes(db: State<Database>, session_id: i64) -> Result<Vec<Attribute>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let sql = format!("{} WHERE session_id = ?1 ORDER BY rarity DESC, id ASC", ATTR_SELECT);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let attrs = stmt.query_map(params![session_id], row_to_attribute)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
    Ok(attrs)
}

#[tauri::command]
fn create_attribute(db: State<Database>, payload: CreateAttributePayload) -> Result<Attribute, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO attributes (session_id, name, description, icon, category, source, source_id, effect_type, effect_value, rarity, unlocked, equipped) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, 0)",
        params![payload.session_id, payload.name, payload.description, payload.icon, payload.category, payload.source, payload.source_id, payload.effect_type, payload.effect_value, payload.rarity],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let sql = format!("{} WHERE id = ?1", ATTR_SELECT);
    conn.query_row(&sql, params![id], row_to_attribute).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_attribute(db: State<Database>, attribute_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM attributes WHERE id = ?1", params![attribute_id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn unlock_attribute(db: State<Database>, attribute_id: i64) -> Result<Attribute, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "UPDATE attributes SET unlocked = 1, unlocked_at = ?1 WHERE id = ?2",
        params![now, attribute_id],
    ).map_err(|e| e.to_string())?;
    let sql = format!("{} WHERE id = ?1", ATTR_SELECT);
    conn.query_row(&sql, params![attribute_id], row_to_attribute).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_equip_attribute(db: State<Database>, attribute_id: i64) -> Result<Attribute, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let current: i64 = conn.query_row(
        "SELECT equipped FROM attributes WHERE id = ?1", params![attribute_id], |row| row.get(0),
    ).map_err(|e| format!("Attribute not found: {}", e))?;
    let new_val = if current != 0 { 0 } else { 1 };
    conn.execute(
        "UPDATE attributes SET equipped = ?1 WHERE id = ?2",
        params![new_val, attribute_id],
    ).map_err(|e| e.to_string())?;
    let sql = format!("{} WHERE id = ?1", ATTR_SELECT);
    conn.query_row(&sql, params![attribute_id], row_to_attribute).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_active_effects(db: State<Database>, session_id: i64) -> Result<Vec<Attribute>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let sql = format!("{} WHERE session_id = ?1 AND unlocked = 1 AND equipped = 1 ORDER BY id ASC", ATTR_SELECT);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let attrs = stmt.query_map(params![session_id], row_to_attribute)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
    Ok(attrs)
}

fn get_active_xp_effects(conn: &rusqlite::Connection, session_id: i64) -> Result<(f64, i64), String> {
    let sql = format!("{} WHERE session_id = ?1 AND unlocked = 1 AND equipped = 1", ATTR_SELECT);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let attrs = stmt.query_map(params![session_id], row_to_attribute)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let mut multiplier = 1.0;
    let mut flat_bonus = 0i64;
    for attr in attrs {
        match attr.effect_type.as_str() {
            "xp_multiplier" => multiplier += attr.effect_value,
            "flat_xp" => flat_bonus += attr.effect_value as i64,
            _ => {}
        }
    }
    Ok((multiplier, flat_bonus))
}

// --- Import / Export ---

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportData {
    pub rpgain_version: String,
    pub exported_at: String,
    pub tasks: Vec<Task>,
    pub skill_trees: Vec<ExportSkillTree>,
    pub xp_logs: Vec<XPLog>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportSkillTree {
    pub task_type: String,
    pub icon: String,
    pub color: String,
    pub nodes: Vec<ExportSkillNode>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportSkillNode {
    pub name: String,
    pub description: String,
    pub icon: String,
    pub xp_cost: i64,
    pub tier: i64,
    pub parent_index: Option<usize>,
    pub unlocked: bool,
}

#[tauri::command]
fn export_session_data(db: State<Database>, session_id: i64) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Tasks
    let sql = format!("{} WHERE session_id = ?1 ORDER BY id ASC", TASK_SELECT);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let tasks: Vec<Task> = stmt
        .query_map(params![session_id], row_to_task)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Skill trees
    let mut tree_stmt = conn
        .prepare("SELECT id, task_type, icon, color FROM skill_trees WHERE session_id = ?1 ORDER BY id ASC")
        .map_err(|e| e.to_string())?;
    let tree_rows: Vec<(i64, String, String, String)> = tree_stmt
        .query_map(params![session_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut export_trees = Vec::new();
    for (tree_id, task_type, icon, color) in tree_rows {
        let nodes = fetch_nodes_for_tree(&conn, tree_id)?;
        // Build parent_index mapping: map parent_id to index in the nodes vec
        let node_ids: Vec<i64> = nodes.iter().map(|n| n.id).collect();
        let export_nodes: Vec<ExportSkillNode> = nodes.iter().map(|n| {
            let parent_index = n.parent_id.and_then(|pid| node_ids.iter().position(|&id| id == pid));
            ExportSkillNode {
                name: n.name.clone(),
                description: n.description.clone(),
                icon: n.icon.clone(),
                xp_cost: n.xp_cost,
                tier: n.tier,
                parent_index,
                unlocked: n.unlocked,
            }
        }).collect();
        export_trees.push(ExportSkillTree { task_type, icon, color, nodes: export_nodes });
    }

    // XP logs
    let mut log_stmt = conn
        .prepare("SELECT id, task_id, task_type, action, xp_amount, created_at FROM xp_logs WHERE session_id = ?1 ORDER BY id ASC")
        .map_err(|e| e.to_string())?;
    let xp_logs: Vec<XPLog> = log_stmt
        .query_map(params![session_id], |row| {
            Ok(XPLog {
                id: row.get(0)?,
                task_id: row.get(1)?,
                task_type: row.get(2)?,
                action: row.get(3)?,
                xp_amount: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let export = ExportData {
        rpgain_version: "0.1.0".to_string(),
        exported_at: chrono::Local::now().to_rfc3339(),
        tasks,
        skill_trees: export_trees,
        xp_logs,
    };

    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_session_data(db: State<Database>, session_id: i64, json_data: String) -> Result<String, String> {
    let data: ExportData = serde_json::from_str(&json_data)
        .map_err(|e| format!("Invalid RPGain file: {}", e))?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();

    let mut tasks_imported = 0i64;
    let mut trees_imported = 0i64;
    let mut logs_imported = 0i64;

    // Import tasks
    for t in &data.tasks {
        let types_json = serde_json::to_string(&t.types).map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO tasks (session_id, title, description, types, priority, task_kind, xp_reward, progress, progress_total, completed, iteration_count, created_at, completed_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![session_id, t.title, t.description, types_json, t.priority, t.task_kind, t.xp_reward, t.progress, t.progress_total, t.completed as i64, t.iteration_count, t.created_at, t.completed_at],
        ).map_err(|e| e.to_string())?;
        tasks_imported += 1;
    }

    // Import skill trees + nodes
    for tree in &data.skill_trees {
        // Check if tree with this type already exists for this session
        let existing: Option<i64> = conn
            .query_row(
                "SELECT id FROM skill_trees WHERE session_id = ?1 AND task_type = ?2",
                params![session_id, tree.task_type],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;

        let tree_id = if let Some(id) = existing {
            id
        } else {
            conn.execute(
                "INSERT INTO skill_trees (session_id, task_type, icon, color, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![session_id, tree.task_type, tree.icon, tree.color, now],
            ).map_err(|e| e.to_string())?;
            conn.last_insert_rowid()
        };

        // Insert nodes, tracking new IDs for parent references
        let mut new_node_ids: Vec<i64> = Vec::new();
        for node in &tree.nodes {
            let parent_id: Option<i64> = node.parent_index.map(|idx| new_node_ids[idx]);
            conn.execute(
                "INSERT INTO skill_nodes (tree_id, name, description, icon, xp_cost, tier, parent_id, unlocked, unlocked_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![tree_id, node.name, node.description, node.icon, node.xp_cost, node.tier, parent_id, node.unlocked as i64, if node.unlocked { Some(now.clone()) } else { None }],
            ).map_err(|e| e.to_string())?;
            new_node_ids.push(conn.last_insert_rowid());
        }
        trees_imported += 1;
    }

    // Import XP logs
    for log in &data.xp_logs {
        conn.execute(
            "INSERT INTO xp_logs (session_id, task_id, task_type, action, xp_amount, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![session_id, 0, log.task_type, log.action, log.xp_amount, log.created_at],
        ).map_err(|e| e.to_string())?;
        logs_imported += 1;
    }

    Ok(format!("Imported: {} tasks, {} skill trees, {} XP logs", tasks_imported, trees_imported, logs_imported))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--autostarted"])))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            let database = Database::new(&app_dir).expect("Failed to initialize database");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            health_check,
            get_tasks,
            create_task,
            update_task,
            update_progress,
            complete_task,
            delete_task,
            get_stats,
            get_xp_logs,
            get_xp_by_type,
            get_total_logged_xp,
            get_skill_trees,
            create_skill_tree,
            create_skill_node,
            unlock_skill_node,
            check_skill_node_requirements,
            delete_skill_tree,
            get_characters,
            create_character,
            get_sessions,
            create_session,
            set_active_session,
            get_active_session,
            get_bosses,
            create_boss,
            delete_boss,
            update_boss_requirement,
            defeat_boss,
            check_boss_requirements,
            get_attributes,
            create_attribute,
            delete_attribute,
            unlock_attribute,
            toggle_equip_attribute,
            get_active_effects,
            export_session_data,
            import_session_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
