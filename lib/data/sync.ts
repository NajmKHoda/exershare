import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise, RawExercise } from './Exercise';
import { Workout } from './Workout';
import { Routine } from './Routine';
import { supabase } from '../supabase';

export async function syncData(db: SQLiteDatabase) {
    const [
        lastSyncResult,
        dirtyExercises,
        deletedExercises,
        //dirtyWorkouts,
        //dirtyRoutines
    ] = await Promise.all([
        db.getFirstAsync<{ last_sync_date: string }>('SELECT last_sync_date FROM user'),
        Exercise.pullMany(db, 'dirty = 1'),
        db.getAllAsync<{ id: string, deleted_at: string }>('SELECT * FROM deleted_exercises'),
        //Workout.pullMany(db, 'dirty = 1', false),
        //Routine.pullMany(db, 'dirty = 1', false)
    ])

    const lastSyncDate = lastSyncResult ? new Date(lastSyncResult.last_sync_date) : null;

    console.log(deletedExercises);
    const { data, error } = await supabase.rpc('sync', {
        _last_sync_date: lastSyncDate,
        _exercises: dirtyExercises.map(exercise => exercise.serialize()),
        _deleted_exercises: deletedExercises,
    });

    if (error) {
        console.error('Error syncing exercises:', error);
        return;
    }

    for (const exercise of data) {
        await new Exercise(exercise).save(db, new Date(exercise.last_modified));
    }

    await db.execAsync(`
        UPDATE user SET last_sync_date = datetime('now');
        UPDATE exercises SET dirty = 0 WHERE dirty = 1;
        DELETE FROM deleted_exercises;
    `);
}