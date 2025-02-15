import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';

export class Exercise {
    id: number;
    name: string;
    sets: Set[];
    notes: string;
    categories: string[];

    constructor(rawData: RawExercise);
    constructor(id: number, name: string, sets: Set[], notes: string, categories: string[]);
    constructor(arg1: RawExercise | number, name?: string, sets?: Set[], notes?: string, categories?: string[]) {
        if (typeof arg1 === 'number') {
            // Second definition
            let id = arg1; 

            this.id = id;
            this.name = name!;
            this.sets = sets!;
            this.notes = notes!;
            this.categories = categories!;
        } else {
            // First definition
            const rawData = arg1;

            this.id = rawData.id;
            this.name = rawData.name;
            this.notes = rawData.notes ?? '';

            // Deserialize sets ("REPS_1:WEIGHT_1;REPS_2:WEIGHT_2; ...")
            this.sets = rawData.sets!.split(';').map(setString => {
                const [reps, weight] = setString.split(':');
                return { 
                    reps: Number(reps),
                    weight: Number(weight)
                }
            });

            // Deserialize categories ("CATEGORY_1,CATEGORY_2, ...")
            this.categories = rawData.categories ? rawData.categories.split(',') : [];
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                sets TEXT NOT NULL,
                notes TEXT,
                categories TEXT
            );
        `);
    }

    static async pullOne(id: number, db: SQLiteDatabase): Promise<Exercise | null> {
        const result = await db.getFirstAsync<RawExercise>(`
            SELECT * FROM exercises WHERE id = ?
        `, id);

        return result ? new Exercise(result) : null;
    }

    static async saveMany(exercises: Exercise[], db: SQLiteDatabase) {
        // Save all exercises using a prepared statement
        const upsert = await db.prepareAsync(`
            INSERT INTO exercises (id, name, sets, notes, categories)
                VALUES (($id), ($name), ($sets), ($notes), ($categories))
            ON CONFLICT(id) DO UPDATE SET 
                name = ($name),
                sets = ($sets),
                notes = ($notes),
                categories = ($categories);
        `);

        await Promise.all(exercises.map(exercise => {
            const rawData = exercise.serialize();
            return upsert.executeAsync({
                $id: rawData.id,
                $name: rawData.name,
                $sets: rawData.sets,
                $notes: rawData.notes,
                $categories: rawData.categories
            });
        }));

        // Release the statement
        await upsert.finalizeAsync();
    }

    async save(db: SQLiteDatabase) {
        await Exercise.saveMany([ this ], db);
    }

    async delete(db: SQLiteDatabase) {
        // Get affected workout IDs before deletion
        const affectedWorkoutIds = (await db.getAllAsync<{ workout_id: number }>(`
            SELECT DISTINCT workout_id 
            FROM exercise_instances 
            WHERE exercise_id = ?
        `, this.id)).map(row => row.workout_id);

        // Delete the exercise_instances and exercise itself
        await db.runAsync('DELETE FROM exercise_instances WHERE exercise_id = ?', this.id);
        await db.runAsync('DELETE FROM exercises WHERE id = ?', this.id);

        if (!affectedWorkoutIds.length) return;
        
        // Reorder exercise_instances for the affected workouts
        await db.execAsync(`
            WITH RankedExercises AS (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY workout_id ORDER BY position) - 1 AS new_position,
                    position,
                    workout_id,
                    exercise_id
                FROM exercise_instances
                WHERE workout_id IN (${ affectedWorkoutIds.join(",") })
            )
            UPDATE exercise_instances
            SET position = RankedExercises.new_position
            FROM RankedExercises
            WHERE
                exercise_instances.position = RankedExercises.position
                AND exercise_instances.workout_id = RankedExercises.workout_id
                AND exercise_instances.exercise_id = RankedExercises.exercise_id;
        `);
    }

    private serialize(): RawExercise {
        return {
            id: this.id,
            name: this.name,
            sets: this.sets.map(({reps, weight}) => `${reps}:${weight}`).join(';'),
            notes: this.notes,
            categories: this.categories.join(',')
        }
    }
}

interface RawExercise {
    id: number
    name: string,
    sets: string,
    notes: string | null,
    categories: string | null
}

export interface Set {
    reps: number,
    weight: number
}