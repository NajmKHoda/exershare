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

    const lastSyncDate = lastSyncResult ? new Date(lastSyncResult.last_sync_date).toISOString() : null;

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

    const { newExercises, newWorkouts, newRoutines } = data;
    
    await Exercise.saveMany(db, newExercises.map(re => new Exercise(re)), false, true);
    await Workout.saveMany(db, newWorkouts.map(rw => new Workout(
        rw.id,
        rw.name,
        rw.exercise_ids,
        rw.last_modified ? new Date(rw.last_modified) : null
    )), false, true);

    for (const routine of data.newRoutines) {
        const newRoutine = new Routine(routine.id, routine.name, routine.workout_ids);
        await newRoutine.save(db, new Date(routine.last_modified!), true);
    }

    // Delete entities that were removed remotely
    if (data.deletedExercises.length > 0) {
        const deleteExerciseStmt = await db.prepareAsync('DELETE FROM exercises WHERE id = ?');
        for (const exerciseId of data.deletedExercises) {
            await deleteExerciseStmt.executeAsync(exerciseId);
        }
        await deleteExerciseStmt.finalizeAsync();
    }

    if (data.deletedWorkouts.length > 0) {
        const deleteWorkoutStmt = await db.prepareAsync('DELETE FROM workouts WHERE id = ?');
        for (const workoutId of data.deletedWorkouts) {
            await deleteWorkoutStmt.executeAsync(workoutId);
        }
        await deleteWorkoutStmt.finalizeAsync();
    }

    if (data.deletedRoutines.length > 0) {
        const deleteRoutineStmt = await db.prepareAsync('DELETE FROM routines WHERE id = ?');
        for (const routineId of data.deletedRoutines) {
            await deleteRoutineStmt.executeAsync(routineId);
        }
        await deleteRoutineStmt.finalizeAsync();
    }

    await db.runAsync(`
        UPDATE user SET last_sync_date = ?;

        UPDATE exercises SET dirty = 0 WHERE dirty = 1;
        UPDATE workouts SET dirty = 0 WHERE dirty = 1;
        UPDATE routines SET dirty = 0 WHERE dirty = 1;

        DELETE FROM deleted_exercises;
        DELETE FROM deleted_workouts;
        DELETE FROM deleted_routines;
    `, new Date().toISOString());
}

type SyncResult = {
    newExercises: RawExercise[];
    newWorkouts: (RawWorkout & { exercise_ids: string[] })[];
    newRoutines: (RawRoutine & { workout_ids: string[] })[];
    deletedExercises: string[];
    deletedWorkouts: string[];
    deletedRoutines: string[];
}