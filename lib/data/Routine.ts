import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from '../uuid';
import { RawWorkout, Workout } from './Workout';
import { Exercise, RawExercise } from './Exercise';
import { supabase } from '../supabase';

export class Routine {
    id: string;
    name: string;
    lastModified: Date | null = null;
    readonly workouts: readonly (Workout | null)[];
    private readonly workoutIds: readonly (string | null)[];

    constructor(id: string, name: string, workouts: (Workout | null)[], lastModified?: Date);
    constructor(id: string, name: string, workoutIds: (string | null)[], lastModified?: Date);
    constructor(id: string, name: string, third: (Workout | null)[] | (string | null)[], lastModified: Date | null = null) {
        if (third.length !== 7) 
            throw new Error("Routine requires an array of length 7.");

        this.id = id;
        this.name = name;
        this.lastModified = lastModified;

        if (third.some(x => typeof x === 'string')) {
            this.workoutIds = third as (string | null)[];
            this.workouts = [];
        } else {
            this.workouts = third as (Workout | null)[];
            this.workoutIds = this.workouts.map(workout => workout?.id ?? null);
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS routines (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 1,
                last_modified TEXT NOT NULL DEFAULT datetime('now')
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

    static async pullMany(db: SQLiteDatabase, where: string = '1=1', deep: boolean = true) {
        const rawRoutines = await db.getAllAsync<RawRoutine>(`
            SELECT * FROM routines WHERE ${where}
            ORDER BY routines.name;
        `);

        if (rawRoutines.length === 0) return [];

        const rawWorkouts = await db.getAllAsync<RawWorkout & {
            position: number,
            routine_id: string
        }>(`
            SELECT
                workouts.*,
                workout_instances.position,
                workout_instances.routine_id
            FROM workout_instances
            JOIN workouts ON workout_instances.workout_id = workouts.id
            WHERE routine_id IN (SELECT id FROM routines WHERE ${where});
        `);
        
        if (!deep) {
            const routineToWorkoutIds: Record<string, string[]> = {};
            rawRoutines.forEach(row => {
                routineToWorkoutIds[row.id] = new Array(7).fill(null);
            });
            rawWorkouts.forEach(raw => {
                const routineId = raw.routine_id;
                routineToWorkoutIds[routineId][raw.position] = raw.id;
            });

            return rawRoutines.map(raw => new Routine(raw.id, raw.name, routineToWorkoutIds[raw.id]));
        }

        // For deep loading, we need to fetch exercises as well
        const rawExercises = await db.getAllAsync<RawExercise & {
            workout_position: number,
            routine_id: string,
            workout_id: string
        }>(`
            SELECT
                exercises.*,
                workout_instances.position AS workout_position,
                workout_instances.routine_id,
                workout_instances.workout_id
            FROM exercise_instances
            JOIN workout_instances ON exercise_instances.workout_id = workout_instances.workout_id
            JOIN exercises ON exercise_instances.exercise_id = exercises.id
            WHERE workout_instances.routine_id IN (SELECT * FROM routines WHERE ${where})
            ORDER BY workout_position, exercise_instances.position;
        `);
        
        // Create exercises grouped by workout_id
        const workoutToExercises: Record<string, Exercise[]> = {};
        rawWorkouts.forEach(raw => {
            workoutToExercises[raw.id] = [];
        });
        
        const exercises: Record<string, Exercise> = {};
        rawExercises.forEach(raw => {
            exercises[raw.id] ??= new Exercise(raw);
            workoutToExercises[raw.workout_id].push(exercises[raw.id]);
        });

        // Create workouts and add them to routines
        const routineToWorkouts: Record<string, Workout[]> = {};
        rawRoutines.forEach(raw => {
            routineToWorkouts[raw.id] = new Array(7).fill(null);
        });
        
        const workouts: Record<string, Workout> = {};
        rawWorkouts.forEach(raw => {
            workouts[raw.id] ??= new Workout(raw.id, raw.name, workoutToExercises[raw.id]);
            routineToWorkouts[raw.routine_id][raw.position] = workouts[raw.id];
        });
        
        return rawRoutines.map(raw => new Routine(
            raw.id,
            raw.name,
            routineToWorkouts[raw.id],
            new Date(raw.last_modified)
        ));
    }

    static async pullOne(id: string, db: SQLiteDatabase) {
        const routines = await this.pullMany(db, `id = '${id}'`, true);
        if (routines.length === 0) return null;
        return routines[0];
    }

    static async pullActive(db: SQLiteDatabase) {
        const idQuery = await db.getFirstAsync<{ active_routine_id: string }>(`
            SELECT user.active_routine_id FROM user;
        `);
        if (!idQuery) return null;

        return this.pullOne(idQuery.active_routine_id, db);
    }

    static async create(name: string, workoutIds: (string | null)[], db: SQLiteDatabase) {
        if (workoutIds.length !== 7) 
            throw new Error("Routine requires an array of length 7.");

        const routine = new Routine(randomUUID(), name, workoutIds);
        await routine.save(db);
        return routine;
    }

    async save(db: SQLiteDatabase) {
        let newModified: Date | null = null;
        await db.withExclusiveTransactionAsync(async (transaction) => {
            const insertResult = await transaction.getFirstAsync<{ last_modified: string; }>(`
                INSERT INTO routines (id, name)
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
            newModified = new Date(insertResult.last_modified);

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
                await Promise.all(this.workoutIds.map((workoutId, pos) =>
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
                ));
            } finally {
                await Promise.all([ linkQuery.finalizeAsync(), delinkQuery.finalizeAsync() ]);
            }
        });

        this.lastModified = newModified;

        const { error } = await supabase.rpc('save_routine', {
            _id: this.id,
            _name: this.name,
            _last_modified: this.lastModified,
            _workout_ids: this.workoutIds
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

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            workouts: this.workoutIds,
            last_modified: (this.lastModified ?? new Date()).toISOString()
        };
    }
}

export interface RawRoutine {
    id: string;
    name: string;
    last_modified: string;
}