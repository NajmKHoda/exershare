import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import SlideUpModal from '@/lib/components/modals/SlideUpModal';
import { INTENSITY_TYPES, IntensityType } from '@/lib/data/Exercise';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Check } from 'lucide-react-native';
import Separator from '@/lib/components/layout/Separator';
import { toTitleCase } from '@/lib/utils/stringUtils';

interface Props {
    visible: boolean;
    currentTypes: IntensityType[];
    onClose: () => void;
    onSelect: (types: IntensityType[]) => void;
}

export default function IntensityTypeModal({ visible, currentTypes, onClose, onSelect }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);
    const selectedTypes = [...currentTypes];

    const toggleType = (type: IntensityType) => {
        const index = selectedTypes.indexOf(type);
        if (index === -1) {
            // Add the type if not already selected
            selectedTypes.push(type);
        } else {
            // Remove the type if already selected (only if there's at least one type left)
            if (selectedTypes.length > 1) {
                selectedTypes.splice(index, 1);
            }
        }
        onSelect([...selectedTypes]);
    };

    return (
        <SlideUpModal
            visible={visible}
            onClose={onClose}
            title="Select Intensity Types"
            additionalControls={
                <TouchableOpacity 
                    onPress={onClose}
                    style={resolvedStyles.doneButton}
                >
                    <Text style={resolvedStyles.doneText}>Done</Text>
                </TouchableOpacity>
            }
        >
            <Text style={resolvedStyles.instruction}>
                Select one or more intensity types for this exercise
            </Text>
            <FlatList
                data={INTENSITY_TYPES}
                keyExtractor={(item) => item}
                ItemSeparatorComponent={Separator}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={resolvedStyles.itemContainer}
                        onPress={() => toggleType(item)}
                    >
                        <Text style={resolvedStyles.itemText}>
                            {toTitleCase(item)}
                        </Text>
                        {currentTypes.includes(item) && (
                            <Check color={colors.accent as string} size={24} />
                        )}
                    </TouchableOpacity>
                )}
                style={resolvedStyles.list}
            />
        </SlideUpModal>
    );
}



const styles = (colors: ThemeColors) => StyleSheet.create({
    list: {
        flex: 1,
        marginTop: 10,
    },
    itemContainer: {
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
    },
    itemText: {
        fontSize: 18,
    },
    doneButton: {
        padding: 5,
    },
    doneText: {
        color: colors.accent,
        fontSize: 18,
        fontWeight: '600',
    },
    instruction: {
        marginVertical: 10,
        fontSize: 16,
        color: colors.secondary,
    }
});
