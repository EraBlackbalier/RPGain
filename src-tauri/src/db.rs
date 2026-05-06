use rusqlite::{Connection, Result, params};
use std::sync::Mutex;

const CURRENT_DB_VERSION: i64 = 9;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_dir: &std::path::Path) -> Result<Self> {
        std::fs::create_dir_all(app_dir).expect("Failed to create app data directory");
        let db_path = app_dir.join("rpgain.db");
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.run_migrations()?;
        Ok(db)
    }

    fn get_db_version(conn: &Connection) -> Result<i64> {
        let version: i64 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
        Ok(version)
    }

    fn set_db_version(conn: &Connection, version: i64) -> Result<()> {
        conn.pragma_update(None, "user_version", &version)?;
        Ok(())
    }

    fn run_migrations(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let version = Self::get_db_version(&conn)?;

        if version < 1 {
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    types TEXT NOT NULL DEFAULT '[]',
                    priority TEXT NOT NULL DEFAULT 'normal',
                    task_kind TEXT NOT NULL DEFAULT 'finite',
                    xp_reward INTEGER NOT NULL DEFAULT 10,
                    progress INTEGER NOT NULL DEFAULT 0,
                    progress_total INTEGER NOT NULL DEFAULT 1,
                    completed INTEGER NOT NULL DEFAULT 0,
                    iteration_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                );

                CREATE TABLE IF NOT EXISTS skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    level INTEGER NOT NULL DEFAULT 0,
                    xp_current INTEGER NOT NULL DEFAULT 0,
                    xp_required INTEGER NOT NULL DEFAULT 100,
                    unlocked INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS bosses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    xp_reward INTEGER NOT NULL DEFAULT 100,
                    defeated INTEGER NOT NULL DEFAULT 0
                );"
            )?;
        }

        if version < 2 {
            let has_types: bool = conn
                .prepare("PRAGMA table_info(tasks)")?
                .query_map([], |row| row.get::<_, String>(1))?
                .filter_map(|r| r.ok())
                .any(|name| name == "types");

            if !has_types {
                conn.execute_batch(
                    "ALTER TABLE tasks ADD COLUMN types TEXT NOT NULL DEFAULT '[]';
                     ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
                     ALTER TABLE tasks ADD COLUMN task_kind TEXT NOT NULL DEFAULT 'finite';
                     ALTER TABLE tasks ADD COLUMN progress INTEGER NOT NULL DEFAULT 0;
                     ALTER TABLE tasks ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 1;
                     ALTER TABLE tasks ADD COLUMN iteration_count INTEGER NOT NULL DEFAULT 0;"
                )?;
                conn.execute(
                    "UPDATE tasks SET xp_reward = xp WHERE 1=1",
                    [],
                ).ok();
            }
        }

        if version < 3 {
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS xp_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id INTEGER NOT NULL,
                    task_type TEXT NOT NULL,
                    action TEXT NOT NULL,
                    xp_amount INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_xp_logs_task_type ON xp_logs(task_type);
                CREATE INDEX IF NOT EXISTS idx_xp_logs_created_at ON xp_logs(created_at);"
            )?;
        }

        if version < 4 {
            conn.execute_batch(
                "DROP TABLE IF EXISTS skills;

                CREATE TABLE IF NOT EXISTS skill_trees (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_type TEXT NOT NULL UNIQUE,
                    icon TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS skill_nodes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tree_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    icon TEXT NOT NULL DEFAULT '',
                    xp_cost INTEGER NOT NULL DEFAULT 50,
                    tier INTEGER NOT NULL DEFAULT 0,
                    parent_id INTEGER,
                    unlocked INTEGER NOT NULL DEFAULT 0,
                    unlocked_at TEXT,
                    FOREIGN KEY (tree_id) REFERENCES skill_trees(id) ON DELETE CASCADE,
                    FOREIGN KEY (parent_id) REFERENCES skill_nodes(id) ON DELETE SET NULL
                );
                CREATE INDEX IF NOT EXISTS idx_skill_nodes_tree ON skill_nodes(tree_id);"
            )?;
        }

        if version < 5 {
            // Verificar si la columna color ya existe (por si se re-ejecuta)
            let has_color: bool = conn
                .prepare("PRAGMA table_info(skill_trees)")?
                .query_map([], |row| row.get::<_, String>(1))?
                .filter_map(|r| r.ok())
                .any(|name| name == "color");

            if !has_color {
                conn.execute_batch(
                    "ALTER TABLE skill_trees ADD COLUMN color TEXT NOT NULL DEFAULT '#a855f7';"
                )?;
            }

            // Asignar colores distintos a árboles existentes según su ID
            let palette = vec![
                "#a855f7", "#22c55e", "#ef4444", "#3b82f6",
                "#f97316", "#06b6d4", "#ec4899", "#eab308",
            ];
            let mut stmt = conn.prepare("SELECT id FROM skill_trees")?;
            let ids: Vec<i64> = stmt
                .query_map([], |row| row.get::<_, i64>(0))?
                .filter_map(|r| r.ok())
                .collect();
            for (i, id) in ids.iter().enumerate() {
                let color = palette[i % palette.len()];
                conn.execute(
                    "UPDATE skill_trees SET color = ?1 WHERE id = ?2 AND color = '#a855f7'",
                    params![color, id],
                ).ok();
            }
        }

        if version < 6 {
            // Crear tablas de characters y sessions
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS characters (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL DEFAULT 'Hero',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    character_id INTEGER NOT NULL DEFAULT 1,
                    name TEXT NOT NULL DEFAULT 'Main',
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
                );"
            )?;

            // Insertar character y session por defecto si no existen
            let char_count: i64 = conn
                .query_row("SELECT COUNT(*) FROM characters", [], |row| row.get(0))
                .unwrap_or(0);
            if char_count == 0 {
                let now = chrono::Local::now().to_rfc3339();
                conn.execute(
                    "INSERT INTO characters (name, created_at) VALUES ('Hero', ?1)",
                    params![now],
                ).ok();
                conn.execute(
                    "INSERT INTO sessions (character_id, name, is_active, created_at) VALUES (1, 'Main', 1, ?1)",
                    params![now],
                ).ok();
            }

            // Agregar session_id a tasks (si no existe)
            let has_task_session: bool = conn
                .prepare("PRAGMA table_info(tasks)")?
                .query_map([], |row| row.get::<_, String>(1))?
                .filter_map(|r| r.ok())
                .any(|name| name == "session_id");
            if !has_task_session {
                conn.execute_batch("ALTER TABLE tasks ADD COLUMN session_id INTEGER NOT NULL DEFAULT 1;")?;
            }

            // Agregar session_id a xp_logs
            let has_xp_session: bool = conn
                .prepare("PRAGMA table_info(xp_logs)")?
                .query_map([], |row| row.get::<_, String>(1))?
                .filter_map(|r| r.ok())
                .any(|name| name == "session_id");
            if !has_xp_session {
                conn.execute_batch("ALTER TABLE xp_logs ADD COLUMN session_id INTEGER NOT NULL DEFAULT 1;")?;
            }

            // Agregar session_id a skill_trees
            let has_tree_session: bool = conn
                .prepare("PRAGMA table_info(skill_trees)")?
                .query_map([], |row| row.get::<_, String>(1))?
                .filter_map(|r| r.ok())
                .any(|name| name == "session_id");
            if !has_tree_session {
                conn.execute_batch("ALTER TABLE skill_trees ADD COLUMN session_id INTEGER NOT NULL DEFAULT 1;")?;
            }
        }

        if version < 7 {
            // Drop the old simple bosses table from v1 and recreate with full schema
            conn.execute_batch(
                "DROP TABLE IF EXISTS bosses;

                CREATE TABLE IF NOT EXISTS bosses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL DEFAULT 1,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    icon TEXT NOT NULL DEFAULT 'skull',
                    difficulty INTEGER NOT NULL DEFAULT 1,
                    status TEXT NOT NULL DEFAULT 'available',
                    xp_reward INTEGER NOT NULL DEFAULT 100,
                    created_at TEXT NOT NULL,
                    defeated_at TEXT,
                    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS boss_requirements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    boss_id INTEGER NOT NULL,
                    requirement_type TEXT NOT NULL DEFAULT 'tasks_completed',
                    description TEXT NOT NULL DEFAULT '',
                    target_value INTEGER NOT NULL DEFAULT 1,
                    current_value INTEGER NOT NULL DEFAULT 0,
                    completed INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (boss_id) REFERENCES bosses(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS boss_rewards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    boss_id INTEGER NOT NULL,
                    reward_type TEXT NOT NULL DEFAULT 'xp',
                    value TEXT NOT NULL DEFAULT '',
                    description TEXT NOT NULL DEFAULT '',
                    claimed INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (boss_id) REFERENCES bosses(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_bosses_session ON bosses(session_id);
                CREATE INDEX IF NOT EXISTS idx_boss_req_boss ON boss_requirements(boss_id);
                CREATE INDEX IF NOT EXISTS idx_boss_rew_boss ON boss_rewards(boss_id);"
            )?;
        }

        if version < 8 {
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS attributes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL DEFAULT 1,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    icon TEXT NOT NULL DEFAULT 'gem',
                    category TEXT NOT NULL DEFAULT 'buff',
                    source TEXT NOT NULL DEFAULT 'manual',
                    source_id INTEGER,
                    effect_type TEXT NOT NULL DEFAULT 'cosmetic',
                    effect_value REAL NOT NULL DEFAULT 0,
                    rarity INTEGER NOT NULL DEFAULT 1,
                    unlocked INTEGER NOT NULL DEFAULT 0,
                    equipped INTEGER NOT NULL DEFAULT 0,
                    unlocked_at TEXT,
                    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_attributes_session ON attributes(session_id);"
            )?;
        }

        if version < 9 {
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS skill_node_requirements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    node_id INTEGER NOT NULL,
                    requirement_type TEXT NOT NULL DEFAULT 'nodes_unlocked',
                    target_value INTEGER NOT NULL DEFAULT 1,
                    reference_id INTEGER,
                    description TEXT NOT NULL DEFAULT '',
                    FOREIGN KEY (node_id) REFERENCES skill_nodes(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_node_req_node ON skill_node_requirements(node_id);"
            )?;
        }

        Self::set_db_version(&conn, CURRENT_DB_VERSION)?;
        Ok(())
    }
}
