import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise } from './Exercise';
import { Routine } from './Routine';
import { Workout } from './Workout';

export async function initDatabase(db: SQLiteDatabase) {
    await Exercise.init(db);
    await Workout.init(db);
    await Routine.init(db);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY NOT NULL CHECK(id = 1),
            active_routine_id INTEGER NOT NULL,
            FOREIGN KEY (active_routine_id) REFERENCES routines(id)
        );
    `);
}