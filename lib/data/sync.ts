import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise, RawExercise } from './Exercise';
import { RawWorkout, Workout } from './Workout';
import { RawRoutine, Routine } from './Routine';
import { supabase } from '../supabase';

export async function syncData(db: SQLiteDatabase) {
    const [
        lastSyncResult,
        dirtyExercises,
        deletedExercises,
        dirtyWorkouts,
        deletedWorkouts,
        dirtyRoutines,
        deletedRoutines
    ] = await Promise.all([
        db.getFirstAsync<{ last_sync_date: string }>('SELECT last_sync_date FROM user'),

        Exercise.pullMany(db, 'dirty = 1'),
        db.getAllAsync<{ id: string, deleted_at: string }>('SELECT * FROM deleted_exercises'),

        Workout.pullMany(db, 'dirty = 1', false),
        db.getAllAsync<{ id: string, deleted_at: string }>('SELECT * FROM deleted_workouts'),

        Routine.pullMany(db, 'dirty = 1', false),
        db.getAllAsync<{ id: string, deleted_at: string }>('SELECT * FROM deleted_routines')
    ])

    const lastSyncDate = lastSyncResult ? new Date(lastSyncResult.last_sync_date) : null;

    const { data, error } = await supabase.rpc('sync', {
        _last_sync_date: lastSyncDate,
        _exercises: dirtyExercises.map(exercise => exercise.serialize()),
        _deleted_exercises: deletedExercises,
        _workouts: dirtyWorkouts.map(workout => workout.toJSON()),
        _deleted_workouts: deletedWorkouts,
        _routines: dirtyRoutines.map(routine => routine.toJSON()),
        _deleted_routines: deletedRoutines
    }) as { data: SyncResult, error: any };

    if (error) {
        console.error('Error syncing exercises:', error);
        return;
    }
    
    for (const exercise of data.newExercises) {
        await new Exercise(exercise).save(db, new Date(exercise.last_modified));
    }

    for (const workout of data.newWorkouts) {
        const newWorkout = new Workout(workout.id, workout.name, workout.exercise_ids);
        await newWorkout.save(db, new Date(workout.last_modified));
    }

    for (const routine of data.newRoutines) {
        const newRoutine = new Routine(routine.id, routine.name, routine.workout_ids);
        await newRoutine.save(db, new Date(routine.last_modified));
    }

    await db.execAsync(`
        UPDATE user SET last_sync_date = datetime('now');

        UPDATE exercises SET dirty = 0 WHERE dirty = 1;
        UPDATE workouts SET dirty = 0 WHERE dirty = 1;
        UPDATE routines SET dirty = 0 WHERE dirty = 1;

        DELETE FROM deleted_exercises;
        DELETE FROM deleted_workouts;
        DELETE FROM deleted_routines;
    `);
}

type SyncResult = {
    newExercises: RawExercise[];
    newWorkouts: (RawWorkout & { exercise_ids: string[] })[];
    newRoutines: (RawRoutine & { workout_ids: string[] })[];
}