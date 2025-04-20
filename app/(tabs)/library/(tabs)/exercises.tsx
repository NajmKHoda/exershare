import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function ExercisesScreen() {
    const [exercises, rerunQuery] = useSQLiteQuery<ListEntry>(`
        SELECT name, id FROM exercises ORDER BY name;
    `, true);

    // Refresh data when screen is focused
    useFocusEffect(
        useCallback(() => {
            rerunQuery();
        }, [])
    );

    function handleItemPress(entry: ListEntry) {
        router.push(`/exercise/${entry.id}`);
    }

    function handleItemAdd() {
        router.push('/exercise/new');
    }

    return (
        <View style={ styles.container }>
            <Separator />
            <SelectList 
                data={ exercises } 
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

interface ListEntry {
    id: number,
    name: string
}