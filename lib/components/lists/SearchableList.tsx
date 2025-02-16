import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import SearchField from '@/lib/components/controls/SearchField';
import TextButton from '@/lib/components/controls/TextButton';
import Separator from '@/lib/components/layout/Separator';

interface Props {
    data: DataItem[],
    itemRenderer: (item: DataItem) => React.ReactElement,
    onItemAdd?: () => unknown
}

export default function SearchableList({ data, itemRenderer, onItemAdd }: Props) {
    const [searchValue, setSearchValue] = useState('');

    const filteredData = data.filter(({ name }) => name
        .toLowerCase()
        .startsWith(searchValue.toLowerCase())
    );

    return (
        <View style={ styles.container }>
            <View style={ styles.controlsContainer }>
                <SearchField value={ searchValue } onChange={ setSearchValue } />
                { onItemAdd &&
                    <TextButton
                        style={ styles.optionText }
                        symbol='plus'
                        label='New'
                        onPress={ onItemAdd } />
                }
            </View>
            <FlatList
                data={ filteredData }
                renderItem={ ({ item }) => itemRenderer(item) }
                keyExtractor={ ({ id }) => id.toString() }
                ItemSeparatorComponent={ Separator }
                contentContainerStyle={ styles.flatListContent }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10,
        alignItems: 'stretch'
    },

    flatListContent: {
        borderRadius: 10,
        overflow: 'hidden'
    },

    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20
    },

    optionText: {
        fontSize: 20,
        lineHeight: 20
    }
});

export interface DataItem {
    name: string,
    id: number
}