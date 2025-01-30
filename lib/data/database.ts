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
    
    const upperWorkout = new Workout(1, 'Upper Body A', [
        simpleExercise(1, 'Bench Press'),
        simpleExercise(2, 'Lateral Pulldown'),
        simpleExercise(3, 'Arnold Press'),
        simpleExercise(4, 'Cable Row'),
        simpleExercise(5, 'Pressdowns/Overheads'),
        simpleExercise(6, 'EZ-Bar Curls'),
        simpleExercise(7, 'Chest/Delt Flys')
    ]);

    const lowerWorkout = new Workout(2, 'Lower Body A', [
        simpleExercise(8, 'Barbell Squats'),
        simpleExercise(9, 'Deadlifts'),
        simpleExercise(10, 'Leg Extensions'),
        simpleExercise(11, 'Leg Curls'),
        simpleExercise(12, 'Calf Raises'),
        simpleExercise(13, 'Weighted Sit-Ups')
    ]);

    const exampleRoutine = new Routine(1, 'Upper/Lower', [
        null,
        upperWorkout,
        lowerWorkout,
        null,
        upperWorkout,
        lowerWorkout,
        null
    ]);

    await exampleRoutine.save(db);
    await db.execAsync(`INSERT OR IGNORE INTO user (id, active_routine_id) VALUES (1, 1);`);
}

// debug
function simpleExercise(id: number, name: string) {
    return new Exercise(id, name, [
        { reps: 12, weight: 25 },
        { reps: 12, weight: 25 },
        { reps: 12, weight: 25 }
    ], '', []);
}