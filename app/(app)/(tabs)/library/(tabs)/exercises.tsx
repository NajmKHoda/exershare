import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useDatabaseListener } from '@/lib/hooks/useDatabaseListener';

export default function ExercisesScreen() {
    const [exercises, rerunQuery] = useSQLiteQuery<ListEntry>(`SELECT name, id FROM exercises ORDER BY name;`, true);
    useDatabaseListener('exercises', rerunQuery);

    function handleItemPress(entry: ListEntry) {
        router.push(`/exercise/${entry.id}`);
    }

    function handleItemAdd() {
        //router.push('/exercise/new');
        router.push('/scan');
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
    id: string,
    name: string
}