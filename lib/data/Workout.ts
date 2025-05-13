import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise, RawExercise } from './Exercise';
import { randomUUID } from 'expo-crypto';
import { supabase } from '../supabase';

export class Workout {
    id: string;
    name: string;
    exercises: Exercise[];
    exerciseIds: string[];

    constructor(id: string, name: string, exercises: Exercise[]);
    constructor(id: string, name: string, exerciseIds: string[]);
    constructor(id: string, name: string, third: Exercise[] | string[]) {
        this.id = id;
        this.name = name;
        if (third.length > 0 && typeof third[0] === 'string') {
            this.exerciseIds = third as string[];
            this.exercises = [];
        } else {
            this.exercises = third as Exercise[];
            this.exerciseIds = [];
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS workouts (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS exercise_instances (
                position INTEGER NOT NULL,
                workout_id TEXT NOT NULL,
                exercise_id TEXT NOT NULL,
                PRIMARY KEY (position, workout_id),
                FOREIGN KEY (workout_id) REFERENCES workouts(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercises(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
        `);
    }

    static async saveMany(workouts: Workout[], db: SQLiteDatabase) {
        // Prepare statements
        const [upsertQuery, linkQuery, deleteLinksQuery] = await Promise.all([
            db.prepareAsync(`
                INSERT INTO workouts (id, name) VALUES ($id, $name)
                ON CONFLICT(id) DO UPDATE SET name = $name;
            `),
            db.prepareAsync(`
                INSERT INTO exercise_instances (position, workout_id, exercise_id) VALUES
                    ($position, $workoutId, $exerciseId)
                ON CONFLICT(position, workout_id) DO UPDATE SET exercise_id = $exerciseId;
            `),
            db.prepareAsync(`
                DELETE FROM exercise_instances WHERE workout_id = $id AND position >= $size;
            `)
        ]);

        // Save all workouts and any exercises that were provided as objects
        const exercises = workouts.flatMap(workout => workout.exercises);
        await Promise.all(
            workouts.map(workout =>
                upsertQuery.executeAsync({
                    $id: workout.id,
                    $name: workout.name,
                })
            )
            .concat(
                Exercise.saveMany(exercises, db) as Promise<any>
            )
        );

        // Link workouts with exercises
        await Promise.all(
            workouts.map(workout => {
                const ids = workout.exercises.length > 0 ?
                    workout.exercises.map(e => e.id) : workout.exerciseIds;
                return Promise.all(ids.map((exerciseId, i) =>
                    linkQuery.executeAsync({
                        $position: i,
                        $workoutId: workout.id,
                        $exerciseId: exerciseId
                    })
                ));
            })
            .concat(workouts.map(workout =>
                deleteLinksQuery.executeAsync({
                    $id: workout.id,
                    $size: workout.exercises.length > 0 ?
                        workout.exercises.length : workout.exerciseIds.length
                })
            ) as Promise<any>[])
        );

        await Promise.all([
            upsertQuery.finalizeAsync(),
            linkQuery.finalizeAsync(),
            deleteLinksQuery.finalizeAsync()
        ]);
    }

    static async create(name: string, exerciseIds: string[], db: SQLiteDatabase) {
        const id = randomUUID(); // Updated to use randomUUID
        await db.runAsync(`INSERT INTO workouts (id, name) VALUES (?, ?);`, id, name);

        const linkQuery = await db.prepareAsync(`
            INSERT INTO exercise_instances (position, workout_id, exercise_id)
            VALUES ($position, $workoutId, $exerciseId);
        `);
        
        try {
            await Promise.all(exerciseIds.map((exerciseId, i) =>
                linkQuery.executeAsync({
                    $position: i,
                    $workoutId: id,
                    $exerciseId: exerciseId
                })
            ));
        } finally {
            await linkQuery.finalizeAsync();
        }
    }
    
    static async pullOne(id: string, db: SQLiteDatabase) {
        const result = await db.getFirstAsync<{ name: string }>(`
            SELECT * FROM workouts WHERE id = ?;
        `, id);

        if (!result) return null;

        const rawExercises = await db.getAllAsync<RawExercise>(`
            SELECT
                exercises.id,
                exercises.name,
                exercises.notes,
                exercises.sets,
                exercises.categories
            FROM exercise_instances
            JOIN exercises ON exercise_instances.exercise_id = exercises.id
            WHERE workout_id = ?;
        `, id);
        const exercises = rawExercises.map(raw => new Exercise(raw));
        
        return new Workout(id, result.name, exercises);
    }

    async save(db: SQLiteDatabase) {
        await Workout.saveMany([ this ], db);
    }

    async delete(db: SQLiteDatabase) {
        // Delete the workout record
        await db.runAsync('DELETE FROM workouts WHERE id = ?', this.id);
        await supabase.from('workouts').delete().eq('id', this.id);
    }
}