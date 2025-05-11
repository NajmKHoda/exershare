import ActiveRoutineView from '@/lib/components/ActiveRoutineView';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { DataItem } from '@/lib/components/lists/SearchableList';
import { useActiveRoutine } from '@/lib/hooks/useActiveRoutine';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function RoutinesScreen() {
    // Database and queries
    const [routines, rerunRoutinesQuery] = useSQLiteQuery<DataItem>(`SELECT name, id FROM routines ORDER BY name`, true);
    const { refreshActiveRoutine } = useActiveRoutine();

    // Refresh data when screen is focused
    useFocusEffect(
        useCallback(() => {
            rerunRoutinesQuery();
            refreshActiveRoutine();
        }, [])
    );

    function handleItemSelect({ id }: DataItem) {
        router.push(`/routine/${id}`);
    }

    function handleItemAdd() {
        router.push('/routine/new');
    }

    return (
        <View style={ styles.container }>
            <ActiveRoutineView />
            <Separator />
            <SelectList data={ routines } onSelect={ handleItemSelect } onItemAdd={ handleItemAdd }/>
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