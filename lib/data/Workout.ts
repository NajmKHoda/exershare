import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { Exercise, RawExercise } from './Exercise';

export class Workout {
    id: number;
    name: string;
    exercises: Exercise[]

    constructor(id: number, name: string, exercises: Exercise[]) {
        this.id = id;
        this.name = name;
        this.exercises = exercises;
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY NOT NULL,
                name TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS exercise_instances (
                index INTEGER,
                workout_id INTEGER,
                exercise_id INTEGER,
                PRIMARY KEY (index, workout_id),
                FOREIGN KEY (workout_id) REFERENCES workouts(id),
                FOREIGN KEY (exercise_id) REFERENCES exercises(id)
            );
        `);

        const initWorkout = new Workout(1, 'Push Day A', [
            new Exercise(1, 'Bench Press', [], '', ['Chest', 'Triceps']),
            new Exercise(2, 'Lateral Pulldown', [], '', ['Back']),
            new Exercise(3, 'Arnold Press', [], '', ['Shoulders']),
            new Exercise(4, 'Cable Row', [], '', ['Back']),
            new Exercise(5, 'Pressdowns/Overheads', [], '', ['Triceps']),
            new Exercise(6, 'EZ-Bar Bicep Curls', [], '', ['Biceps']),
            new Exercise(7, 'Chest/Delt Flys', [], '', ['Chest', 'Shoulders']),
        ]);

        await initWorkout.save()
    }

    /*
    static async fromDatabase(id: number, db?: SQLiteDatabase) {
        if (!Number.isInteger(id)) return null;
        db ??= useSQLiteContext();

        const [workout, rawExercises] = await Promise.all([
            db.getFirstAsync<RawWorkout>('SELECT * FROM workouts WHERE id = ?', id),
            db.getAllAsync<RawExercise>(`
                SELECT exercises.id, exercises.name, exercises.sets, exercises.notes, exercises.categories
                    FROM exercise_instances
                    JOIN exercises ON exercise_instances.exercise_id = exercises.id
                    WHERE exercise_instances.workout_id = ?`,
                id
            )
        ]);

        if (!workout) return null;
        return new Workout(id, workout.name, rawExercises.map(raw => new Exercise(raw)));
    }
    */

    async save(db?: SQLiteDatabase) {
        db ??= useSQLiteContext();
        
        await Promise.all([
            // Save the workout in DB
            db.runAsync(`
                INSERT INTO workouts (id, name) VALUES ($id, $name)
                ON CONFLICT(id) DO UPDATE SET name = $name;
            `, {
                $id: this.id,
                $name: this.name
            }),

            // Save all exercises in DB
            Exercise.saveMany(this.exercises, db)
        ]);

        // Link workout with exercises in DB
        await Promise.all(this.exercises.map((exercise, i)  => 
            db.runAsync(`
                INSERT INTO exercise_instances (index, workout_id, exercise_id) VALUES
                    ($index, $workoutId, $exerciseId)
                ON CONFLICT(index, workout_id) DO UPDATE SET exercise_id = $exerciseId;
            `, {
                index: i,
                workoutId: this.id,
                exerciseId: exercise.id
            })
        ));
    }
}

interface RawWorkout {
    id: number,
    name: string
}