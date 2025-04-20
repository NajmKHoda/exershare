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
            active_routine_id INTEGER,
            last_log_date TEXT NOT NULL,
            FOREIGN KEY (active_routine_id) REFERENCES routines(id)
        );
    `);

    await db.runAsync(`
        INSERT OR IGNORE INTO user (id, active_routine_id, last_log_date)
            VALUES (1, NULL, ?);
    `, serializeDate(new Date()));
}