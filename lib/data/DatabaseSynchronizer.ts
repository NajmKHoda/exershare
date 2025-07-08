import { useNetworkState } from 'expo-network';
import { useEffect } from 'react';
import { syncData } from './sync';
import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useSession } from '../hooks/useSession';
import { supabase } from '../supabase';
import { Exercise } from './Exercise';
import { Workout } from './Workout';
import { Routine } from './Routine';

export default function DatabaseSynchronizer() {
    const db = useSQLiteContext();
    const { session, isSessionLoading } = useSession();
    const { isInternetReachable } = useNetworkState();

    useEffect(() => {
        if (isInternetReachable && session) {
            syncData(db);
        }
    }, [isInternetReachable, session, isSessionLoading, db]);

    useEffect(() => {
        const channel = supabase.channel('remote_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'exercises'
                },
                (payload) => handleExerciseChange(payload, db)
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workouts'
                },
                (payload) => handleWorkoutChange(payload, db)
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'routines'
                },
                (payload) => handleRoutineChange(payload, db)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [db, session]);

    return null;
}

async function handleExerciseChange(payload: any, db: SQLiteDatabase) {
    switch (payload.eventType) {
        case 'INSERT':
        case 'UPDATE':
            const newExercise = payload.new;
            const exercise = new Exercise(newExercise);
            await exercise.save(db, new Date(newExercise.last_modified), true);
            break;
        case 'DELETE':
            const deletedExercise = payload.old;
            await db.runAsync(`DELETE FROM exercises WHERE id = ?`, deletedExercise.id);
    }
}

async function handleWorkoutChange(payload: any, db: SQLiteDatabase) {
    switch (payload.eventType) {
        case 'INSERT':
        case 'UPDATE':
            const newWorkout = payload.new;
            const exerciseIds = (await supabase.from('exercise_instances')
                .select('exercise_id')
                .eq('workout_id', newWorkout.id)
                .order('position', { ascending: true }))
                .data?.map(instance => instance.exercise_id as string) || [];

            const workout = new Workout(newWorkout.id, newWorkout.name, exerciseIds, newWorkout.last_modified);
            await workout.save(db, new Date(newWorkout.last_modified), true);
            break;
        case 'DELETE':
            const deletedWorkout = payload.old;
            await db.runAsync(`DELETE FROM workouts WHERE id = ?`, deletedWorkout.id);
    }
}

async function handleRoutineChange(payload: any, db: SQLiteDatabase) {
    switch (payload.eventType) {
        case 'INSERT':
        case 'UPDATE':
            const newRoutine = payload.new;
            const workoutIdsUnordered = (await supabase.from('workout_instances')
                .select('workout_id, position')
                .eq('routine_id', newRoutine.id))
                .data ?? [];

            const orderedWorkoutIds = new Array(7).fill(null);
            for (const workout of workoutIdsUnordered) {
                orderedWorkoutIds[workout.position] = workout.workout_id;
            }

            const routine = new Routine(newRoutine.id, newRoutine.name, orderedWorkoutIds, newRoutine.last_modified);
            await routine.save(db, new Date(newRoutine.last_modified), true);
            break;
        case 'DELETE':
            const deletedRoutine = payload.old;
            await db.runAsync(`DELETE FROM routines WHERE id = ?`, deletedRoutine.id);
    }
}