import { SQLiteDatabase } from 'expo-sqlite';
import { Workout } from './Workout';
import { serializeDate, deserializeDate } from './dates';
import { Routine } from './Routine'; // newly imported

export class WorkoutLog {
    date: Date;
    routineName: string;
    workoutName: string;
    exercises: Map<string, boolean>;

    constructor(date: Date, workout: Workout, routineName: string);
    constructor(date: Date, exercises: Map<string, boolean>, routineName: string, workoutName: string);
    constructor(date: Date, second: Map<string, boolean> | Workout, routineName?: string, workoutName?: string) {
        this.date = date;
        if (second instanceof Workout) {
            this.workoutName = second.name;
            this.routineName = routineName!;
            this.exercises = new Map<string, boolean>();
            for (const exercise of second.exercises) {
                this.exercises.set(exercise.name, false);
            }
        } else {
            this.exercises = second;
            this.routineName = routineName!;
            this.workoutName = workoutName!;
        }
    }

    static async init(db: SQLiteDatabase) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS workout_logs (
                date TEXT PRIMARY KEY NOT NULL,
                exercises TEXT,
                routine_name TEXT,
                workout_name TEXT
            );
        `);
    }

    static async getLog(date: Date, db: SQLiteDatabase) {
        const result = await db.getFirstAsync<{ exercises: string, routine_name: string, workout_name: string }>(`
            SELECT exercises, routine_name, workout_name FROM workout_logs WHERE date = ?
        `, serializeDate(date));
        if (!result) return null;

        const deserialized: [string, boolean][] = result.exercises
            .split(';')
            .map(pair => pair.split(':', 2))
            .map(([ name, done ]) => [name, done === 'true']);
        
        return new WorkoutLog(date, new Map(deserialized), result.routine_name, result.workout_name);
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
        const serialized = Array.from(this.exercises)
            .map(([ name, done ]) => `${name}:${done}`)
            .join(';');
        const resolver = overwrite ? 'REPLACE' : 'IGNORE';
        
        await db.runAsync(`
            INSERT OR ${resolver} INTO workout_logs (date, exercises, routine_name, workout_name)
                VALUES ($date, $exercises, $routineName, $workoutName);
        `, {
            $date: serializeDate(this.date), 
            $exercises: serialized,
            $routineName: this.routineName,
            $workoutName: this.workoutName
        });
    }
}