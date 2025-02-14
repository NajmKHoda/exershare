import React, { useState } from 'react';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SearchableList from '@/lib/components/lists/SearchableList/SearchableList';
import ExerciseModal from '@/lib/components/modals/ExerciseModal';
import { Exercise } from '@/lib/data/Exercise';
import { useSQLiteContext } from 'expo-sqlite';

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

    return (
        <View style={ styles.container }>
            <Separator />
            <SearchableList 
                data={ exercises } 
                onItemPress={ handleItemPress }
            />
            { selectedExercise && (
                <ExerciseModal 
                    visible={ modalVisible } 
                    exercise={ selectedExercise } 
                    onClose={() => {
                        setModalVisible(false);
                        rerunQuery();
                    }} 
                />
            ) }
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