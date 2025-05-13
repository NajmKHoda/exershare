import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { DataItem } from '@/lib/components/lists/SearchableList';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function WorkoutsScreen() {
    const [workouts, rerunQuery] = useSQLiteQuery<DataItem>(`SELECT name, id FROM workouts ORDER BY name;`, true);
    
    // Refresh data when screen is focused
    useFocusEffect(
        useCallback(() => {
            rerunQuery();
        }, [])
    );

    function handleItemPress({ id }: { id: string }) {
        router.push(`/workout/${id}`);
    }

    function handleItemAdd() {
        router.push('/workout/new');
    }

    return (
        <View style={ styles.container }>
            <Separator />
            <SelectList
                data={ workouts }
                onSelect={ handleItemPress }
                onItemAdd={ handleItemAdd }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10
    }
});