import { Exercise } from '@/lib/data/Exercise';
import LabeledTextField from '../controls/LabeledTextField';
import SetList from '../lists/SetList';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import EditModal from './EditModal';

interface Props {
    exercise: Exercise | null;
    visible: boolean;
    onClose: () => unknown;
}

export default function ExerciseModal({ exercise, visible, onClose }: Props) {
    const [curExercise, setCurExercise] = useState(exerciseOrDefault);
    const db = useSQLiteContext();
    
    // Reset state when a new exercise is introduced
    useEffect(() => setCurExercise(exerciseOrDefault), [exercise]);
    
    function exerciseOrDefault() {
        return {
            name: exercise?.name || '',
            sets: exercise?.sets || [
                { reps: 12, weight: 25 },
                { reps: 12, weight: 25 },
                { reps: 12, weight: 25 }
            ],
            notes: exercise?.notes || '',
            categories: exercise?.categories || []
        };
    }

    async function handleSave() {
        if (exercise) {
            // Save existing exercise
            const updatedExercise = new Exercise(
                exercise.id,
                curExercise.name,
                curExercise.sets,
                curExercise.notes,
                curExercise.categories
            );
            await updatedExercise.save(db);
        } else {
            // Create new exercise
            await Exercise.create(
                curExercise.name,
                curExercise.sets,
                curExercise.notes,
                curExercise.categories,
                db
            );
        }
        onClose();
    }

    async function handleDelete() {
        await exercise!.delete(db);
        onClose();
    }   

    return (
        <EditModal
            visible={ visible }
            onClose={ onClose }
            onSave={ handleSave }
            onDelete={ exercise ? handleDelete : undefined }
        >
            <LabeledTextField
                name='Name'
                initialValue={ curExercise.name }
                onValueChange={ name => setCurExercise({ ...curExercise, name }) } />
            <SetList
                sets={ curExercise.sets }
                onSetsChange={ sets => setCurExercise({ ...curExercise, sets }) } />
        </EditModal>
    );
};