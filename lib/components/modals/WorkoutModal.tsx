import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Workout } from '@/lib/data/Workout';
import LabeledTextField from '../controls/LabeledTextField';
import EditModal from './EditModal';

interface Props {
    workout: Workout | null;
    visible: boolean;
    onClose: () => unknown;
}

export default function WorkoutModal({ workout, visible, onClose }: Props) {
    const db = useSQLiteContext();
    const [curWorkout, setCurWorkout] = useState(workoutOrDefault);
    
    // Reset state when a new workout is provided
    useEffect(() => setCurWorkout(workoutOrDefault), [workout]);

    function workoutOrDefault() {
        return {
            name: workout?.name || '',
            exercises: workout?.exercises.map(({ id, name }) => ({ id, name })) || []
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
        </EditModal>
    );
};