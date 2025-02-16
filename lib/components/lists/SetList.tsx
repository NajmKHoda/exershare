import { View, StyleSheet, FlatList, TextInput } from 'react-native';
import { Set } from '@/lib/data/Exercise';
import Separator from '../layout/Separator';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import ThemeText from '../theme/ThemeText';
import AddFooter from './elements/AddFooter';

interface Props {
    sets: Set[];
    onSetsChange?: (sets: Set[]) => unknown;
}

export default function SetList({ sets, onSetsChange }: Props) {
    const colors = useThemeColors();

    function handleChange(index: number, field: keyof Set, value: string) {
        const updatedSets = [...sets];
        updatedSets[index] = { ...updatedSets[index], [field]: value };
        onSetsChange?.(updatedSets);
    };

    const canDelete = sets.length > 1;

    return (
        <View style={ styles.container }>
            <View style={ styles.header }>
                <ThemeText style={ styles.headerText }>Reps</ThemeText>
                <ThemeText style={ styles.headerText }>Weight (lbs)</ThemeText>
            </View>
            <FlatList
                data={ sets }
                keyExtractor={ (_, index) => index.toString() }
                ItemSeparatorComponent={ Separator }
                contentContainerStyle={ styles.listContainer }
                ListFooterComponent={
                    <AddFooter onAdd={() => onSetsChange?.([...sets, { reps: 12, weight: 25 }])} />
                }
                renderItem={({ item, index }) => (
                    <View style={[ styles.row, {
                        backgroundColor: colors.backgroundSecondary as string
                    }]}>
                        <TextInput
                            style={[ styles.cell, { color: colors.primary as string } ]}
                            value={ item.reps.toString() }
                            onChangeText={ (text) => handleChange(index, 'reps', text) }
                            keyboardType='numeric'
                        />
                        <TextInput
                            style={[ styles.cell, { color: colors.primary as string } ]}
                            value={ item.weight.toString() }
                            onChangeText={ (text) => handleChange(index, 'weight', text) }
                            keyboardType='numeric'
                        />
                        <Pressable 
                            style={ styles.deleteButton }
                            disabled={ !canDelete }
                            onPress={() => {
                                const updatedSets = sets.filter((_, i) => i !== index);
                                onSetsChange?.(updatedSets);
                            }}
                        >
                            <SymbolView
                                name='xmark.circle.fill'
                                size={ 24 }
                                tintColor={ (canDelete ? colors.red : colors.gray) as string } />
                        </Pressable>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 5
    },

    listContainer: {
        borderRadius: 10,
        overflow: 'hidden'
    },

    header: {
        flexDirection: 'row',
        gap: 10,
        paddingRight: 34
    },

    headerText: {
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
        lineHeight: 22
    },

    row: {
        flexDirection: 'row',
        paddingVertical: 10,
    },

    cell: {
        flex: 1,
        textAlign: 'center',
        padding: 0,
        fontSize: 20,
        lineHeight: 22
    },

    deleteButton: {
        paddingHorizontal: 5
    },

    addButton: {
        alignItems: 'center',
        paddingVertical: 10
    }
});