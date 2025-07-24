import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SearchField from '@/lib/components/controls/SearchField';
import TextButton from '@/lib/components/controls/TextButton';
import { Plus } from 'lucide-react-native';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import StandardList from './StandardList';

interface Props {
    data: DataItem[],
    itemRenderer: (item: DataItem) => React.ReactElement,
    onItemAdd?: () => unknown
}

export default function SearchableList({ data, itemRenderer, onItemAdd }: Props) {
    const styles = useResolvedStyles(stylesTemplate);
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
                        Icon={ Plus }
                        label='New'
                        onPress={ onItemAdd } />
                }
            </View>
            <StandardList
                data={ filteredData }
                renderItem={ ({ item }) => itemRenderer(item) }
                keyExtractor={ ({ id }) => id.toString() }
            />
        </View>
    );
}

const stylesTemplate = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        gap: 10,
        alignItems: 'stretch'
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
    id: string
}