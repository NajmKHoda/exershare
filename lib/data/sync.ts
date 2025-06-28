import { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';
import { Exercise, RawExercise } from './Exercise';
import { RawWorkout, Workout } from './Workout';
import { RawRoutine, Routine } from './Routine';
import { supabase } from '../supabase';

export async function syncData(db: SQLiteDatabase) {
    const [
        lastSyncResult,
        dirtyExercises,
        removedExercises,
        dirtyWorkouts,
        removedWorkouts,
        dirtyRoutines,
        removedRoutines
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
        _deleted_exercises: removedExercises,
        _workouts: dirtyWorkouts.map(workout => workout.toJSON()),
        _deleted_workouts: removedWorkouts,
        _routines: dirtyRoutines.map(routine => routine.toJSON()),
        _deleted_routines: removedRoutines
    }) as { data: SyncResult, error: any };

    if (error) {
        console.error('Error syncing exercises:', error);
        return;
    }

    const {
        newExercises,
        newWorkouts,
        newRoutines,
        deletedExercises,
        deletedRoutines,
        deletedWorkouts
    } = data;

    await Exercise.saveMany(db, newExercises.map(re => new Exercise(re)), false, true);
    await Workout.saveMany(db, newWorkouts.map(rw => new Workout(
        rw.id,
        rw.name,
        rw.exercise_ids,
        new Date(rw.last_modified!)
    )), false, true);
    await Routine.saveMany(db, newRoutines.map(rr => new Routine(
        rr.id,
        rr.name,
        rr.workout_ids,
        new Date(rr.last_modified!)
    )), false, true);

    // Delete entities that were removed remotely
    let deleteExerciseStatement: SQLiteStatement | null = null;
    let deleteWorkoutStatement: SQLiteStatement | null = null;
    let deleteRoutineStatement: SQLiteStatement | null = null;
    try {
        deleteExerciseStatement = await db.prepareAsync('DELETE FROM exercises WHERE id = ?');
        deleteWorkoutStatement = await db.prepareAsync('DELETE FROM workouts WHERE id = ?');
        deleteRoutineStatement = await db.prepareAsync('DELETE FROM routines WHERE id = ?');

        await Promise.all(
            deletedExercises.map(exerciseId => deleteExerciseStatement!.executeAsync(exerciseId))
            .concat(deletedWorkouts.map(workoutId => deleteWorkoutStatement!.executeAsync(workoutId)))
            .concat(deletedRoutines.map(routineId => deleteRoutineStatement!.executeAsync(routineId)))
        );
    } catch (error) {
        console.error('Error deleting entities:', error);
    } finally {
        deleteExerciseStatement?.finalizeAsync();
        deleteWorkoutStatement?.finalizeAsync();
        deleteRoutineStatement?.finalizeAsync();
    }

    try {
        await db.runAsync(`
            UPDATE user SET last_sync_date = ?;

            UPDATE exercises SET dirty = 0 WHERE dirty = 1;
            UPDATE workouts SET dirty = 0 WHERE dirty = 1;
            UPDATE routines SET dirty = 0 WHERE dirty = 1;

            DELETE FROM deleted_exercises;
            DELETE FROM deleted_workouts;
            DELETE FROM deleted_routines;
        `, new Date().toISOString());
    } catch (error) {
        console.error('Error finalizing sync:', error);
    }
}

type SyncResult = {
    newExercises: RawExercise[];
    newWorkouts: (RawWorkout & { exercise_ids: string[] })[];
    newRoutines: (RawRoutine & { workout_ids: string[] })[];
    deletedExercises: string[];
    deletedWorkouts: string[];
    deletedRoutines: string[];
}