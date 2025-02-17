import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Workout } from '@/lib/data/Workout';
import LabeledTextField from '../controls/LabeledTextField';
import EditModal from './EditModal';
import { StyleSheet } from 'react-native';
import ExerciseSelectModal from './ExerciseSelectModal';
import Separator from '../layout/Separator';
import AddFooter from '../lists/elements/AddFooter';
import { DataItem } from '../lists/SearchableList';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list'
import ReorderableEntry from './elements/ReorderableEntry';

interface Props {
    workout: Workout | null;
    visible: boolean;
    onClose: () => unknown;
}

export default function WorkoutModal({ workout, visible, onClose }: Props) {
    const db = useSQLiteContext();
    const [curWorkout, setCurWorkout] = useState<WorkoutData>(workoutOrDefault);
    const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
    
    // Reset state when a new workout is provided
    useEffect(() => setCurWorkout(workoutOrDefault), [workout]);

    function workoutOrDefault() {
        return {
            name: workout?.name ?? '',
            exercises: workout?.exercises.map(({ id, name }) => ({ id, name })) ?? []
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
            <ReorderableList
                data={ curWorkout.exercises }
                keyExtractor={ (e, i) => `${e.id}-${i}` }
                onReorder={({ from, to }) => setCurWorkout({
                    ...curWorkout,
                    exercises: reorderItems(curWorkout.exercises, from, to)
                })}
                ItemSeparatorComponent={ Separator }
                contentContainerStyle={ styles.exerciseListContainer }
                renderItem={({ item, index }) => 
                    <ReorderableEntry 
                        item={ item }
                        index={ index }
                        onRemove={() => setCurWorkout({
                            ...curWorkout,
                            exercises: curWorkout.exercises.filter((_, i) => i !== index)
                        })} />
                }
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