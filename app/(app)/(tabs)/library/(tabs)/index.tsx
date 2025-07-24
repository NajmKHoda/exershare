import ActiveRoutineView from '@/lib/components/ActiveRoutineView';
import Separator from '@/lib/components/lists/elements/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { DataItem } from '@/lib/components/lists/SearchableList';
import { router } from 'expo-router';
import { useDatabaseListener } from '@/lib/hooks/useDatabaseListener';
import AddOptionsModal from '@/lib/components/modals/AddOptionsModal';
import { useState } from 'react';

export default function RoutinesScreen() {
    const [routines] = useSQLiteQuery<DataItem>(
        `SELECT name, id FROM routines ORDER BY name`,
        true,
        'routines'
    );
    const [addModalVisible, setAddModalVisible] = useState(false);

    function handleItemSelect({ id }: DataItem) {
        router.push(`/routine/${id}`);
    }

    function handleItemAdd() {
        setAddModalVisible(true);
    }

    function handleManualCreate() {
        router.push('/routine/new');
    }

    function handleScan() {
        router.push('/scan');
    }

    return (
        <View style={ styles.container }>
            <ActiveRoutineView />
            <Separator />
            <SelectList data={ routines } onSelect={ handleItemSelect } onItemAdd={ handleItemAdd }/>
            <AddOptionsModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onManualCreate={handleManualCreate}
                onScan={handleScan}
                entityType="routine"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 10
    },

    options: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20
    },

    optionText: {
        fontSize: 20,
        lineHeight: 20
    },

    flatListContent: {
        borderRadius: 10,
        overflow: 'hidden'
    }
});