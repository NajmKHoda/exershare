import { useState } from 'react';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import WorkoutModal from '@/lib/components/modals/WorkoutModal';
import { Workout } from '@/lib/data/Workout';
import { useSQLiteContext } from 'expo-sqlite';
import SelectList from '@/lib/components/lists/SelectList';

export default function WorkoutsScreen() {
    const db = useSQLiteContext();
    const [workouts, rerunQuery] = useSQLiteQuery<{ id: number, name: string }>(`
        SELECT name, id FROM workouts ORDER BY name;e
    `, true);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

    async function handleItemPress({ id }: { id: number }) {
        const workout = await Workout.pullOne(id, db);
        setSelectedWorkout(workout);
        setModalVisible(true);
    }

    return (
        <View style={ styles.container }>
            <Separator />
            <SelectList
                data={ workouts }
                onSelect={ handleItemPress }
            />
            <WorkoutModal 
                visible={ modalVisible } 
                workout={ selectedWorkout }
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