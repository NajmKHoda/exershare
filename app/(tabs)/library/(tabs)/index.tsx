import ActiveRoutineView from '@/lib/components/ActiveRoutineView';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SelectList from '@/lib/components/lists/SelectList';

export default function RoutinesScreen() {
    const [routines] = useSQLiteQuery<{ name: string, id: number}>(`
        SELECT name, id FROM routines ORDER BY name;
    `, true);

    return (
        <View style={ styles.container }>
            <ActiveRoutineView />
            <Separator />
            <SelectList data={ routines } />
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