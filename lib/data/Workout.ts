import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise, RawExercise } from './Exercise';
import { randomUUID } from '../uuid';
import { supabase } from '../supabase';

export class Workout {
    id: string;
    name: string;
    exercises: Exercise[];
    private shallow: boolean;
    private exerciseIds: string[];

    constructor(id: string, name: string, exercises: Exercise[]);
    constructor(id: string, name: string, exerciseIds: string[]);
    constructor(id: string, name: string, third: Exercise[] | string[]) {
        this.id = id;
        this.name = name;
        if (third.length > 0 && typeof third[0] === 'string') {
            this.shallow = true;
            this.exerciseIds = third as string[];
            this.exercises = [];
        } else {
            this.shallow = false;
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

    static async create(name: string, exerciseIds: string[], db: SQLiteDatabase) {
        const id = randomUUID();

        await db.withExclusiveTransactionAsync(async (transaction) => {
            await transaction.runAsync(`INSERT INTO workouts (id, name) VALUES (?, ?);`, id, name);

            const linkQuery = await transaction.prepareAsync(`
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
        });

        const { error } = await supabase.rpc('save_workout', {
            _id: id,
            _name: name,
            _exercise_ids: exerciseIds.map((id, i) => ({ exercise_id: id, position: i }))
        });

        if (error) {
            console.log(error);
            return;
        }
        await db.runAsync(`UPDATE workouts SET dirty = 0 WHERE id = ?;`, id);
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
        const exerciseIds = this.shallow ? this.exerciseIds : this.exercises.map(exercise => exercise.id);
        await db.withExclusiveTransactionAsync(async (transaction) => {
            await transaction.runAsync(`
                INSERT INTO workouts (id, name)
                VALUES ($id, $name)
                ON CONFLICT (id) DO UPDATE SET name = $name, dirty = 1;
            `, {
                $id: this.id,
                $name: this.name
            });

            const linkQuery = await transaction.prepareAsync(`
                INSERT INTO exercise_instances (position, workout_id, exercise_id)
                VALUES ($position, $workoutId, $exerciseId)
                ON CONFLICT (position, workout_id) DO UPDATE SET
                    exercise_id = $exerciseId;
            `);

            try {
                await Promise.all(exerciseIds.map((exerciseId, i) =>
                    linkQuery.executeAsync({
                        $position: i,
                        $workoutId: this.id,
                        $exerciseId: exerciseId
                    })
                ));
            } finally {
                await linkQuery.finalizeAsync();
            }
        });

        const { error } = await supabase.rpc('save_workout', {
            _id: this.id,
            _name: this.name,
            _exercise_ids: exerciseIds.map((id, i) => ({ exercise_id: id, position: i }))
        });

        if (error) return;
        await db.runAsync(`UPDATE workouts SET dirty = 0 WHERE id = ?;`, this.id);
    }

    async delete(db: SQLiteDatabase) {
        // Delete the workout record
        await db.runAsync('DELETE FROM workouts WHERE id = ?', this.id);
        await supabase.from('workouts').delete().eq('id', this.id);
    }
}