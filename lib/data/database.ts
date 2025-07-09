import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise } from './Exercise';
import { Routine } from './Routine';
import { Workout } from './Workout';
import { WorkoutLog } from './WorkoutLog';
import { serializeDate } from './dates';
import { supabase } from '../supabase';

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
            username TEXT,
            FOREIGN KEY (active_routine_id) REFERENCES routines(id)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        );
    `);

    await db.runAsync(`
        INSERT OR IGNORE INTO user (id, last_log_date)
            VALUES (1, ?);
    `, serializeDate(new Date()));

    const { data } = await supabase.from('profiles')
        .select('username')
        .single();
    if (!data) return;

    await db.runAsync(`UPDATE user SET username = ?;`, [data.username]);
}

export async function resetDatabase(db: SQLiteDatabase) {
    await db.execAsync(`
        DELETE FROM exercises;
        DELETE FROM workouts;
        DELETE FROM routines;
        DELETE FROM workout_logs;
        UPDATE user SET last_sync_date = NULL;
    `);

    await initDatabase(db);
}