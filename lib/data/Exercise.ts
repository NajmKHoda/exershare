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

    static async saveMany(exercises: Exercise[], db?: SQLiteDatabase) {
        db ??= useSQLiteContext();

        // Save all exercises using a prepared statement
        const upsert = await db.prepareAsync(upsertStatement);
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

    /*
    static async fromDatabase(id: number, db?: SQLiteDatabase) {
        if (!Number.isInteger(id)) return null;
        db ??= useSQLiteContext();

        const dbExercise = await db.getFirstAsync<RawExercise>('SELECT * FROM exercises WHERE id = (?)', id);
        return dbExercise ? new Exercise(dbExercise) : null;
    }
    */

    serialize(): RawExercise {
        return {
            id: this.id,
            name: this.name,
            sets: this.sets.map(({reps, weight}) => `${reps}:${weight}`).join(';'),
            notes: this.notes,
            categories: this.categories.join(',')
        }
    }

    async save(db?: SQLiteDatabase) {
        db ??= useSQLiteContext();

        const rawData = this.serialize();
        await db.runAsync(upsertStatement, {
            $id: rawData.id,
            $name: rawData.name,
            $sets: rawData.sets,
            $notes: rawData.notes,
            $categories: rawData.categories
        });
    }
}

export interface RawExercise {
    id: number
    name: string,
    sets: string,
    notes: string | null,
    categories: string | null
}

interface Set {
    reps: number,
    weight: number
}

const upsertStatement = `
    INSERT INTO exercises (id, name, sets, notes, categories)
        VALUES (($id), ($name), ($sets), ($notes), ($categories))
    ON CONFLICT(id) DO UPDATE SET 
        name = ($name),
        sets = ($sets),
        notes = ($notes),
        categories = ($categories);
`;