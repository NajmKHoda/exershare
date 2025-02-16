import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Workout } from '@/lib/data/Workout';
import LabeledTextField from '../controls/LabeledTextField';
import EditModal from './EditModal';
import { Pressable, StyleSheet, View } from 'react-native';
import ExerciseSelectModal from './ExerciseSelectModal';
import Separator from '../layout/Separator';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import ThemeText from '../theme/ThemeText';
import AddFooter from '../lists/elements/AddFooter';
import { DataItem } from '../lists/SearchableList';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { SymbolView } from 'expo-symbols';

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

    const renderItem = ({ item, drag, getIndex }: RenderItemParams<DataItem>) => {
        const index = getIndex();
        if (index === undefined) return null;

        return (
            <View style={[ styles.exerciseContainer, { backgroundColor: colors.backgroundSecondary } ]}>
                <Pressable onLongPress={ drag } style={ styles.exerciseDragHandle }>
                    <SymbolView name='chevron.up.chevron.down' size={ 24 } tintColor={ colors.primary as string } />
                    <ThemeText style={ styles.exerciseText }>{ item.name }</ThemeText>
                </Pressable>
                <Pressable onPress={() => {
                    console.log(`foo; ${index}`);
                    setCurWorkout({ 
                        ...curWorkout, 
                        exercises: curWorkout.exercises.filter((_, i) => i !== index)
                    });
                }}>
                    <SymbolView name='xmark.circle.fill' size={ 24 } tintColor={ colors.red as string } />
                </Pressable>
            </View>
        );
    };

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
            <DraggableFlatList
                data={ curWorkout.exercises }
                keyExtractor={ (_, i) => i.toString() }
                onDragEnd={ ({ data }) => setCurWorkout({ ...curWorkout, exercises: data }) }
                ItemSeparatorComponent={ Separator }
                contentContainerStyle={ styles.exerciseListContainer }
                renderItem={ renderItem }
                ListFooterComponent={(
                    <AddFooter onAdd={ () => setExerciseModalVisible(true) } />
                )} />
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
        padding: 12
    },

    exerciseDragHandle: {
        flex: 1,
        flexDirection: 'row',
        gap: 10
    },

    exerciseText: {
        fontSize: 20
    }
});

interface WorkoutData {
    name: string,
    exercises: DataItem[]
}