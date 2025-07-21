import { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';
import { Exercise } from './Exercise';
import { randomUUID } from 'expo-crypto';
import { supabase } from '../supabase';

export class Workout {
    id: string;
    name: string;
    lastModified: Date | null;
    readonly exercises: readonly Exercise[];
    readonly exerciseIds: readonly string[];

    constructor(id: string, name: string, exercises: Exercise[], lastModified?: Date | null);
    constructor(id: string, name: string, exerciseIds: string[], lastModified?: Date | null);
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

            CREATE TABLE IF NOT EXISTS deleted_workouts (
                id TEXT PRIMARY KEY NOT NULL,
                deleted_at TEXT NOT NULL DEFAULT current_timestamp
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
            new Date(raw.last_modified!)
        ));
    }

    static async pullOne(id: string, db: SQLiteDatabase) {
        const workouts = await Workout.pullMany(db, `id = '${id}'`, true);
        if (workouts.length === 0) return null;
        return workouts[0];
    }

    static async saveMany(
        db: SQLiteDatabase,
        workouts: Workout[],
        overwriteTimestamp: boolean = false,
        localOnly: boolean = false
    ) {
        const newTimestamp = new Date();

        let saveStatement: SQLiteStatement | null = null;
        let clearStatement: SQLiteStatement | null = null;
        let linkStatement: SQLiteStatement | null = null;
        try {
            saveStatement = await db.prepareAsync(`
                INSERT INTO workouts (id, name, last_modified)
                VALUES ($id, $name, coalesce($timestamp, datetime('now')))
                ON CONFLICT (id) DO UPDATE SET
                    name = $name,
                    dirty = 1,
                    last_modified = excluded.last_modified;
            `);
            clearStatement = await db.prepareAsync(`
                DELETE FROM exercise_instances WHERE workout_id = $id;
            `);
            linkStatement = await db.prepareAsync(`
                INSERT INTO exercise_instances (position, workout_id, exercise_id)
                VALUES ($position, $workoutId, $exerciseId)
                ON CONFLICT (position, workout_id) DO UPDATE SET
                    exercise_id = $exerciseId;
            `);
            
            await db.withTransactionAsync(async () => {
                await Promise.all(
                    workouts.map(async (workout) => {
                        const timestamp = overwriteTimestamp ? newTimestamp : workout.lastModified ?? newTimestamp;
                        
                        // Save the workout
                        await saveStatement!.executeAsync({
                            $id: workout.id,
                            $name: workout.name,
                            $timestamp: timestamp.toISOString()
                        });
                        
                        // Clear existing exercise instances
                        await clearStatement!.executeAsync({ $id: workout.id });

                        // Link exercises to the workout
                        await Promise.all(workout.exerciseIds.map((exerciseId, i) =>
                            linkStatement!.executeAsync({
                                $position: i,
                                $workoutId: workout.id,
                                $exerciseId: exerciseId
                            })
                        ));
                        
                        workout.lastModified = timestamp;
                    })
                );
            });
            
        } catch (error) {
            console.error('Error saving workout(s) locally:', error);
            return;
        } finally {
            saveStatement?.finalizeAsync();
            clearStatement?.finalizeAsync();
            linkStatement?.finalizeAsync();
        }

        if (localOnly) return;

        let cleanStatement: SQLiteStatement | null = null;
        try {
            cleanStatement = await db.prepareAsync(`UPDATE workouts SET dirty = 0 WHERE id = ?;`);
            await Promise.all(
                workouts.map(async (workout) => {
                    const { error } = await supabase.rpc('save_workout', {
                        _id: workout.id,
                        _name: workout.name,
                        _last_modified: workout.lastModified!.toISOString(),
                        _exercise_ids: workout.exerciseIds.map((id, i) => ({ exercise_id: id, position: i }))
                    });

                    if (error) return;
                    await cleanStatement!.executeAsync(workout.id);
                })
            );
        } catch (error) {
            console.error('Error saving workout(s) to Supabase:', error);
        } finally {
            cleanStatement?.finalizeAsync();
        }
    }

    async save(db: SQLiteDatabase, timestamp: Date | null = null, localOnly: boolean = false) {
        if (timestamp !== null) {
            this.lastModified = timestamp;
        }
        await Workout.saveMany(db, [this], timestamp === null, localOnly);
    }

    async delete(db: SQLiteDatabase, localOnly: boolean = false) {        
        await db.runAsync(`DELETE FROM workouts WHERE id = ?`, this.id);
        if (localOnly) return;

        const { error } = await supabase.rpc('delete_workout', {
            _id: this.id,
            _deleted_at: new Date().toISOString()
        });

        if (!error) return;

        // If the delete operation fails, we insert into deleted_workouts
        await db.runAsync(`INSERT INTO deleted_workouts (id) VALUES (?);`, this.id);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            exercise_ids: this.exerciseIds.map((id, i) => ({ exercise_id: id, position: i })),
            last_modified: (this.lastModified ?? new Date()).toISOString()
        };
    }
}

export interface RawWorkout {
    id: string;
    name: string;
    last_modified?: string;
}

export interface FullRawWorkout extends RawWorkout {
    exercise_ids: string[];
}