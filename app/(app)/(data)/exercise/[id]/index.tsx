import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Exercise } from '@/lib/data/Exercise';
import EntityDetailScreen from '@/lib/components/screens/EntityDetailScreen';
import LabeledTextField from '@/lib/components/controls/LabeledTextField';
import SetList from '@/lib/components/lists/SetList';

export default function ExerciseScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const router = useRouter();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [currentState, setCurrentState] = useState({
        name: '',
        sets: [
            { reps: 12, weight: 25 },
            { reps: 12, weight: 25 },
            { reps: 12, weight: 25 }
        ],
        notes: '',
        categories: [] as string[]
    });

    // Load exercise if id is provided
    useEffect(() => {
        async function loadExercise() {
            if (id === 'new') return;
            
            try {
                const loadedExercise = await Exercise.pullOne(id, db);
                if (loadedExercise) {
                    setExercise(loadedExercise);
                    setCurrentState({
                        name: loadedExercise.name,
                        sets: loadedExercise.sets,
                        notes: loadedExercise.notes,
                        categories: loadedExercise.categories
                    });
                }
            } catch (error) {
                console.error('Failed to load exercise:', error);
                router.back();
            }
        }
        
        loadExercise();
    }, [id, db]);

    async function handleSave() {
        try {
            if (exercise) {
                // Update existing exercise
                const updatedExercise = new Exercise(
                    exercise.id,
                    currentState.name,
                    currentState.sets,
                    currentState.notes,
                    currentState.categories
                );
                await updatedExercise.save(db);
            } else {
                // Create new exercise
                await Exercise.create(
                    currentState.name,
                    currentState.sets,
                    currentState.notes,
                    currentState.categories,
                    db
                );
            }
            router.back();
        } catch (error) {

            console.error('Failed to save exercise:', error);
        }
    }

    async function handleDelete() {
        if (exercise) {
            try {
                await exercise.delete(db);
                router.back();
            } catch (error) {
                console.error('Failed to delete exercise:', error);
            }
        }
    }

    return (
        <EntityDetailScreen 
            isNewEntity={id === 'new'} 
            title='Exercise' 
            onSave={handleSave} 
            onDelete={handleDelete}
            entityId={id !== 'new' ? id : undefined}
            entityType="exercise"
            showShareButton={true}
        >
            <LabeledTextField
                name='Name'
                initialValue={currentState.name}
                onValueChange={name => setCurrentState({ ...currentState, name })} 
            />
            <SetList
                sets={currentState.sets}
                onSetsChange={sets => setCurrentState({ ...currentState, sets })} 
            />
        </EntityDetailScreen>
    );
}