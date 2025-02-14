import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import ListHeaderControls from '@/lib/components/lists/SearchableList/ListHeaderControls';
import Separator from '@/lib/components/layout/Separator';
import ListItem from './ListItem';

interface SerializableData {
    name: string,
    id: number
}

interface Props<T extends SerializableData> {
    data: T[],
    onItemPress?: (item: T) => unknown
}

export default function SearchableList<T extends SerializableData>({ data, onItemPress }: Props<T>) {
    const [searchValue, setSearchValue] = useState('');

    const filteredData = data.filter(({ name }) => name
        .toLowerCase()
        .startsWith(searchValue.toLowerCase())
    );

    return (
        <>
            <ListHeaderControls searchValue={ searchValue } onSearchChange={ setSearchValue }/>
            <FlatList
                data={ filteredData }
                renderItem={ ({ item }) =>
                    <ListItem
                        label={ item.name }
                        onPress={ onItemPress && (() => onItemPress(item)) }
                    />
                }
                keyExtractor={ ({ id }) => id.toString() }
                ItemSeparatorComponent={ Separator }
                contentContainerStyle={ styles.flatListContent }
            />
        </>
    );
}

const styles = StyleSheet.create({
    flatListContent: {
        borderRadius: 10,
        overflow: 'hidden'
    }
});