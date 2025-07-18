import { SQLiteDatabase } from 'expo-sqlite';
import { Workout } from './Workout';
import { serializeDate, deserializeDate } from './dates';
import { Exercise, IntensityType, Set, VolumeType } from './Exercise';
import { supabase } from '../supabase';

export class WorkoutLog {
    date: Date;
    routineName: string;
    workoutName: string;
    exercises: ExerciseMap;
    completion: CompletionLog[];
    lastModified: Date | null;

    constructor(rawLog: RawLog);
    constructor(date: Date, workout: Workout, routineName: string);
    constructor(
        date: Date,
        routineName: string,
        workoutName: string,
        exercises: ExerciseMap,
        completion: CompletionLog[],
        lastModified?: Date | null
    );
    constructor(
        first: Date | RawLog,
        second?: string | Workout,
        third?: string,
        exercises?: ExerciseMap,
        completion?: CompletionLog[],
        lastModified: Date | null = null
    ) {
        if (first instanceof Date) {
            this.date = new Date(first.setHours(0, 0, 0, 0));
            this.lastModified = lastModified ? new Date(lastModified) : null;
            if (second instanceof Workout) {
                this.routineName = third!;
                this.workoutName = second.name;
                this.exercises = copyExercises(second.exercises);
                this.completion = second.exercises.map(exercise => ({
                    id: exercise.id,
                    setsCompleted: 0
                }));
            } else {
                this.date = first;
                this.routineName = second as string;
                this.workoutName = third as string;
                this.exercises = exercises!;
                this.completion = completion!;
            }
        } else {
            this.date = deserializeDate(first.date);
            this.routineName = first.routine_name;
            this.workoutName = first.workout_name;
            this.exercises = new Map(Object.entries(JSON.parse(first.exercises)));
            this.completion = JSON.parse(first.completion);
            this.lastModified = new Date(first.last_modified);
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS workout_logs (
                date TEXT PRIMARY KEY NOT NULL,
                routine_name TEXT NOT NULL,
                workout_name TEXT NOT NULL,
                exercises TEXT NOT NULL,
                completion TEXT NOT NULL,
                last_modified TEXT NOT NULL DEFAULT current_timestamp,
                dirty INTEGER NOT NULL DEFAULT 1
            );
        `);
    }

    static async getDirtyLogs(db: SQLiteDatabase) {
        const rawLogs = await db.getAllAsync<RawLog>(`
            SELECT * FROM workout_logs WHERE dirty = 1
            ORDER BY date DESC;
        `);

        return rawLogs.map(raw => new WorkoutLog(raw));
    }

    static async getLog(date: Date, db: SQLiteDatabase) {
        const result = await db.getFirstAsync<RawLog>(`
            SELECT * FROM workout_logs WHERE date = ?
        `, serializeDate(date));

        return result ? new WorkoutLog(result) : null;
    }

    static async saveMany(
        db: SQLiteDatabase,
        logs: WorkoutLog[],
        overwriteTimestamp: boolean = true,
        localOnly: boolean = false
    ) {
        const serialized = logs.map(log => log.serialize());
        const newTimestamp = new Date();

        let saveStatement: any = null;
        try {
            saveStatement = await db.prepareAsync(`
                INSERT INTO workout_logs (
                    date, routine_name, workout_name,
                    exercises, completion, last_modified, dirty
                ) VALUES (
                    $date, $routineName, $workoutName,
                    $exercises, $completion, $last_modified, $dirty
                ) ON CONFLICT(date) DO UPDATE SET
                    routine_name = excluded.routine_name,
                    workout_name = excluded.workout_name,
                    exercises = excluded.exercises,
                    completion = excluded.completion,
                    last_modified = excluded.last_modified,
                    dirty = excluded.dirty
            `);

            await Promise.all(
                logs.map(async (log, i) => {
                    const serializedLog = serialized[i];
                    const newModified = overwriteTimestamp ? newTimestamp : log.lastModified ?? newTimestamp;

                    await saveStatement.executeAsync({
                        $date: serializeDate(log.date),
                        $routineName: serializedLog.routine_name,
                        $workoutName: serializedLog.workout_name,
                        $exercises: serializedLog.exercises,
                        $completion: serializedLog.completion,
                        $last_modified: newModified.toISOString(),
                        $dirty: localOnly ? 0 : 1
                    });

                    log.lastModified = newModified;
                })
            );
        } catch (error) {
            console.error('Error saving workout logs locally:', error);
            return;
        } finally {
            await saveStatement?.finalizeAsync();
        }

        if (localOnly) return;

        // Attempt syncing with Supabase
        const { error } = await supabase.from('workout_logs').upsert(
            logs.map((log, i) => ({
                ...serialized[i],
                last_modified: log.lastModified!.toISOString()
            }))
        );
        if (error) return;
        try {
            const placeholders = logs.map(() => '?').join(',');
            await db.runAsync(
                `UPDATE workout_logs SET dirty = 0 WHERE date IN (${placeholders});`,
                logs.map(log => serializeDate(log.date))
            );
        } catch (error) {
            console.error('Error updating workout log dirty flags:', error);
        }
    }

    async save(
        db: SQLiteDatabase,
        timestamp: Date | null = null,
        localOnly: boolean = false
    ) {
        if (timestamp !== null) {
            this.lastModified = timestamp;
        }
        await WorkoutLog.saveMany(db, [this], timestamp === null, localOnly);
    }

    async applySetChanges(db: SQLiteDatabase) {
        try {
            const exercises = (await Promise.all(
                Array.from(this.exercises.entries()).map(
                    async ([id, { volumeType, intensityTypes, sets }]) => {
                        const exercise = await Exercise.pullOne(id, db);
                        if (!exercise) return;

                        exercise.volumeType = volumeType;
                        exercise.intensityTypes = intensityTypes;
                        exercise.sets = sets;

                        return exercise;
                    }
                )
            )).filter(x => x !== undefined);

            await Exercise.saveMany(db, exercises);
        } catch (error) {
            console.error("Error applying set changes:", error);
        }
    }

    serialize(): RawLog {
        return {
            date: serializeDate(this.date),
            routine_name: this.routineName,
            workout_name: this.workoutName,
            exercises: JSON.stringify(Object.fromEntries(this.exercises.entries())),
            completion: JSON.stringify(this.completion),
            last_modified: (this.lastModified ?? new Date()).toISOString()
        }
    }
}

function copyExercises(exercises: readonly Exercise[]) {
    return new Map(exercises.map(exercise => [
        exercise.id,
        {
            name: exercise.name,
            volumeType: exercise.volumeType,
            intensityTypes: [...exercise.intensityTypes],
            sets: exercise.sets.map(set => ({ ...set }))
        }
    ]))
}

export interface RawLog {
    date: string;
    routine_name: string;
    workout_name: string;
    exercises: string;
    completion: string;
    last_modified: string;
}

// Maps ID to exercise information
type ExerciseMap = Map<
    string,
    {
        name: string;
        volumeType: VolumeType,
        intensityTypes: IntensityType[];
        sets: Set[];
    }
>;

interface CompletionLog {
    id: string;
    setsCompleted: number;
}