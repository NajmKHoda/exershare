import ListItem from '@/lib/components/layout/ListItem';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { FlatList, StyleSheet } from 'react-native';

export default function WorkoutsScreen() {
    const workouts = useSQLiteQuery<{ id: number, name: string }>(`
        SELECT name, id FROM workouts ORDER BY name;
    `, true);

    return (
        <FlatList
            data={ workouts }
            renderItem={ ({ item }) => <ListItem label={ item.name } />}
            keyExtractor={ ({ id }) => id.toString() }
            ItemSeparatorComponent={ Separator }
        />
    );
}