import { SQLiteDatabase } from 'expo-sqlite';
import { Workout } from './Workout';
import { Exercise } from './Exercise';

export class Routine {
    id: number;
    name: string;
    workouts: (Workout | null)[];
    private shallow: boolean;
    private workoutIds: (number | null)[];

    constructor(id: number, name: string, workouts: (Workout | null)[]);
    constructor(id: number, name: string, workoutIds: (number | null)[]);
    constructor(id: number, name: string, third: (Workout | null)[] | (number | null)[]) {
        if (third.length !== 7) 
            throw new Error("Routine requires an array of length 7.");

        this.id = id;
        this.name = name;
        
        if (third.some(x => typeof x === 'number')) {
            this.shallow = true;
            this.workoutIds = third as (number | null)[];
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
                id INTEGER PRIMARY KEY NOT NULL,
                name TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS workout_instances (
                position INTEGER NOT NULL,
                routine_id INTEGER NOT NULL,
                workout_id INTEGER NOT NULL,
                PRIMARY KEY (position, routine_id),
                FOREIGN KEY (routine_id) REFERENCES routines(id),
                FOREIGN KEY (workout_id) REFERENCES workouts(id)
            );
        `)
    }
    
    static async pullOne(id: number, db: SQLiteDatabase) {
        const routineQuery = await db.getFirstAsync<{ name: string, id: number }>(`
            SELECT routines.name, routines.id FROM routines
            WHERE routines.id = ?;
        `, [id]);
        if (!routineQuery) return null;

        const [rawWorkouts, rawExercises] = await Promise.all([
            db.getAllAsync<{
                workout_id: number,
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
                id: number,
                name: string,
                sets: string,
                notes: string,
                categories: string
            }>(`
                WITH routine_workouts AS (
                    SELECT
                        workout_instances.position AS workout_position,
                        workout_instances.workout_id
                    FROM workout_instances
                    JOIN workouts
                        ON workout_instances.workout_id = workouts.id
                    WHERE workout_instances.routine_id = ?
                )
                SELECT
                    routine_workouts.workout_position,
                    exercise_instances.position AS exercise_position,
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
        const activeRoutineIdQuery = await db.getFirstAsync<{ active_routine_id: number }>(`
            SELECT user.active_routine_id FROM user;
        `);
        if (!activeRoutineIdQuery) return null;

        return this.pullOne(activeRoutineIdQuery.active_routine_id, db);
    }

    static async create(name: string, workoutIds: (number | null)[], db: SQLiteDatabase) {
        const result = await db.runAsync('INSERT INTO routines (name) VALUES (?)', name);
        const routineId = result.lastInsertRowId;

        const linkQuery = await db.prepareAsync(`
            INSERT INTO workout_instances (position, routine_id, workout_id)
                VALUES ($position, $routineId, $workoutId);
        `);

        try {
            await Promise.all(workoutIds
                .filter(x => x !== null)
                .map((workoutId, pos) => linkQuery.executeAsync({
                    $position: pos,
                    $routineId: routineId,
                    $workoutId: workoutId
                }))
            );
        } finally {
            await linkQuery.finalizeAsync();
        }
    }

    async save(db: SQLiteDatabase) {
        await Promise.all([
            // Save routine
            db.runAsync(`
                INSERT INTO routines (id, name)
                    VALUES ($id, $name)
                ON CONFLICT (id) DO UPDATE SET
                    id = $id,
                    name = $name;
            `, {
                $id: this.id,
                $name: this.name
            }),

            // Save associated workouts (if this isn't a shallow Routine)
            !this.shallow && Workout.saveMany(this.workouts.filter(x => x != null), db)
        ]);

        // Prepare linking query
        const linkQuery = await db.prepareAsync(`
            INSERT INTO workout_instances (position, routine_id, workout_id)
                VALUES ($position, $routineId, $workoutId)
            ON CONFLICT (position, routine_id) DO UPDATE SET
                workout_id = $workoutId;
        `);
        
        // For workouts that were just turned null
        const delinkQuery = await db.prepareAsync(`
            DELETE FROM workout_instances
                WHERE routine_id = $routineId AND position = $position;
        `);
        
        const workoutIds = this.shallow ? this.workoutIds : this.workouts.map(w => w?.id ?? null);
        
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

        await Promise.all([ linkQuery.finalizeAsync(), delinkQuery.finalizeAsync() ]);
    }

    async delete(db: SQLiteDatabase) {
        await db.runAsync('DELETE FROM workout_instances WHERE routine_id = ?', this.id);
        await db.runAsync('DELETE FROM routines WHERE id = ?', this.id);
    }
}