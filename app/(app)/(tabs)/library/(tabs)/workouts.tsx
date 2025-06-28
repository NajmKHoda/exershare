import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { DataItem } from '@/lib/components/lists/SearchableList';
import { router } from 'expo-router';
import { useDatabaseListener } from '@/lib/hooks/useDatabaseListener';
import AddOptionsModal from '@/lib/components/modals/AddOptionsModal';
import { useState } from 'react';

export default function WorkoutsScreen() {
    const [workouts, rerunQuery] = useSQLiteQuery<DataItem>(`SELECT name, id FROM workouts ORDER BY name;`, true);
    const [addModalVisible, setAddModalVisible] = useState(false);
    useDatabaseListener('workouts', rerunQuery);

    function handleItemPress({ id }: { id: string }) {
        router.push(`/workout/${id}`);
    }

    function handleItemAdd() {
        setAddModalVisible(true);
    }

    function handleManualCreate() {
        router.push('/workout/new');
    }

    function handleScan() {
        router.push('/scan');
    }

    return (
        <View style={ styles.container }>
            <Separator />
            <SelectList
                data={ workouts }
                onSelect={ handleItemPress }
                onItemAdd={ handleItemAdd }
            />
            <AddOptionsModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onManualCreate={handleManualCreate}
                onScan={handleScan}
                entityType="workout"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10
    }
});