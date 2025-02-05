import ListItem from '@/lib/components/layout/ListItem';
import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { FlatList, StyleSheet } from 'react-native';

export default function ExercisesScreen() {
    const exercises = useSQLiteQuery<{ id: number, name: string }>(`
        SELECT name, id FROM exercises ORDER BY name;
    `, true);

    return (
        <FlatList
            data={ exercises }
            renderItem={ ({ item }) => <ListItem label={ item.name } />}
            keyExtractor={ ({ id }) => id.toString() }
            ItemSeparatorComponent={ Separator }
        />
    );
}