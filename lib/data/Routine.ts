import { SQLiteDatabase } from 'expo-sqlite';
import { Workout } from './Workout';
import { Exercise } from './Exercise';

export class Routine {
    id: number;
    name: string;
    workouts: (Workout | null)[];

    constructor(id: number, name: string, workouts: (Workout | null)[]) {
        this.id = id;
        this.name = name;
        this.workouts = workouts;
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
    
    static async pullActive(db: SQLiteDatabase) {
        
        const routineQuery = await db.getFirstAsync<{ name: string, id: number }>(`
            SELECT routines.name, routines.id FROM routines
            JOIN user ON routines.id = user.active_routine_id;
        `);
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
                JOIN user
                    ON workout_instances.routine_id = user.active_routine_id
                JOIN workouts
                    ON workout_instances.workout_id = workouts.id;
            `),
        
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
                    JOIN user
                        ON workout_instances.routine_id = user.active_routine_id
                    JOIN workouts
                        ON workout_instances.workout_id = workouts.id
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
            `)
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
            const workout = new Workout(workout_id, name, exercises[position]);
            workouts[position] = workout;
        }

        return new Routine(routineQuery.id, routineQuery.name, workouts);
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

            // Save associated workouts
            Workout.saveMany(this.workouts.filter(x => x != null), db)
        ]);

        // Prepare linking query
        const linkQuery = await db.prepareAsync(`
            INSERT INTO workout_instances (position, routine_id, workout_id)
                VALUES ($position, $routineId, $workoutId)
            ON CONFLICT (position, routine_id) DO UPDATE SET
                workout_id = $workoutId;
        `);

        // Link workouts with routine
        await Promise.all(this.workouts
            .map((workout, i) => {
                if (!workout) return;
                return linkQuery.executeAsync({
                    $position: i,
                    $routineId: this.id,
                    $workoutId: workout.id
                })
            })
        );

        await linkQuery.finalizeAsync();
    }
}