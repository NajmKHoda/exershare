import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise } from './Exercise';
import { Routine } from './Routine';
import { Workout } from './Workout';
import { WorkoutLog } from './WorkoutLog';
import { serializeDate } from './dates';

export async function initDatabase(db: SQLiteDatabase) {
    await Exercise.init(db);
    await Workout.init(db);
    await Routine.init(db);
    await WorkoutLog.init(db);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY NOT NULL CHECK(id = 1),
            active_routine_id TEXT,
            last_log_date TEXT NOT NULL,
            last_sync_date TEXT,
            FOREIGN KEY (active_routine_id) REFERENCES routines(id)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        );
    `);

    await db.runAsync(`
        UPDATE user SET last_sync_date = NULL;
        INSERT OR IGNORE INTO user (id, last_log_date)
            VALUES (1, ?);
    `, serializeDate(new Date()));
}