import { View, StyleSheet } from 'react-native';
import SearchField from '../../controls/SearchField';
import TextButton from '../../controls/TextButton';

interface Props {
    searchValue?: string,
    onSearchChange?: (value: string) => unknown;
    onAddPress?: () => unknown;
}

export default function ListHeaderControls({ searchValue, onSearchChange, onAddPress }: Props)  {
    return (
        <View style={ styles.container }>
            <SearchField value={ searchValue } onChange={ onSearchChange } />
            <TextButton
                style={ styles.optionText }
                symbol='plus'
                label='New'
                onPress={ onAddPress } />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
