import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SearchableList from '@/lib/components/lists/SearchableList/SearchableList';

export default function WorkoutsScreen() {
    const [workouts] = useSQLiteQuery<{ id: number, name: string }>(`
        SELECT name, id FROM workouts ORDER BY name;
    `, true);

    return (
        <View style={ styles.container }>
            <Separator />
            <SearchableList data={ workouts } />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10
    }
});