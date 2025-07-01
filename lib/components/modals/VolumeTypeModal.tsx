import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import SlideUpModal from '@/lib/components/modals/SlideUpModal';
import { VOLUME_TYPES, VolumeType } from '@/lib/data/Exercise';
import ThemeText from '@/lib/components/theme/ThemeText';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Check } from 'lucide-react-native';
import Separator from '@/lib/components/layout/Separator';
import { toTitleCase } from '@/lib/utils/stringUtils';

interface Props {
    visible: boolean;
    currentType: VolumeType;
    onClose: () => void;
    onSelect: (type: VolumeType) => void;
}

export default function VolumeTypeModal({ visible, currentType, onClose, onSelect }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <SlideUpModal
            visible={visible}
            onClose={onClose}
            title="Select Volume Type"
        >
            <FlatList
                data={VOLUME_TYPES}
                keyExtractor={(item) => item}
                ItemSeparatorComponent={Separator}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={resolvedStyles.itemContainer}
                        onPress={() => {
                            onSelect(item);
                            onClose();
                        }}
                    >
                        <ThemeText style={resolvedStyles.itemText}>
                            {toTitleCase(item)}
                        </ThemeText>
                        {item === currentType && (
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
    }
});
