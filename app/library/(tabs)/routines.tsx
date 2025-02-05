import ActiveRoutineView from '@/lib/components/ActiveRoutineView';
import TextButton from '@/lib/components/controls/TextButton';
import ListItem from '@/lib/components/layout/ListItem';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { FlatList, StyleSheet, View } from 'react-native';

export default function RoutinesScreen() {
    const routines = useSQLiteQuery<{ name: string, id: number}>(`
        SELECT name, id FROM routines ORDER BY name;
    `, true);

    return (
        <View style={ styles.container }>
            <ActiveRoutineView />
            <Separator />
            <View style={ styles.options }>
                <TextButton style={ styles.optionText } label='+ New' />
                <TextButton style={ styles.optionText } label='Filter / Sort' />
            </View>
            <FlatList
                data={ routines }
                renderItem={ ({ item }) => <ListItem label={ item.name } /> }
                keyExtractor={ ({ id }) => id.toString() }
                ItemSeparatorComponent={ Separator }
            />
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
        alignItems: 'center'
    },

    optionText: {
        fontSize: 20,
        lineHeight: 20
    }
});