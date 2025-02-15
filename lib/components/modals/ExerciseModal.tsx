import { Modal, View, StyleSheet } from 'react-native';
import { Exercise, Set } from '@/lib/data/Exercise';
import TextButton from '../controls/TextButton';
import LabeledTextField from '../controls/LabeledTextField';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import SetList from '../lists/SetList';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';

interface Props {
    exercise: Exercise;
    visible: boolean;
    onClose: () => unknown;
}

export default function ExerciseModal({ exercise, visible, onClose }: Props) {
    const [curExercise, setCurExercise] = useState({
        name: exercise.name,
        sets: exercise.sets,
        notes: exercise.notes,
        categories: exercise.categories
    });

    const db = useSQLiteContext();
    const colors = useThemeColors();

    useEffect(() => {
        setCurExercise({
            name: exercise.name,
            sets: exercise.sets,
            notes: exercise.notes,
            categories: exercise.categories
        });
    }, [exercise]);

    async function handleSave() {
        const updatedExercise = new Exercise(
            exercise.id,
            curExercise.name,
            curExercise.sets,
            curExercise.notes,
            curExercise.categories
        );

        await updatedExercise.save(db);
        onClose();
    }

    async function handleDelete() {
        await exercise.delete(db);
        onClose();
    }   

    return (
        <Modal
            visible={ visible }
            animationType='fade'
            transparent={ true }
            onRequestClose={ onClose }
        >
            <View style={styles.overlay}>
                <View style={[ styles.container, { backgroundColor: colors.background } ]}>
                    <View style={styles.modalControls}>
                        <TextButton
                            label='Cancel'
                            symbol='xmark'
                            onPress={ onClose }
                            symbolSize={ 20 }
                            style={ styles.control } />
                        <TextButton
                            label='Save'
                            symbol='square.and.arrow.down'
                            onPress={ handleSave }
                            symbolSize={ 24 }
                            style={ styles.control } />
                    </View>
                    <LabeledTextField
                        name='Name'
                        initialValue={ curExercise.name }
                        onValueChange={ name => setCurExercise({ ...curExercise, name }) } />
                    <SetList
                        sets={ curExercise.sets }
                        onSetsChange={ sets => setCurExercise({ ...curExercise, sets }) } />
                    <TextButton
                        label='Delete Exercise'
                        symbol='trash'
                        style={[ styles.deleteButton, { color: colors.red }]}
                        onPress={ handleDelete } />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'stretch',
        paddingHorizontal: 20
    },

    container: {
        alignItems: 'stretch',
        padding: 20,
        gap: 30,
        borderRadius: 20,
    },

    modalControls: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    control: {
        fontSize: 20,
        lineHeight: 22
    },

    deleteButton: {
        fontSize: 20,
        lineHeight: 22
    }
});
