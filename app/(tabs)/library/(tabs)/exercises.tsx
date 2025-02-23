import { useState } from 'react';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import ExerciseModal from '@/lib/components/modals/ExerciseModal';
import { Exercise } from '@/lib/data/Exercise';
import { useSQLiteContext } from 'expo-sqlite';
import SelectList from '@/lib/components/lists/SelectList';

export default function ExercisesScreen() {
    const db = useSQLiteContext();
    const [exercises, rerunQuery] = useSQLiteQuery<ListEntry>(`
        SELECT name, id FROM exercises ORDER BY name;
    `, true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    async function handleItemPress(entry: ListEntry) {
        const exercise = await Exercise.pullOne(entry.id, db);
        setSelectedExercise(exercise);
        setModalVisible(true);
    }

    async function handleItemAdd() {
        setSelectedExercise(null);
        setModalVisible(true);
    }

    return (
        <View style={ styles.container }>
            <Separator />
            <SelectList 
                data={ exercises } 
                onSelect={ handleItemPress }
                onItemAdd={ handleItemAdd }
            />
            <ExerciseModal 
                visible={ modalVisible } 
                exercise={ selectedExercise } 
                onClose={() => {
                    setModalVisible(false);
                    rerunQuery();
                }} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10
    }
});

interface ListEntry {
    id: number,
    name: string
}