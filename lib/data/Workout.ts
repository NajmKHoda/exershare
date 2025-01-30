import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise } from './Exercise';

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
                position INTEGER NOT NULL CHECK(position >= 0 AND position < 7),
                workout_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                PRIMARY KEY (position, workout_id),
                FOREIGN KEY (workout_id) REFERENCES workouts(id),
                FOREIGN KEY (exercise_id) REFERENCES exercises(id)
            );
        `);
    }

    static async saveMany(workouts: Workout[], db: SQLiteDatabase) {
        // Prepare statements
        const [upsertQuery, linkQuery] = await Promise.all([
            db.prepareAsync(`
                INSERT INTO workouts (id, name) VALUES ($id, $name)
                ON CONFLICT(id) DO UPDATE SET name = $name;
            `),
            db.prepareAsync(`
                INSERT INTO exercise_instances (position, workout_id, exercise_id) VALUES
                    ($position, $workoutId, $exerciseId)
                ON CONFLICT(position, workout_id) DO UPDATE SET exercise_id = $exerciseId;
            `)
        ]);

        // Flatten exercises from all workouts into one array (more efficient)
        const exercises = workouts.flatMap(workout => workout.exercises);

        await Promise.all([
            // Save all workouts
            Promise.all(workouts.map(workout => {
                upsertQuery.executeAsync({
                    $id: workout.id,
                    $name: workout.name,
                })
            })),

            // Save all exercises
            Exercise.saveMany(exercises, db)
        ]);

        // Link workouts and exercises
        await Promise.all(
            workouts.map(workout =>
                Promise.all(workout.exercises.map((exercise, i) =>
                    linkQuery.executeAsync({
                        $position: i,
                        $workoutId: workout.id,
                        $exerciseId: exercise.id
                    })
                ))
            )
        );

        await Promise.all([ upsertQuery.finalizeAsync(), linkQuery.finalizeAsync() ]);
    }

    async save(db: SQLiteDatabase) {
        await Workout.saveMany([ this ], db);
    }
}