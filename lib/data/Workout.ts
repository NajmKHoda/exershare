import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise } from './Exercise';
import { randomUUID } from '../uuid';
import { supabase } from '../supabase';

export class Workout {
    id: string;
    name: string;
    lastModified: Date | null;
    readonly exercises: readonly Exercise[];
    private readonly exerciseIds: readonly string[];

    constructor(id: string, name: string, exercises: Exercise[], lastModified?: Date);
    constructor(id: string, name: string, exerciseIds: string[], lastModified?: Date);
    constructor(id: string, name: string, third: Exercise[] | string[], lastModified: Date | null = null) {
        this.id = id;
        this.name = name;
        this.lastModified = lastModified;
        if (third.length == 0 || typeof third[0] === 'string') {
            this.exerciseIds = third as string[];
            this.exercises = [];
        } else {
            this.exercises = third as Exercise[];
            this.exerciseIds = this.exercises.map(exercise => exercise.id);
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS workouts (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 1,
                last_modified TEXT NOT NULL DEFAULT current_timestamp
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
        const workout = new Workout(randomUUID(), name, exerciseIds);
        await workout.save(db);
        return workout;
    }
    
    static async pullMany(db: SQLiteDatabase, where: string = '1=1', deep: boolean = true): Promise<Workout[]> {
        const rawWorkouts = await db.getAllAsync<RawWorkout>(`
            SELECT * FROM workouts WHERE ${where};
        `);

        if (rawWorkouts.length === 0) return [];
        
        const rawExercises = await db.getAllAsync<any>(`
            SELECT
                ${deep ? 'exercises.*' : 'exercises.id'},
                exercise_instances.workout_id AS workout_id
            FROM exercise_instances
            JOIN exercises ON exercise_instances.exercise_id = exercises.id
            WHERE workout_id IN (SELECT id FROM workouts WHERE ${where})
            ORDER BY exercise_instances.position;
        `);

        const workoutToExercises: Record<string, any[]> = {};
        rawWorkouts.forEach(row => {
            workoutToExercises[row.id] = [];
        });

        rawExercises.forEach(raw => {
            const exercises = workoutToExercises[raw.workout_id];

            if (deep) {
                const exercise = new Exercise(raw);
                exercises.push(exercise);
            } else {
                exercises.push(raw.id);
            }
        });

        return rawWorkouts.map(raw => new Workout(
            raw.id,
            raw.name,
            workoutToExercises[raw.id],
            new Date(raw.last_modified)
        ));
    }

    static async pullOne(id: string, db: SQLiteDatabase) {
        const workouts = await Workout.pullMany(db, `id = '${id}'`, true);
        if (workouts.length === 0) return null;
        return workouts[0];
    }

    async save(db: SQLiteDatabase) {
        let new_modified: Date | null = null;
        await db.withExclusiveTransactionAsync(async (transaction) => {
            const insertResult = await transaction.getFirstAsync<{ last_modified: string }>(`
                INSERT INTO workouts (id, name)
                    VALUES ($id, $name)
                ON CONFLICT (id) DO UPDATE SET
                    name = $name,
                    dirty = 1,
                    last_modified = datetime('now')
                RETURNING last_modified;
            `, {
                $id: this.id,
                $name: this.name
            });

            if (!insertResult) return;
            new_modified = new Date(insertResult.last_modified);

            const linkQuery = await transaction.prepareAsync(`
                INSERT INTO exercise_instances (position, workout_id, exercise_id)
                VALUES ($position, $workoutId, $exerciseId)
                ON CONFLICT (position, workout_id) DO UPDATE SET
                    exercise_id = $exerciseId;
            `);

            try {
                await Promise.all(this.exerciseIds.map((exerciseId, i) =>
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

        this.lastModified = new_modified;

        const { error } = await supabase.rpc('save_workout', {
            _id: this.id,
            _name: this.name,
            _last_modified: this.lastModified,
            _exercise_ids: this.exerciseIds.map((id, i) => ({ exercise_id: id, position: i }))
        });

        if (error) return;
        await db.runAsync(`UPDATE workouts SET dirty = 0 WHERE id = ?;`, this.id);
    }

    async delete(db: SQLiteDatabase) {
        // Delete the workout record
        await db.runAsync('DELETE FROM workouts WHERE id = ?', this.id);
        await supabase.from('workouts').delete().eq('id', this.id);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            exercises: this.exerciseIds,
            last_modified: (this.lastModified ?? new Date()).toISOString()
        };
    }
}

export interface RawWorkout {
    id: string;
    name: string;
    last_modified: string;
}