import { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { supabase } from '../supabase';
import { MeasurementSystem } from '../utils/units';

export const VOLUME_TYPES = ['reps', 'distance', 'time', 'calories'] as const;
export const INTENSITY_TYPES = ['weight', 'speed', 'incline', 'resistance', 'level'] as const;
export const TYPE_DEFAULTS: Record<VolumeType | IntensityType, Record<MeasurementSystem, number>> = {
    reps: { metric: 12, imperial: 12 },
    distance: { metric: 1.5, imperial: 1.0 },
    time: { metric: 60.0, imperial: 60.0 },
    calories: { metric: 200.0, imperial: 200.0 },
    weight: { metric: 15.0, imperial: 30.0 },
    speed: { metric: 8.0, imperial: 5.0 },
    incline: { metric: 5.0, imperial: 5.0 },
    resistance: { metric: 1.0, imperial: 1.0 },
    level: { metric: 1.0, imperial: 1.0 }
}

export class Exercise {
    id: string;
    name: string;
    volumeType: VolumeType;
    intensityTypes: IntensityType[];
    sets: Set[];
    notes: string;
    categories: string[];
    lastModified: Date | null;

    constructor(rawData: RawExercise);
    constructor(
        id: string,
        name: string,
        volumeType: VolumeType,
        intensityTypes: IntensityType[],
        sets: Set[],
        notes?: string,
        categories?: string[],
        lastModified?: Date
    );
    constructor(
        arg1: RawExercise | string,
        name?: string,
        volumeType?: VolumeType,
        intensityTypes?: IntensityType[],
        sets?: Set[],
        notes: string = '',
        categories: string[] = [],
        lastModified: Date | null = null
    ) {
        if (typeof arg1 === 'string') {
            // Data passed directly
            let id = arg1; 
            this.id = id;
            this.name = name!;
            this.volumeType = volumeType!;
            this.intensityTypes = intensityTypes!;
            this.sets = sets!;
            this.notes = notes;
            this.categories = categories;
            this.lastModified = lastModified;
        } else {
            // Deserialize raw data from SQLite
            const rawData = arg1;

            this.id = rawData.id;
            this.name = rawData.name;
            this.volumeType = rawData.volume_type;
            this.intensityTypes = rawData.intensity_types.split(',').filter(Boolean) as IntensityType[];
            this.notes = rawData.notes;
            this.lastModified = rawData.last_modified ? new Date(rawData.last_modified) : null;
            this.sets = JSON.parse(rawData.sets) as Set[];
            this.categories = rawData.categories ? rawData.categories.split(',') : [];
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS exercises (
                id TEXT PRIMARY KEY NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 1,
                name TEXT NOT NULL,
                volume_type TEXT NOT NULL,
                intensity_types TEXT NOT NULL,
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

        return rawExercises.map(raw => new Exercise(raw));
    }

    static async pullOne(id: string, db: SQLiteDatabase): Promise<Exercise | null> {
        const exercises = await this.pullMany(db, `id = '${id}'`);
        if (exercises.length === 0) return null;
        return exercises[0];
    }

    static async create(
        db: SQLiteDatabase,
        name: string,
        volumeType: VolumeType,
        intensityTypes: IntensityType[],
        sets: Set[],
        notes?: string,
        categories?: string[]
    ) {
        const exercise = new Exercise(
            randomUUID(),
            name,
            volumeType,
            intensityTypes,
            sets,
            notes,
            categories
        );
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
                INSERT INTO exercises (
                    id, name, volume_type, intensity_types,
                    sets, notes, categories, last_modified
                ) VALUES (
                    $id, $name, $volumeType, $intensityTypes,
                    $sets, $notes, $categories, $timestamp
                ) ON CONFLICT(id) DO UPDATE SET 
                    name = excluded.name,
                    volume_type = excluded.volume_type,
                    intensity_types = excluded.intensity_types,
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
                        $volumeType: serialized.volume_type,
                        $intensityTypes: serialized.intensity_types,
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
            exercises.map((exercise, i) => ({
                ...serializedExercises[i],
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
            volume_type: this.volumeType,
            intensity_types: this.intensityTypes.join(','),
            sets: JSON.stringify(this.sets),
            notes: this.notes,
            categories: this.categories.join(','),
            last_modified: (this.lastModified ?? new Date()).toISOString()
        }
    }
}

export interface RawExercise {
    id: string,
    name: string,
    volume_type: VolumeType,
    intensity_types: string,
    sets: string,
    notes: string,
    categories: string,
    last_modified?: string
}

export type Set = { volume: number; } & Partial<Record<IntensityType, number>>;

export type VolumeType = typeof VOLUME_TYPES[number];
export type IntensityType = typeof INTENSITY_TYPES[number];