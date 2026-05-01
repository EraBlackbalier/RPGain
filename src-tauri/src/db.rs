use rusqlite::{Connection, Result};
use std::sync::Mutex;

const CURRENT_DB_VERSION: i64 = 4;

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

        Self::set_db_version(&conn, CURRENT_DB_VERSION)?;
        Ok(())
    }
}
