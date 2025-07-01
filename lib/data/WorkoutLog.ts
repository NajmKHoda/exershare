import { SQLiteDatabase } from 'expo-sqlite';
import { Workout } from './Workout';
import { serializeDate, deserializeDate } from './dates';
import { Routine } from './Routine'; // newly imported
import { Exercise, IntensityType, Set, VolumeType } from './Exercise';

export class WorkoutLog {
    date: Date;
    routineName: string;
    workoutName: string;
    exercises: ExerciseMap;
    completion: CompletionLog[];

    constructor(rawLog: RawLog);
    constructor(date: Date, workout: Workout, routineName: string);
    constructor(
        date: Date,
        routineName: string,
        workoutName: string,
        exercises: ExerciseMap,
        completion: CompletionLog[],
    );
    constructor(
        first: Date | RawLog,
        second?: string | Workout,
        third?: string,
        exercises?: ExerciseMap,
        completion?: CompletionLog[]
    ) {
        if (first instanceof Date) {
            this.date = first;
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
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS workout_logs (
                date TEXT PRIMARY KEY NOT NULL,
                routine_name TEXT NOT NULL,
                workout_name TEXT NOT NULL,
                exercises TEXT NOT NULL,
                completion TEXT NOT NULL
            );
        `);
    }

    static async getLog(date: Date, db: SQLiteDatabase) {
        const result = await db.getFirstAsync<RawLog>(`
            SELECT * FROM workout_logs WHERE date = ?
        `, serializeDate(date));

        return result ? new WorkoutLog(result) : null;
    }

    static async updateLogs(activeRoutine: Routine | null, db: SQLiteDatabase) {
        const todayTimestamp = new Date().setHours(0, 0, 0, 0);
        const result = await db.getFirstAsync<{ last_log_date: string }>(`
            SELECT last_log_date FROM user;
        `);
        const lastLogTimestamp = result ? deserializeDate(result.last_log_date).getTime() : todayTimestamp;

        // This probably only happens due to time zone differences(?)
        if (lastLogTimestamp > todayTimestamp) return;

        // Update the last log date
        if (lastLogTimestamp < todayTimestamp) {
            const dateString = serializeDate(new Date());
            await db.runAsync(`UPDATE user SET last_log_date = ?`, dateString);
        }
		
        if (!activeRoutine) return;
		
        let curDate = new Date(lastLogTimestamp);
        curDate.setHours(0, 0, 0, 0);
		
        while (curDate.getTime() <= todayTimestamp) {
            const curWorkout = activeRoutine.workouts[curDate.getDay()];
            if (curWorkout) {
                const log = new WorkoutLog(new Date(curDate), curWorkout, activeRoutine.name);
                await log.save(db, false);
            }

            curDate.setDate(curDate.getDate() + 1);
        }
    }

    async save(db: SQLiteDatabase, overwrite: boolean = true) {
        const serializedExercises = JSON.stringify(Object.fromEntries(this.exercises.entries()));
        const serializedCompletion = JSON.stringify(this.completion);
        const resolver = overwrite ? 'REPLACE' : 'IGNORE';
        
        await db.runAsync(`
            INSERT OR ${resolver} INTO workout_logs (date, routine_name, workout_name, exercises, completion)
            VALUES ($date, $routineName, $workoutName, $exercises, $completion);
        `, {
            $date: serializeDate(this.date),
            $routineName: this.routineName,
            $workoutName: this.workoutName,
            $exercises: serializedExercises,
            $completion: serializedCompletion
        });
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

interface RawLog {
    date: string;
    routine_name: string;
    workout_name: string;
    exercises: string;
    completion: string;
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