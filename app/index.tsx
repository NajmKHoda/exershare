import LabelButton from '@/lib/components/controls/LabelButton';
import ExerciseList from '@/lib/components/lists/ExerciseList/ExerciseList';
import RoutineHeader from '@/lib/components/RoutineHeader';
import ThemeText from '@/lib/components/theme/ThemeText';
import { Exercise } from '@/lib/data/Exercise';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, StyleSheet, View } from 'react-native';
import { useState, useEffect } from 'react';

export default function Index() {
    const themeColors = useThemeColors();
    const db = useSQLiteContext();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    
    useEffect(() => {
        (async () => {
            const result = await db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY id');
            setExercises(result)
        })();
    }, []); 

    return (
        <View style={{ backgroundColor: themeColors.background, ...styles.container }}>
            <RoutineHeader />
            <View style={ styles.body }>
                <View style={ styles.entryOptions }>
                    <LabelButton symbolName='play.fill' label='Exercise Mode' />
                    <LabelButton symbolName='note.text' label='Manual Entry' />
                </View>
                <View>
                    <ThemeText style={ styles.exerciseCaption }>EXERCISES</ThemeText>
                    <View>
                        <ExerciseList exercises={ exercises } />
                    </View>
                </View>
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