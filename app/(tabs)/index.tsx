import LabelButton from '@/lib/components/controls/LabelButton';
import ExerciseList from '@/lib/components/lists/ExerciseList/ExerciseList';
import RoutineHeader from '@/lib/components/RoutineHeader';
import ThemeText from '@/lib/components/theme/ThemeText';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Button, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import RestDayPlaceholder from '@/lib/components/RestDayPlaceholder';
import { useActiveRoutine } from '@/lib/hooks/useActiveRoutine';
import { WorkoutLog } from '@/lib/data/WorkoutLog';
import { useSQLiteContext } from 'expo-sqlite';
import { ExerciseInfo } from '@/lib/components/lists/ExerciseList/ExerciseView';

export default function Index() {
    const themeColors = useThemeColors();
    const { activeRoutine } = useActiveRoutine();

    // Date values for the current view
    const [date, setDate] = useState<Date>(new Date());
    const dateTimestamp = new Date(date).setHours(0, 0, 0, 0);
    const todayTimestamp = new Date().setHours(0, 0, 0, 0);

    // Loads the log of the view date from the database
    const db = useSQLiteContext();
    const [log, setLog] = useState<WorkoutLog | null>(null);
    useEffect(() => {
        // If the date is in the future, don't load a log
        if (dateTimestamp > todayTimestamp) {
            setLog(null);
            return;
        }

        async function loadLog() {
            const loadedLog = await WorkoutLog.getLog(date, db);
            setLog(loadedLog);
        }
        loadLog();
    }, [date.getTime()]);

    // Update logs when the today-date changes
    useEffect(() => {
        WorkoutLog.updateLogs(activeRoutine, db);
    }, [todayTimestamp, activeRoutine?.id]);

    // Populate information for the view date
    let exerciseList: ExerciseInfo[];
    let routineName: string;
    let workoutName: string;
    let showPlaceholder: boolean;
    if (dateTimestamp > todayTimestamp) {
        const weekDay = date.getDay();
        const workout = activeRoutine?.workouts[weekDay];

        // Get projected workout for this future date
        exerciseList = workout?.exercises.map(x => ({
            name: x.name,
            completion: 'incomplete'
        })) ?? [];
        routineName = activeRoutine?.name ?? 'No Routine';
        workoutName = workout?.name ?? 'Rest Day';
        showPlaceholder = !workout;
    } else {
        // Retrieve information from the log
        exerciseList = Array.from(log?.exercises ?? []).map(([name, completed]) => ({
            name,
            completion: completed ? 'complete' : 'incomplete'
        }));
        routineName = log?.routineName ?? 'No Routine';
        workoutName = log?.workoutName ?? 'Rest Day';
        showPlaceholder = !log;
    }

    function onDayChange(amount: number) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + amount);
        setDate(newDate);
    }

    return (
        <View style={{ backgroundColor: themeColors.background, ...styles.container }}>
            <RoutineHeader
                routineName={ routineName }
                workoutName={ workoutName }
                date = { date }
                onDayChange={ onDayChange }/>
            <View style={ styles.body }>
            { showPlaceholder ?
                <RestDayPlaceholder />
                :
                <>
                    <View style={ styles.entryOptions }>
                        <LabelButton symbolName='play.fill' label='Exercise Mode' />
                        <LabelButton symbolName='note.text' label='Manual Entry' />
                    </View>
                    <View>
                        <ThemeText style={ styles.exerciseCaption }>EXERCISES</ThemeText>
                        <View>
                            <ExerciseList exercises={ exerciseList } />
                        </View>
                    </View>
                </>
            }
                <Button title='Routine Options' />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'stretch'
    },

    body: {
        flex: 1,
        justifyContent: 'space-between',
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
    }
});