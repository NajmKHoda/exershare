import RoutineHeader from '@/lib/components/RoutineHeader';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { ActivityIndicator, Button, StyleSheet, View, Pressable } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import RestDayPlaceholder from '@/lib/components/RestDayPlaceholder';
import { WorkoutLog } from '@/lib/data/WorkoutLog';
import { useSQLiteContext } from 'expo-sqlite';
import ExerciseView, { ExerciseInfo } from '@/lib/components/lists/ExerciseList/ExerciseView';
import { Play } from 'lucide-react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Routine } from '@/lib/data/Routine';
import { Workout } from '@/lib/data/Workout';
import StandardList from '@/lib/components/lists/StandardList';

export default function Index() {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    const db = useSQLiteContext();
    const [activeRoutine, setActiveRoutine] = useState<LoadState<Routine>>({
        current: null,
        loading: true
    });
    useFocusEffect(
        useCallback(() => {
            getTodayLog();
            Routine.pullActive(db)
                .then(routine => setActiveRoutine({ current: routine, loading: false }))
                .catch(() => setActiveRoutine({ current: null, loading: false }));
        }, [db])
    )

    // Date values for the current view
    const [date, setDate] = useState<Date>(new Date());
    const dateTimestamp = new Date(date).setHours(0, 0, 0, 0);
    const todayTimestamp = new Date().setHours(0, 0, 0, 0);
    
    // Loads the log of the view date from the database
    const [log, setLog] = useState<LoadState<WorkoutLog>>({
        current: null,
        loading: true
    });
    const useLog = dateTimestamp <= todayTimestamp;
    const isToday = dateTimestamp === todayTimestamp;

    useEffect(() => {
        // If the date is in the future, don't load a log
        if (!useLog) {
            setLog({ current: null, loading: false });
            return;
        }
        getTodayLog();
    }, [dateTimestamp]);

    // Update logs when the today-date changes
    useEffect(() => {
        if (activeRoutine.loading) return;
        WorkoutLog.updateLogs(activeRoutine.current, db)
            .finally(() => getTodayLog());
    }, [todayTimestamp, activeRoutine]);

    // Populate information for the view date
    let exerciseList: ExerciseInfo[];
    let routineName: string;
    let workoutName: string;
    let workout: Workout | null = null;
    if (!useLog) {
        const weekDay = date.getDay();
        workout = activeRoutine.current?.workouts[weekDay] ?? null;

        // Get projected workout for this future date
        exerciseList = workout?.exercises.map(x => ({
            name: x.name,
            completion: 'incomplete'
        })) ?? [];
        routineName = activeRoutine.current?.name ?? 'No Routine';
        workoutName = workout?.name ?? 'Rest Day';
    } else {
        // Retrieve information from the log
        exerciseList = log.current?.completion.map(({ id, setsCompleted }) => {
            const exercise = log.current?.exercises.get(id)!;
            const listEntry: ExerciseInfo = {
                name: exercise.name,
                completion: 'in-progress'
            };

            if (setsCompleted >= exercise.sets.length) {
                listEntry.completion = 'complete';
            } else if (setsCompleted === 0) {
                listEntry.completion = 'incomplete';
            }

            return listEntry;
        }) ?? [];
        routineName = log.current?.routineName ?? 'No Routine';
        workoutName = log.current?.workoutName ?? 'Rest Day';
    }

    function onDayChange(amount: number) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + amount);
        setDate(newDate);
        setLog({ current: null, loading: true });
    }

    function getTodayLog() {
        WorkoutLog.getLog(date, db)
            .then(loadedLog => setLog({ current: loadedLog, loading: false }))
            .catch(() => setLog({ current: null, loading: false }));
    }

    let body: React.ReactNode;
    let loading = (useLog && log.loading) || (!useLog && activeRoutine.loading);
    let showPlaceholder = (useLog && !log.current) || (!useLog && !workout);
    if (loading) {
        body = <ActivityIndicator size='large' color={colors.primary} />;
    } else if (showPlaceholder) {
        body = <RestDayPlaceholder />;
    } else {
        body = (
            <>
                <View style={ resolvedStyles.entryOptions }>
                    <Link href='/workout-progress' asChild>
                        <Pressable
                            style={isToday ? resolvedStyles.startButton : {
                                ...resolvedStyles.startButton,
                                ...resolvedStyles.startButtonDisabled
                            }}
                            disabled={!isToday}
                        >
                            <Play color={colors.primary} size={24} />
                            <Text style={resolvedStyles.startButtonText}>Exercise Mode</Text>
                        </Pressable>
                    </Link>
                </View>
                <View>
                    <Text style={ resolvedStyles.exerciseCaption }>EXERCISES</Text>
                    <StandardList
                        data={ exerciseList }
                        renderItem={ x => <ExerciseView exercise={ x.item } /> }
                        keyExtractor={ (_, i) => i.toString() } />
                </View>
                <Button title='Routine Options' />
            </>
        )
    }

    return (
        <View style={resolvedStyles.container}>
            <RoutineHeader
                routineName={ routineName }
                workoutName={ workoutName }
                date = { date }
                onDayChange={ onDayChange }/>
            <View style={ loading ? resolvedStyles.loadingBody : resolvedStyles.body }>
                { body }
            </View>
        </View>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'stretch',
        backgroundColor: colors.background
    },

    body: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 30,
    },

    loadingBody: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 30,
    },

    entryOptions: {
        flexDirection: 'row',
        gap: 5
    },

    exerciseList: {
        alignItems: 'stretch',
        gap: 5,
    },

    exerciseCaption: {
        textAlign: 'center',
        paddingBottom: 10
    },

    startButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        gap: 5,
        backgroundColor: colors.accent
    },

    startButtonDisabled: {
        backgroundColor: colors.gray
    },

    startButtonText: {
        fontSize: 16,
        color: colors.primary
    }
});

type LoadState<T> = {
    current: T | null;
    loading: false;
} | {
    current: null;
    loading: true;
}