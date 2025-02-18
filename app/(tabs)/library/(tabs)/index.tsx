import ActiveRoutineView from '@/lib/components/ActiveRoutineView';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { useState } from 'react';
import { DataItem } from '@/lib/components/lists/SearchableList';
import { Routine } from '@/lib/data/Routine';
import { useSQLiteContext } from 'expo-sqlite';
import RoutineModal from '@/lib/components/modals/RoutineModal';

export default function RoutinesScreen() {
    // Database and queries
    const db = useSQLiteContext();
    const [routines, rerunRoutinesQuery] = useSQLiteQuery<DataItem>(`SELECT name, id FROM routines ORDER BY name`, true);
    const [activeRoutineResult, rerunActiveRoutineQuery] = useSQLiteQuery<{ name: string }>(`
        SELECT routines.name FROM routines
        JOIN user ON routines.id = user.active_routine_id;
    `);

    const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
    const [isEditModalVisible, setEditModalVisible] = useState(false);

    async function handleItemSelect({ id }: DataItem) {
        const routine = await Routine.pullOne(id, db);
        setEditingRoutine(routine);
        setEditModalVisible(true);
    }

    function handleItemAdd() {
        setEditingRoutine(null);
        setEditModalVisible(true);
    }

    return (
        <View style={ styles.container }>
            <ActiveRoutineView
                activeRoutineName={ activeRoutineResult?.name ?? 'None' }
                onRefresh={ rerunActiveRoutineQuery }/>
            <Separator />
            <SelectList data={ routines } onSelect={ handleItemSelect } onItemAdd={ handleItemAdd }/>
            <RoutineModal
                visible={ isEditModalVisible }
                routine={ editingRoutine }
                onClose={ () => {
                    setEditModalVisible(false);
                    rerunRoutinesQuery();
                    rerunActiveRoutineQuery();
                }} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
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