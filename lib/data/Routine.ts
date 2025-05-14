import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from '../uuid';
import { Workout } from './Workout';
import { Exercise } from './Exercise';
import { supabase } from '../supabase';

export class Routine {
    id: string;
    name: string;
    workouts: (Workout | null)[];
    private shallow: boolean;
    private workoutIds: (string | null)[];

    constructor(id: string, name: string, workouts: (Workout | null)[]);
    constructor(id: string, name: string, workoutIds: (string | null)[]);
    constructor(id: string, name: string, third: (Workout | null)[] | (string | null)[]) {
        if (third.length !== 7) 
            throw new Error("Routine requires an array of length 7.");

        this.id = id;
        this.name = name;

        if (third.some(x => typeof x === 'string')) {
            this.shallow = true;
            this.workoutIds = third as (string | null)[];
            this.workouts = [];
        } else {
            this.shallow = false;
            this.workouts = third as (Workout | null)[];
            this.workoutIds = [];
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS routines (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 1
            );
            
            CREATE TABLE IF NOT EXISTS workout_instances (
                position INTEGER NOT NULL CHECK(position >= 0 AND position < 7),
                routine_id TEXT NOT NULL,
                workout_id TEXT NOT NULL,
                PRIMARY KEY (position, routine_id),
                FOREIGN KEY (routine_id) REFERENCES routines(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                FOREIGN KEY (workout_id) REFERENCES workouts(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
        `)
    }

    static async pullOne(id: string, db: SQLiteDatabase) {
        const routineQuery = await db.getFirstAsync<{ name: string, id: string }>(`
            SELECT routines.name, routines.id FROM routines
            WHERE routines.id = ?;
        `, [id]);
        if (!routineQuery) return null;

        const [rawWorkouts, rawExercises] = await Promise.all([
            db.getAllAsync<{
                workout_id: string,
                position: number,
                name: string
            }>(`
                SELECT
                    workout_instances.workout_id,
                    workout_instances.position,
                    workouts.name
                FROM workout_instances
                JOIN workouts
                    ON workout_instances.workout_id = workouts.id
                WHERE workout_instances.routine_id = ?;
            `, [id]),
        
            db.getAllAsync<{
                workout_position: number,
                exercise_position: number,
                id: string,
                name: string,
                sets: string,
                notes: string,
                categories: string
            }>(`
                WITH routine_workouts AS (
                    SELECT
                        ROW_NUMBER() OVER (ORDER BY position) - 1 AS workout_position,
                        workout_id
                    FROM workout_instances
                    WHERE routine_id = ?
                )
                SELECT
                    routine_workouts.workout_position,
                    ROW_NUMBER() OVER (
                        PARTITION BY routine_workouts.workout_position
                        ORDER BY exercise_instances.position
                    ) - 1 AS exercise_position,
                    exercises.id,
                    exercises.name,
                    exercises.sets,
                    exercises.notes,
                    exercises.categories
                FROM exercise_instances
                JOIN routine_workouts
                    ON exercise_instances.workout_id = routine_workouts.workout_id
                JOIN exercises
                    ON exercise_instances.exercise_id = exercises.id;
            `, [id])
        ]);
        
        // Create and sort exercises
        const exercises: Exercise[][] = new Array(7);
        for (const rawExercise of rawExercises) {
            const { workout_position, exercise_position } = rawExercise;
            const exercise = new Exercise({
                id: rawExercise.id,
                name: rawExercise.name,
                sets: rawExercise.sets,
                notes: rawExercise.notes,
                categories: rawExercise.categories
            });

            exercises[workout_position] ??= [];
            exercises[workout_position][exercise_position] = exercise;
        }

        // Create workouts
        const workouts: (Workout | null)[] = new Array(7).fill(null);
        for (const rawWorkout of rawWorkouts) {
            const { name, position, workout_id } = rawWorkout;
            const workout = new Workout(workout_id, name, exercises[position] || []);
            workouts[position] = workout;
        }

        return new Routine(routineQuery.id, routineQuery.name, workouts);
    }

    static async pullActive(db: SQLiteDatabase) {
        const idQuery = await db.getFirstAsync<{ active_routine_id: string }>(`
            SELECT user.active_routine_id FROM user;
        `);
        if (!idQuery) return null;

        return this.pullOne(idQuery.active_routine_id, db);
    }

    static async create(name: string, workoutIds: (string | null)[], db: SQLiteDatabase) {
        const id = randomUUID();

        await db.withExclusiveTransactionAsync(async (transaction) => {
            await transaction.runAsync('INSERT INTO routines (id, name) VALUES (?, ?)', id, name);

            const linkQuery = await transaction.prepareAsync(`
                INSERT INTO workout_instances (position, routine_id, workout_id)
                    VALUES ($position, $routineId, $workoutId);
            `);

            try {
                await Promise.all(workoutIds
                    .map((workoutId, pos) => {
                        if (workoutId === null) return null;
                        return linkQuery.executeAsync({
                            $position: pos,
                            $routineId: id,
                            $workoutId: workoutId
                        })
                    })
                );
            } finally {
                await linkQuery.finalizeAsync();
            }
        });

        const { error } = await supabase.rpc('save_routine', {
            _id: id,
            _name: name,
            _workout_ids: workoutIds
                .map((id, i) => ({ workout_id: id, position: i }))
                .filter(({ workout_id }) => workout_id !== null)
        });

        if (error) return;
        await db.runAsync('UPDATE routines SET dirty = 0 WHERE id = ?', id);
    }

    async save(db: SQLiteDatabase) {
        const workoutIds = this.shallow ? this.workoutIds : this.workouts.map(w => w?.id ?? null);

        await db.withExclusiveTransactionAsync(async (transaction) => {
            await transaction.runAsync(`
                INSERT INTO routines (id, name)
                    VALUES ($id, $name)
                ON CONFLICT (id) DO UPDATE SET name = $name, dirty = 1;
            `, {
                $id: this.id,
                $name: this.name
            });

            // Prepare linking query
            const linkQuery = await transaction.prepareAsync(`
                INSERT INTO workout_instances (position, routine_id, workout_id)
                    VALUES ($position, $routineId, $workoutId)
                ON CONFLICT (position, routine_id) DO UPDATE SET
                    workout_id = $workoutId;
            `);
            
            // For workouts that were just turned null
            const delinkQuery = await transaction.prepareAsync(`
                DELETE FROM workout_instances
                    WHERE routine_id = $routineId AND position = $position;
            `);
            
            try {
                // Link workouts with routine
                await Promise.all(workoutIds
                    .map((workoutId, pos) =>
                        workoutId === null ?
                            delinkQuery.executeAsync({
                                $routineId: this.id,
                                $position: pos
                            }) :
                            linkQuery.executeAsync({
                                $position: pos,
                                $routineId: this.id,
                                $workoutId: workoutId
                            })
                    )
                );
            } finally {
                await Promise.all([ linkQuery.finalizeAsync(), delinkQuery.finalizeAsync() ]);
            }
        });

        const { error } = await supabase.rpc('save_routine', {
            _id: this.id,
            _name: this.name,
            _workout_ids: workoutIds
                .map((id, i) => ({ workout_id: id, position: i }))
                .filter(({ workout_id }) => workout_id !== null)
        });

        if (error) return;
        await db.runAsync('UPDATE routines SET dirty = 0 WHERE id = ?', this.id);
    }

    async delete(db: SQLiteDatabase) {
        await db.runAsync('DELETE FROM routines WHERE id = ?', this.id);
        await supabase.from('routines').delete().eq('id', this.id);
    }
}