import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise, RawExercise } from './Exercise';

export class Workout {
    id: number;
    name: string;
    exercises: Exercise[];
    exerciseIds: number[];

    constructor(id: number, name: string, exercises: Exercise[]);
    constructor(id: number, name: string, exerciseIds: number[]);
    constructor(id: number, name: string, third: Exercise[] | number[]) {
        this.id = id;
        this.name = name;
        if (third.length > 0 && typeof third[0] === 'number') {
            this.exerciseIds = third as number[];
            this.exercises = [];
        } else {
            this.exercises = third as Exercise[];
            this.exerciseIds = [];
        }
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

    static async create(name: string, exerciseIds: number[], db: SQLiteDatabase) {
        const result = await db.runAsync(`INSERT INTO workouts (name) VALUES (?);`, name);
        const workoutId = result.lastInsertRowId;

        const linkQuery = await db.prepareAsync(`
            INSERT INTO exercise_instances (position, workout_id, exercise_id)
            VALUES ($position, $workoutId, $exerciseId);
        `);
        
        try {
            await Promise.all(exerciseIds.map((exerciseId, i) =>
                linkQuery.executeAsync({
                    $position: i,
                    $workoutId: workoutId,
                    $exerciseId: exerciseId
                })
            ));
        } finally {
            await linkQuery.finalizeAsync();
        }
    }
    
    static async pullOne(id: number, db: SQLiteDatabase) {
        const result = await db.getFirstAsync<{ id: number, name: string }>(`
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
        
        return new Workout(result.id, result.name, exercises);
    }

    async save(db: SQLiteDatabase) {
        await Workout.saveMany([ this ], db);
    }

    async delete(db: SQLiteDatabase) {
        // Delete all exercise_instances and workout_instances linked to this workout
        await Promise.all([
            db.runAsync('DELETE FROM exercise_instances WHERE workout_id = ?', this.id),
            db.runAsync('DELETE FROM workout_instances WHERE workout_id = ?', this.id),
        ]);

        // Delete the workout record
        await db.runAsync('DELETE FROM workouts WHERE id = ?', this.id);
    }
}