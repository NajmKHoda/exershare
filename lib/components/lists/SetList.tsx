import { View, StyleSheet, FlatList, TextInput } from 'react-native';
import { Set } from '@/lib/data/Exercise';
import Separator from '../layout/Separator';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable } from 'react-native';
import ThemeText from '../theme/ThemeText';
import AddFooter from './elements/AddFooter';
import { XCircle } from 'lucide-react-native';

interface Props {
    sets: Set[];
    onSetsChange?: (sets: Set[]) => unknown;
}

export default function SetList({ sets, onSetsChange }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    function handleChange(index: number, field: keyof Set, value: string) {
        const updatedSets = [...sets];
        updatedSets[index] = { ...updatedSets[index], [field]: value };
        onSetsChange?.(updatedSets);
    };

    const canDelete = sets.length > 1;

    return (
        <View style={resolvedStyles.container}>
            <View style={resolvedStyles.header}>
                <ThemeText style={resolvedStyles.headerText}>Reps</ThemeText>
                <ThemeText style={resolvedStyles.headerText}>Weight (lbs)</ThemeText>
            </View>
            <FlatList
                data={sets}
                keyExtractor={(_, index) => index.toString()}
                ItemSeparatorComponent={Separator}
                contentContainerStyle={resolvedStyles.listContainer}
                ListFooterComponent={
                    <AddFooter onAdd={() => onSetsChange?.([...sets, { reps: 12, weight: 25 }])} />
                }
                renderItem={({ item, index }) => (
                    <View style={resolvedStyles.row}>
                        <TextInput
                            style={resolvedStyles.cell}
                            value={item.reps.toString()}
                            onChangeText={(text) => handleChange(index, 'reps', text)}
                            keyboardType='numeric'
                        />
                        <TextInput
                            style={resolvedStyles.cell}
                            value={item.weight.toString()}
                            onChangeText={(text) => handleChange(index, 'weight', text)}
                            keyboardType='numeric'
                        />
                        <Pressable 
                            style={resolvedStyles.deleteButton}
                            disabled={!canDelete}
                            onPress={() => {
                                const updatedSets = sets.filter((_, i) => i !== index);
                                onSetsChange?.(updatedSets);
                            }}
                        >
                            <XCircle
                                size={24}
                                color={(canDelete ? colors.red : colors.gray) as string} />
                        </Pressable>
                    </View>
                )}
            />
        </View>
    );
};

const styles = (colors: ThemeColors) => StyleSheet.create({
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
        backgroundColor: colors.backgroundSecondary
    },

    cell: {
        flex: 1,
        textAlign: 'center',
        padding: 0,
        fontSize: 20,
        lineHeight: 22,
        color: colors.primary
    },

    deleteButton: {
        paddingHorizontal: 5
    },

    addButton: {
        alignItems: 'center',
        paddingVertical: 10
    }
});