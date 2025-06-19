import ActiveRoutineView from '@/lib/components/ActiveRoutineView';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';
import { DataItem } from '@/lib/components/lists/SearchableList';
import { router } from 'expo-router';
import { useDatabaseListener } from '@/lib/hooks/useDatabaseListener';

export default function RoutinesScreen() {
    const [routines, rerunQuery] = useSQLiteQuery<DataItem>(`SELECT name, id FROM routines ORDER BY name`, true);
    useDatabaseListener('routines', rerunQuery);

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