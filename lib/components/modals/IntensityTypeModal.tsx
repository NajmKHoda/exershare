import { StyleSheet, TouchableOpacity } from 'react-native';
import SlideUpModal from '@/lib/components/modals/SlideUpModal';
import { INTENSITY_TYPES, IntensityType } from '@/lib/data/Exercise';
import Text from '@/lib/components/theme/Text';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { toTitleCase } from '@/lib/utils/stringUtils';
import MultiselectList from '../lists/MultiselectList';
import { useState } from 'react';

interface Props {
    visible: boolean;
    currentTypes: IntensityType[];
    onClose: (types: IntensityType[]) => void;
}

export default function IntensityTypeModal({ visible, currentTypes, onClose}: Props) {
    const resolvedStyles = useResolvedStyles(styles);
    const [selectedTypes, setSelectedTypes] = useState(currentTypes);

    function toDataItems(types: readonly IntensityType[]) {
        return types.map((type, i) => ({
            id: type,
            name: toTitleCase(type),
        }));
    }

    return (
        <SlideUpModal
            visible={visible}
            onClose={() => onClose(currentTypes)}
            title="Select Intensity Types"
            additionalControls={
                <TouchableOpacity 
                    onPress={() => onClose(selectedTypes)}
                    style={resolvedStyles.doneButton}
                >
                    <Text style={resolvedStyles.doneText}>Done</Text>
                </TouchableOpacity>
            }
        >
            <Text style={resolvedStyles.instruction}>
                Select one or more intensity types for this exercise
            </Text>
            <MultiselectList
                search={false}
                data={toDataItems(INTENSITY_TYPES)}
                selectedItems={toDataItems(selectedTypes)}
                setSelectedItems={(selected) => {
                    setSelectedTypes(selected.map(item => item.id as IntensityType));
                }}
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
