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

export default function Index() {
    const themeColors = useThemeColors();
    const { activeRoutine } = useActiveRoutine();

    const db = useSQLiteContext();
    const [date, setDate] = useState<Date>(new Date());

    // For updating logs
    const todayTimestamp = new Date().setHours(0, 0, 0, 0);
    useEffect(() => {
        WorkoutLog.updateLogs(activeRoutine, db);
    }, [todayTimestamp]);

    const weekDay = date.getDay();
    const workout = activeRoutine?.workouts[weekDay];
    const exerciseList = workout?.exercises ?? [];

    function onDayChange(amount: number) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + amount);
        setDate(newDate);
    }

    return (
        <View style={{ backgroundColor: themeColors.background, ...styles.container }}>
            <RoutineHeader
                routineName={ activeRoutine?.name ?? '' }
                workoutName={ workout?.name ?? 'Rest Day' }
                date = { date }
                onDayChange={ onDayChange }/>
            <View style={ styles.body }>
            { workout ?
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
                :
                <RestDayPlaceholder />
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