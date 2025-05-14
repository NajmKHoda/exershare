import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from '../uuid';
import { supabase } from '../supabase';

export class Exercise {
    id: string;
    name: string;
    sets: Set[];
    notes: string;
    categories: string[];

    constructor(rawData: RawExercise);
    constructor(id: string, name: string, sets: Set[], notes: string, categories: string[]);
    constructor(arg1: RawExercise | string, name?: string, sets?: Set[], notes?: string, categories?: string[]) {
        if (typeof arg1 === 'string') {
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
                id TEXT PRIMARY KEY NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 1,
                name TEXT NOT NULL,
                sets TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                categories TEXT NOT NULL DEFAULT ''
            );
        `);
    }

    static async pullOne(id: string, db: SQLiteDatabase): Promise<Exercise | null> {
        const result = await db.getFirstAsync<RawExercise>(`
            SELECT * FROM exercises WHERE id = ?
        `, id);

        return result ? new Exercise(result) : null;
    }

    static async create(name: string, sets: Set[], notes: string, categories: string[], db: SQLiteDatabase) {
        const id = randomUUID();
        const exercise = new Exercise(id, name, sets, notes, categories);
        const serialized = exercise.serialize();

        await db.runAsync(`
            INSERT INTO exercises (id, name, sets, notes, categories)
            VALUES (?, ?, ?, ?, ?);
        `,
            serialized.id,
            serialized.name,
            serialized.sets,
            serialized.notes,
            serialized.categories
        );

        const { error } = await supabase.from('exercises').insert([serialized]);
        if (error) return;

        await db.runAsync(`UPDATE exercises SET dirty = 0 WHERE id = ?;`, serialized.id)
    }

    async save(db: SQLiteDatabase) {
        const serialized = this.serialize();

        await db.runAsync(`
            INSERT INTO exercises (id, name, sets, notes, categories)
                VALUES (($id), ($name), ($sets), ($notes), ($categories))
            ON CONFLICT(id) DO UPDATE SET 
                name = ($name),
                sets = ($sets),
                notes = ($notes),
                categories = ($categories),
                dirty = 1;
        `, {
            $id: serialized.id,
            $name: serialized.name,
            $sets: serialized.sets,
            $notes: serialized.notes,
            $categories: serialized.categories
        });

        const { error } = await supabase.from('exercises').upsert(serialized);
        if (error) return;

        await db.runAsync(`UPDATE exercises SET dirty = 0 WHERE id = ?;`, serialized.id);
    }

    async delete(db: SQLiteDatabase) {        
        await db.runAsync(`DELETE FROM exercises WHERE id = ?`, this.id);
        await supabase.from('exercises').delete().eq('id', this.id);
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

export interface RawExercise {
    id: string,
    name: string,
    sets: string,
    notes: string,
    categories: string
}

export interface Set {
    reps: number,
    weight: number
}