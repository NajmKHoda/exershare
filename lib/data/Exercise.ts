import { SQLiteDatabase } from 'expo-sqlite';
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
            this.lastModified = new Date(rawData.last_modified);

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

    async save(db: SQLiteDatabase, timestamp: Date | null = null) {
        const serialized = this.serialize();
        const newModified = timestamp ?? new Date();

        await db.getFirstAsync<{ last_modified: string }>(`
            INSERT INTO exercises (id, name, sets, notes, categories, last_modified)
                VALUES (
                    $id, $name, $sets,
                    $notes, $categories, $timestamp
                )
            ON CONFLICT(id) DO UPDATE SET 
                name = $name,
                sets = $sets,
                notes = $notes,
                categories = $categories,
                dirty = 1,
                last_modified = $timestamp;
        `, {
            $id: serialized.id,
            $name: serialized.name,
            $sets: serialized.sets,
            $notes: serialized.notes,
            $categories: serialized.categories,
            $timestamp: newModified.toISOString()
        });

        this.lastModified = newModified;
        const { error } = await supabase.from('exercises').upsert({
            ...serialized,
            last_modified: this.lastModified.toISOString()
        });

        if (error) return;
        await db.runAsync(`UPDATE exercises SET dirty = 0 WHERE id = ?;`, this.id);
    }

    async delete(db: SQLiteDatabase) {        
        await db.runAsync(`DELETE FROM exercises WHERE id = ?`, this.id);

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
    last_modified: string
}

export interface Set {
    reps: number,
    weight: number
}