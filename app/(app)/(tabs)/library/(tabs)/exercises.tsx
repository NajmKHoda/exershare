import Separator from '@/lib/components/lists/elements/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { router } from 'expo-router';
import { useState } from 'react';
import { useDatabaseListener } from '@/lib/hooks/useDatabaseListener';
import AddOptionsModal from '@/lib/components/modals/AddOptionsModal';

export default function ExercisesScreen() {
    const [exercises] = useSQLiteQuery<ListEntry>(
        `SELECT name, id FROM exercises ORDER BY name;`,
        true,
        'exercises'
    );
    const [addModalVisible, setAddModalVisible] = useState(false);

    function handleItemPress(entry: ListEntry) {
        router.push(`/exercise/${entry.id}`);
    }

    function handleItemAdd() {
        setAddModalVisible(true);
    }

    function handleManualCreate() {
        router.push('/exercise/new');
    }

    function handleScan() {
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
            <AddOptionsModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onManualCreate={handleManualCreate}
                onScan={handleScan}
                entityType="exercise"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 10,
        gap: 10,
    }
});

interface ListEntry {
    id: string,
    name: string
}