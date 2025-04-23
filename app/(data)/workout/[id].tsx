import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Workout } from '@/lib/data/Workout';
import EntityDetailScreen from '@/lib/components/screens/EntityDetailScreen';
import LabeledTextField from '@/lib/components/controls/LabeledTextField';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';
import { DataItem } from '@/lib/components/lists/SearchableList';
import Separator from '@/lib/components/layout/Separator';
import ReorderableEntry from '@/lib/components/modals/elements/ReorderableEntry';
import AddFooter from '@/lib/components/lists/elements/AddFooter';
import ExerciseSelectModal from '@/lib/components/modals/ExerciseSelectModal';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

export default function WorkoutScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const colors = useThemeColors();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [currentState, setCurrentState] = useState({
        name: '',
        exercises: [] as DataItem[]
    });
    const [exerciseModalVisible, setExerciseModalVisible] = useState(false);

    // Load workout if id is provided
    useEffect(() => {
        async function loadWorkout() {
            if (id === 'new') return;
            
            try {
                const loadedWorkout = await Workout.pullOne(parseInt(id), db);
                if (loadedWorkout) {
                    setWorkout(loadedWorkout);
                    setCurrentState({
                        name: loadedWorkout.name,
                        exercises: loadedWorkout.exercises.map(({ id, name }) => ({ id, name }))
                    });
                }
            } catch (error) {
                console.error('Failed to load workout:', error);
                router.back();
            }
        }
        
        loadWorkout();
    }, [id, db]);

    async function handleSave() {
        try {
            const exerciseIds = currentState.exercises.map(({ id }) => id);

            if (workout) {
                // Update existing workout
                const updatedWorkout = new Workout(
                    workout.id,
                    currentState.name,
                    exerciseIds
                );
                await updatedWorkout.save(db);
            } else {
                // Create new workout
                await Workout.create(
                    currentState.name,
                    exerciseIds,
                    db
                );
            }
            router.back();
        } catch (error) {
            console.error('Failed to save workout:', error);
        }
    }

    async function handleDelete() {
        if (workout) {
            try {
                await workout.delete(db);
                router.back();
            } catch (error) {
                console.error('Failed to delete workout:', error);
            }
        }
    }

    return (
        <EntityDetailScreen title='Workout' isNewEntity={id === 'new'} onSave={handleSave} onDelete={handleDelete}>
            <LabeledTextField
                name="Name"
                initialValue={currentState.name}
                onValueChange={name => setCurrentState({ ...currentState, name })}
            />
            <ReorderableList
                data={currentState.exercises}
                keyExtractor={(e, i) => `${e.id}-${i}`}
                onReorder={({ from, to }) => setCurrentState({
                    ...currentState,
                    exercises: reorderItems(currentState.exercises, from, to)
                })}
                ItemSeparatorComponent={Separator}
                contentContainerStyle={styles.exerciseListContainer}
                renderItem={({ item, index }) => 
                    <ReorderableEntry 
                        item={item}
                        index={index}
                        onRemove={() => setCurrentState({
                            ...currentState,
                            exercises: currentState.exercises.filter((_, i) => i !== index)
                        })} />
                }
                ListFooterComponent={(
                    <AddFooter onAdd={() => setExerciseModalVisible(true)} />
                )} 
            />
            
            <ExerciseSelectModal
                visible={exerciseModalVisible}
                onAdd={exercises => setCurrentState({
                    ...currentState,
                    exercises: currentState.exercises.concat(exercises)
                })}
                onClose={() => setExerciseModalVisible(false)}
            />
        </EntityDetailScreen>
    );
}

const styles = StyleSheet.create({
    exerciseListContainer: {
        borderRadius: 10,
        overflow: 'hidden'
    }
});