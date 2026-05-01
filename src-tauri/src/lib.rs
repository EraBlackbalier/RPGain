mod db;

use db::Database;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State};
use rusqlite::params;

// --- Models ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: i64,
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
    pub task_type: String,
    pub icon: String,
    pub created_at: String,
    pub nodes: Vec<SkillNode>,
    pub available_xp: i64,
    pub spent_xp: i64,
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
}

// --- Helpers ---

fn row_to_task(row: &rusqlite::Row) -> rusqlite::Result<Task> {
    let types_json: String = row.get(3)?;
    let types: Vec<String> = serde_json::from_str(&types_json).unwrap_or_default();
    Ok(Task {
        id: row.get(0)?,
        title: row.get(1)?,
        description: row.get(2)?,
        types,
        priority: row.get(4)?,
        task_kind: row.get(5)?,
        xp_reward: row.get(6)?,
        progress: row.get(7)?,
        progress_total: row.get(8)?,
        completed: row.get::<_, i64>(9)? != 0,
        iteration_count: row.get(10)?,
        created_at: row.get(11)?,
        completed_at: row.get(12)?,
    })
}

const TASK_SELECT: &str =
    "SELECT id, title, description, types, priority, task_kind, xp_reward, progress, progress_total, completed, iteration_count, created_at, completed_at FROM tasks";

fn fetch_task_by_id(conn: &rusqlite::Connection, task_id: i64) -> Result<Task, String> {
    let sql = format!("{} WHERE id = ?1", TASK_SELECT);
    conn.query_row(&sql, params![task_id], row_to_task)
        .map_err(|e| format!("Task not found: {}", e))
}

fn log_xp(conn: &rusqlite::Connection, task_id: i64, task_types: &[String], action: &str, xp_amount: i64) -> Result<(), String> {
    let now = chrono::Local::now().to_rfc3339();
    let types = if task_types.is_empty() {
        vec!["general".to_string()]
    } else {
        task_types.to_vec()
    };
    for t in &types {
        conn.execute(
            "INSERT INTO xp_logs (task_id, task_type, action, xp_amount, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![task_id, t, action, xp_amount, now],
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
fn get_tasks(db: State<Database>) -> Result<Vec<Task>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let sql = format!("{} ORDER BY completed ASC, created_at DESC", TASK_SELECT);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([], row_to_task)
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
        "INSERT INTO tasks (title, description, types, priority, task_kind, xp_reward, progress_total, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
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

    if new_progress >= task.progress_total && task.task_kind == "finite" {
        let now = chrono::Local::now().to_rfc3339();
        conn.execute(
            "UPDATE tasks SET progress = ?1, completed = 1, completed_at = ?2 WHERE id = ?3",
            params![new_progress, now, task_id],
        )
        .map_err(|e| e.to_string())?;
        if steps_done > 0 {
            let xp = (task.xp_reward as f64 * steps_done as f64 / task.progress_total as f64).round() as i64;
            log_xp(&conn, task_id, &task.types, "progress_complete", xp.max(1))?;
        }
    } else if steps_done > 0 {
        conn.execute(
            "UPDATE tasks SET progress = ?1 WHERE id = ?2",
            params![new_progress, task_id],
        )
        .map_err(|e| e.to_string())?;
        let xp = (task.xp_reward as f64 * steps_done as f64 / task.progress_total as f64).round() as i64;
        log_xp(&conn, task_id, &task.types, "progress", xp.max(1))?;
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

    if task.task_kind == "endless" {
        conn.execute(
            "UPDATE tasks SET iteration_count = iteration_count + 1, progress = 0 WHERE id = ?1",
            params![task_id],
        )
        .map_err(|e| e.to_string())?;
        log_xp(&conn, task_id, &task.types, "iteration", task.xp_reward)?;
    } else {
        conn.execute(
            "UPDATE tasks SET completed = 1, progress = progress_total, completed_at = ?1 WHERE id = ?2",
            params![now, task_id],
        )
        .map_err(|e| e.to_string())?;
        log_xp(&conn, task_id, &task.types, "complete", task.xp_reward)?;
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
fn get_stats(db: State<Database>) -> Result<Stats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let tasks_total: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let tasks_completed: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks WHERE completed = 1", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let total_xp: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(xp_reward), 0) FROM tasks WHERE completed = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let endless_iterations: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(iteration_count), 0) FROM tasks WHERE task_kind = 'endless'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let endless_xp: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(xp_reward * iteration_count), 0) FROM tasks WHERE task_kind = 'endless'",
            [],
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
fn get_xp_logs(db: State<Database>, limit: Option<i64>) -> Result<Vec<XPLog>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(100);
    let mut stmt = conn
        .prepare("SELECT id, task_id, task_type, action, xp_amount, created_at FROM xp_logs ORDER BY created_at DESC LIMIT ?1")
        .map_err(|e| e.to_string())?;

    let logs = stmt
        .query_map(params![lim], |row| {
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
fn get_xp_by_type(db: State<Database>) -> Result<Vec<XPByType>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT task_type, COALESCE(SUM(xp_amount), 0), COUNT(*) FROM xp_logs GROUP BY task_type ORDER BY SUM(xp_amount) DESC")
        .map_err(|e| e.to_string())?;

    let results = stmt
        .query_map([], |row| {
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
fn get_total_logged_xp(db: State<Database>) -> Result<i64, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let total: i64 = conn
        .query_row("SELECT COALESCE(SUM(xp_amount), 0) FROM xp_logs", [], |row| row.get(0))
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

fn fetch_nodes_for_tree(conn: &rusqlite::Connection, tree_id: i64) -> Result<Vec<SkillNode>, String> {
    let mut stmt = conn
        .prepare("SELECT id, tree_id, name, description, icon, xp_cost, tier, parent_id, unlocked, unlocked_at FROM skill_nodes WHERE tree_id = ?1 ORDER BY tier ASC, id ASC")
        .map_err(|e| e.to_string())?;
    let nodes = stmt
        .query_map(params![tree_id], |row| {
            Ok(SkillNode {
                id: row.get(0)?,
                tree_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                icon: row.get(4)?,
                xp_cost: row.get(5)?,
                tier: row.get(6)?,
                parent_id: row.get(7)?,
                unlocked: row.get::<_, i64>(8)? != 0,
                unlocked_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(nodes)
}

fn build_skill_tree(conn: &rusqlite::Connection, id: i64, task_type: &str, icon: &str, created_at: &str) -> Result<SkillTree, String> {
    let nodes = fetch_nodes_for_tree(conn, id)?;
    let available_xp = get_xp_for_type(conn, task_type)?;
    let spent_xp = get_spent_xp_for_tree(conn, id)?;
    Ok(SkillTree {
        id,
        task_type: task_type.to_string(),
        icon: icon.to_string(),
        created_at: created_at.to_string(),
        nodes,
        available_xp,
        spent_xp,
    })
}

// --- Skill Tree commands ---

#[tauri::command]
fn get_skill_trees(db: State<Database>) -> Result<Vec<SkillTree>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, task_type, icon, created_at FROM skill_trees ORDER BY task_type ASC")
        .map_err(|e| e.to_string())?;
    let rows: Vec<(i64, String, String, String)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut trees = Vec::new();
    for (id, task_type, icon, created_at) in rows {
        trees.push(build_skill_tree(&conn, id, &task_type, &icon, &created_at)?);
    }
    Ok(trees)
}

#[tauri::command]
fn create_skill_tree(db: State<Database>, task_type: String, icon: String) -> Result<SkillTree, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT INTO skill_trees (task_type, icon, created_at) VALUES (?1, ?2, ?3)",
        params![task_type, icon, now],
    )
    .map_err(|e| format!("Tree already exists or error: {}", e))?;
    let id = conn.last_insert_rowid();
    build_skill_tree(&conn, id, &task_type, &icon, &now)
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
    })
}

#[tauri::command]
fn unlock_skill_node(db: State<Database>, node_id: i64) -> Result<SkillTree, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let node: SkillNode = conn
        .query_row(
            "SELECT id, tree_id, name, description, icon, xp_cost, tier, parent_id, unlocked, unlocked_at FROM skill_nodes WHERE id = ?1",
            params![node_id],
            |row| Ok(SkillNode {
                id: row.get(0)?,
                tree_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                icon: row.get(4)?,
                xp_cost: row.get(5)?,
                tier: row.get(6)?,
                parent_id: row.get(7)?,
                unlocked: row.get::<_, i64>(8)? != 0,
                unlocked_at: row.get(9)?,
            }),
        )
        .map_err(|e| format!("Node not found: {}", e))?;

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

    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "UPDATE skill_nodes SET unlocked = 1, unlocked_at = ?1 WHERE id = ?2",
        params![now, node_id],
    )
    .map_err(|e| e.to_string())?;

    let tree_icon: String = conn
        .query_row("SELECT icon FROM skill_trees WHERE id = ?1", params![node.tree_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let tree_created: String = conn
        .query_row("SELECT created_at FROM skill_trees WHERE id = ?1", params![node.tree_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    build_skill_tree(&conn, node.tree_id, &tree_type, &tree_icon, &tree_created)
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            delete_skill_tree,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
