import Separator from '@/lib/components/layout/Separator';
import useSQLiteQuery from '@/lib/hooks/useSQLiteQuery';
import { StyleSheet, View } from 'react-native';
import SearchableList from '@/lib/components/lists/SearchableList/SearchableList';
import { useState } from 'react';

export default function ExercisesScreen() {
    const exercises = useSQLiteQuery<{ id: number, name: string }>(`
        SELECT name, id FROM exercises ORDER BY name;
    `, true);

    return (
        <View style={ styles.container }>
            <Separator />
            <SearchableList data={ exercises } />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10
    }
});