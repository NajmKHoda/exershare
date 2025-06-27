import { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';
import { randomUUID } from '../uuid';
import { supabase } from '../supabase';

export class Exercise {
    id: string;
    name: string;
    sets: Set[];
    notes: string;
    categories: string[];
    lastModified: Date | null;

    constructor(rawData: RawExercise);
    constructor(id: string, name: string, sets?: Set[], notes?: string, categories?: string[], lastModified?: Date);
    constructor(
        arg1: RawExercise | string,
        name?: string,
        sets: Set[] = [],
        notes: string = '',
        categories: string[] = [],
        lastModified: Date | null = null
    ) {
        if (typeof arg1 === 'string') {
            // Second definition
            let id = arg1; 

            this.id = id;
            this.name = name!;
            this.sets = sets;
            this.notes = notes;
            this.categories = categories;
            this.lastModified = lastModified;
        } else {
            // First definition
            const rawData = arg1;

            this.id = rawData.id;
            this.name = rawData.name;
            this.notes = rawData.notes;
            this.lastModified = rawData.last_modified ? new Date(rawData.last_modified) : null;

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
                id TEXT PRIMARY KEY NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 1,
                name TEXT NOT NULL,
                sets TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                categories TEXT NOT NULL DEFAULT '',
                last_modified TEXT NOT NULL DEFAULT current_timestamp
            );

            CREATE TABLE IF NOT EXISTS deleted_exercises (
                id TEXT PRIMARY KEY NOT NULL,
                deleted_at TEXT NOT NULL DEFAULT current_timestamp
            );
        `);
    }

    static async pullMany(db: SQLiteDatabase, where: string = '1=1'): Promise<Exercise[]> {
        const rawExercises = await db.getAllAsync<RawExercise>(`
            SELECT * FROM exercises WHERE ${where}
            ORDER BY name;
        `);

        if (rawExercises.length === 0) return [];
        return rawExercises.map(raw => new Exercise(raw));
    }

    static async pullOne(id: string, db: SQLiteDatabase): Promise<Exercise | null> {
        const exercises = await this.pullMany(db, `id = '${id}'`);
        if (exercises.length === 0) return null;
        return exercises[0];
    }

    static async create(name: string, sets: Set[], notes: string, categories: string[], db: SQLiteDatabase) {
        const exercise = new Exercise(randomUUID(), name, sets, notes, categories);
        await exercise.save(db);
        return exercise;
    }

    static async saveMany(
        db: SQLiteDatabase, 
        exercises: Exercise[],
        overwriteTimestamp: boolean = true,
        localOnly: boolean = false
    ) {
        const serializedExercises = exercises.map(exercise => exercise.serialize());
        const newTimestamp = new Date();

        let saveStatement: SQLiteStatement | null = null;
        try {
            saveStatement = await db.prepareAsync(`
                INSERT INTO exercises (id, name, sets, notes, categories, last_modified)
                VALUES ($id, $name, $sets, $notes, $categories, $timestamp)
                ON CONFLICT(id) DO UPDATE SET 
                    name = excluded.name,
                    sets = excluded.sets,
                    notes = excluded.notes,
                    categories = excluded.categories,
                    last_modified = excluded.last_modified;
            `);

            await Promise.all(
                exercises.map(async (exercise, i) => {
                    const serialized = serializedExercises[i];
                    const newModified = overwriteTimestamp ? newTimestamp : exercise.lastModified ?? newTimestamp;

                    await saveStatement!.executeAsync({
                        $id: serialized.id,
                        $name: serialized.name,
                        $sets: serialized.sets,
                        $notes: serialized.notes,
                        $categories: serialized.categories,
                        $timestamp: newModified.toISOString()
                    });

                    // Update the last modified date in the instance
                    exercise.lastModified = newModified;
                })
            );
        } catch (error) {
            console.error('Error saving exercise(s) locally:', error);
            return;
        } finally {
            saveStatement?.finalizeAsync();
        }

        if (localOnly) return;

        const { error: remoteError } = await supabase.from('exercises').upsert(
            exercises.map(exercise => ({
                ...exercise,
                last_modified: exercise.lastModified!.toISOString()
            }))
        );
        if (remoteError) return;

        try {
            const placeholders = new Array(exercises.length).fill('?').join(',');
            await db.runAsync(`
                UPDATE exercises SET dirty = 0 WHERE id IN (${placeholders});
            `, exercises.map(exercise => exercise.id));
        } catch (error) {
            console.error('Error updating exercise dirty flag:', error);
        }
    }


    async save(db: SQLiteDatabase, timestamp: Date | null = null, localOnly: boolean = false) {
        if (timestamp !== null) {
            this.lastModified = timestamp;
        }
        return Exercise.saveMany(db, [this], timestamp === null, localOnly);
    }

    async delete(db: SQLiteDatabase, localOnly: boolean = false) {        
        await db.runAsync(`DELETE FROM exercises WHERE id = ?`, this.id);
        if (localOnly) return;

        const { error } = await supabase.rpc('delete_exercise', {
            _id: this.id,
            _deleted_at: new Date().toISOString()
        });

        if (!error) return;

        // If the delete operation fails, we insert into deleted_exercises
        await db.runAsync(`INSERT INTO deleted_exercises (id) VALUES (?);`, this.id);
    }

    serialize(): RawExercise {
        return {
            id: this.id,
            name: this.name,
            sets: this.sets.map(({reps, weight}) => `${reps}:${weight}`).join(';'),
            notes: this.notes,
            categories: this.categories.join(','),
            last_modified: (this.lastModified ?? new Date()).toISOString()
        }
    }
}

export interface RawExercise {
    id: string,
    name: string,
    sets: string,
    notes: string,
    categories: string,
    last_modified?: string
}

export interface Set {
    reps: number,
    weight: number
}