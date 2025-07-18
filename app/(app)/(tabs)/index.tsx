import RoutineHeader from '@/lib/components/RoutineHeader';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { ActivityIndicator, Button, StyleSheet, View, Pressable } from 'react-native';
import React, { useCallback, useState } from 'react';
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
            getLog();
            Routine.pullActive(db)
                .then(routine => setActiveRoutine({ current: routine, loading: false }))
                .catch(() => setActiveRoutine({ current: null, loading: false }));
        }, [db])
    )

    // Date values for the current view
    const [date, setDate] = useState<Date>(new Date(
        new Date().setHours(0, 0, 0, 0)
    ));
    const dateTimestamp = date.getTime();

    const today = () => new Date().setHours(0, 0, 0, 0);
    const renderToday = today();
    const isToday = dateTimestamp === renderToday;

    // Loads the log of the view date from the database
    const [log, setLog] = useState<LoadState<WorkoutLog>>({
        current: null,
        loading: true
    });
    
    // The log should only be used if:
    //   - We are in the past, or
    //   - We are looking at today's date and the log (might) exist.
    const useLog = dateTimestamp < renderToday ||
        (isToday && (log.loading || log.current));

    // Populate information for the view date
    let exerciseList: ExerciseInfo[];
    let routineName: string;
    let workoutName: string;
    let workout: Workout | null = null;
    if (!useLog || (isToday && !log.current)) {
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
        routineName = log.current?.routineName ?? 'No Data';
        workoutName = log.current?.workoutName ?? 'No Data';
    }

    function onDayChange(amount: number) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + amount);

        setDate(newDate);
        getLog(newDate);
    }

    function getLog(logDate: Date = date) {
        // If the log date is in the future, do not load it
        if (logDate.getTime() > today()) {
            setLog({ current: null, loading: false });
            return;
        }

        // Load the log for the specified date
        setLog({ current: null, loading: true });
        WorkoutLog.getLog(logDate, db)
            .then(loadedLog => setLog({ current: loadedLog, loading: false }))
            .catch(err => setLog({ current: null, loading: false }));
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