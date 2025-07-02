import { View, StyleSheet, FlatList, TextInput } from 'react-native';
import { IntensityType, Set, TYPE_DEFAULTS, VolumeType } from '@/lib/data/Exercise';
import Separator from '../layout/Separator';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable } from 'react-native';
import Text from '../theme/Text';
import AddFooter from './elements/AddFooter';
import { XCircle } from 'lucide-react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { toTitleCase } from '@/lib/utils/stringUtils';

interface Props {
    sets: Set[];
    volumeType: VolumeType;
    intensityTypes: IntensityType[];
    onSetsChange?: (sets: Set[]) => unknown;
}

export default function SetList({ sets, volumeType, intensityTypes, onSetsChange }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);
    const canDelete = sets.length > 1;

    function handleChange(index: number, field: keyof Set, value: string) {
        const updatedSets = [...sets];
        const type = field === 'volume' ? volumeType : field;
        updatedSets[index] = {
            ...updatedSets[index],
            [field]: Number(value) || TYPE_DEFAULTS[type]
        };
        onSetsChange?.(updatedSets);
    };

    function handleSetAdd() {
        const newSet: Set = {
            volume: TYPE_DEFAULTS[volumeType]
        };

        intensityTypes.forEach((type) => newSet[type] = TYPE_DEFAULTS[type]);
        onSetsChange?.([...sets, newSet]);
    }

    return (
        <ScrollView horizontal contentContainerStyle={resolvedStyles.scrollContainer}>
            <View style={resolvedStyles.container}>
                <View style={resolvedStyles.header}>
                    <Text style={resolvedStyles.headerText}>{toTitleCase(volumeType)}</Text>
                    {intensityTypes.map((type) => (
                        <Text key={type} style={resolvedStyles.headerText}>{toTitleCase(type)}</Text>
                    ))}
                </View>
                <FlatList
                    data={sets}
                    keyExtractor={(_, index) => index.toString()}
                    ItemSeparatorComponent={Separator}
                    contentContainerStyle={resolvedStyles.listContainer}
                    ListFooterComponent={
                        <AddFooter onAdd={handleSetAdd} />
                    }
                    renderItem={({ item, index }) => (
                        <View style={resolvedStyles.row}>
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
                                    color={(canDelete ? colors.red : colors.gray) as string}
                                />
                            </Pressable>
                            <TextInput
                                style={resolvedStyles.cell}
                                value={item.volume.toString()}
                                onChangeText={(text) => handleChange(index, 'volume', text)}
                                keyboardType='numeric'
                            />
                            {intensityTypes.map((type) => (
                                <TextInput
                                    key={type}
                                    style={resolvedStyles.cell}
                                    value={item[type]!.toString()}
                                    onChangeText={(text) => handleChange(index, type, text)}
                                    keyboardType='numeric'
                                />
                            ))}
                        </View>
                    )}
                />
            </View>
        </ScrollView>
    );
};

const CELL_WIDTH = 120;
const styles = (colors: ThemeColors) => StyleSheet.create({
    scrollContainer: {
        minWidth: '100%',
        justifyContent: 'center'
    },
    container: {
        gap: 5,
    },
    listContainer: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignSelf: 'flex-end',
    },
    headerText: {
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
        lineHeight: 22,
        width: CELL_WIDTH,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingLeft: 5,
        backgroundColor: colors.backgroundSecondary
    },
    cell: {
        flex: 1,
        textAlign: 'center',
        padding: 0,
        fontSize: 20,
        lineHeight: 22,
        width: CELL_WIDTH,
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

