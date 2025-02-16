import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Workout } from '@/lib/data/Workout';
import LabeledTextField from '../controls/LabeledTextField';
import EditModal from './EditModal';
import { FlatList, StyleSheet, View } from 'react-native';
import ExerciseSelectModal from './ExerciseSelectModal';
import Separator from '../layout/Separator';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import ThemeText from '../theme/ThemeText';
import AddFooter from '../lists/elements/AddFooter';
import { DataItem } from '../lists/SearchableList';

interface Props {
    workout: Workout | null;
    visible: boolean;
    onClose: () => unknown;
}

export default function WorkoutModal({ workout, visible, onClose }: Props) {
    const db = useSQLiteContext();
    const [curWorkout, setCurWorkout] = useState<WorkoutData>(workoutOrDefault);
    const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
    const colors = useThemeColors();
    
    // Reset state when a new workout is provided
    useEffect(() => setCurWorkout(workoutOrDefault), [workout]);

    function workoutOrDefault() {
        return {
            name: workout?.name || '',
            exercises: (workout?.exercises.map(({ id, name }) => ({ id, name })) || [])
        };
    }

    async function handleSave() {
        const exerciseIds = curWorkout.exercises.map(({ id }) => id);

        if (workout) {
            const updatedWorkout = new Workout(
                workout.id,
                curWorkout.name,
                exerciseIds
            );
            await updatedWorkout.save(db);
        } else {
            await Workout.create(
                curWorkout.name,
                exerciseIds,
                db
            );
        }

        onClose();
    }

    async function handleDelete() {
        await workout!.delete(db);
        onClose();
    }

    return (
        <EditModal
            visible={ visible }
            onClose={ onClose }
            onSave={ handleSave }
            onDelete={ workout ? handleDelete : undefined }
        >
            <LabeledTextField
                name="Name"
                initialValue={ curWorkout.name }
                onValueChange={ name => setCurWorkout({ ...curWorkout, name }) }
            />
            <FlatList
                data={ curWorkout.exercises }
                keyExtractor={ (_, i) => i.toString() }
                ItemSeparatorComponent={ Separator }
                contentContainerStyle={ styles.exerciseListContainer }
                renderItem={({ item, index }) => (
                    <View style={[ styles.exerciseContainer, { backgroundColor: colors.backgroundSecondary } ]}>
                        <ThemeText>{ index + 1 }. { item.name }</ThemeText>
                    </View>
                )}
                ListFooterComponent={(
                    <AddFooter onAdd={ () => setExerciseModalVisible(true) } />
                )}
                />
            <ExerciseSelectModal
                visible={ exerciseModalVisible }
                onAdd={exercises => setCurWorkout({
                    ...curWorkout,
                    exercises: curWorkout.exercises.concat(exercises)
                })}
                onClose={ () => setExerciseModalVisible(false) }
            />
        </EditModal>
    );
};

const styles = StyleSheet.create({
    exerciseListContainer: {
        borderRadius: 10,
        overflow: 'hidden'
    },

    exerciseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15
    }
});

interface WorkoutData {
    name: string,
    exercises: DataItem[]
}