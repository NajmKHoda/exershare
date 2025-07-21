import { View, StyleSheet } from 'react-native';
import { IntensityType, Set, TYPE_DEFAULTS, VolumeType } from '@/lib/data/Exercise';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable } from 'react-native';
import Text from '../theme/Text';
import AddFooter from './elements/AddFooter';
import { XCircle } from 'lucide-react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { toTitleCase } from '@/lib/utils/stringUtils';
import StandardList from './StandardList';
import DeferredInputField from '../controls/DeferredInputField';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { convertValue, formatValue } from '@/lib/utils/units';

interface Props {
    sets: Set[];
    volumeType: VolumeType;
    intensityTypes: IntensityType[];
    onSetsChange?: (sets: Set[]) => unknown;
}

export default function SetList({ sets, volumeType, intensityTypes, onSetsChange }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);
    const { units } = useUserPreferences();

    const canDelete = sets.length > 1;

    function handleChange(index: number, field: keyof Set, value: string) {
        const updatedSets = [...sets];
        const type = field === 'volume' ? volumeType : field;

        let newValue = Number.parseFloat(value);
        if (isNaN(newValue))
            newValue = TYPE_DEFAULTS[type][units];

        updatedSets[index] = { ...updatedSets[index], [field]: newValue };
        onSetsChange?.(updatedSets);

        return limit(newValue);
    };

    function handleSetAdd() {
        const newSet: Set = {
            volume: TYPE_DEFAULTS[volumeType][units]
        };

        intensityTypes.forEach((type) => newSet[type] = TYPE_DEFAULTS[type][units]);
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
                <StandardList
                    data={sets}
                    keyExtractor={(_, index) => index.toString()}
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
                            <DeferredInputField
                                style={resolvedStyles.cell}
                                value={limit(item.volume)}
                                setValue={(text) => handleChange(index, 'volume', text)}
                                formatUnfocused={val => formatValue(Number(val), volumeType, units)}
                                keyboardType='numeric'
                            />
                            {intensityTypes.map((type) => (
                                <DeferredInputField
                                    key={type}
                                    style={resolvedStyles.cell}
                                    value={limit(item[type]!)}
                                    setValue={(text) => handleChange(index, type, text)}
                                    formatUnfocused={val => formatValue(Number(val), type, units)}
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

function limit(num: number) {
    return Number.parseFloat(num.toFixed(2)).toString();
}

const CELL_WIDTH = 120;
const styles = (colors: ThemeColors) => StyleSheet.create({
    scrollContainer: {
        minWidth: '100%',
        justifyContent: 'center'
    },
    container: {
        gap: 5,
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

