import { StyleSheet } from 'react-native';
import SlideUpModal from '@/lib/components/modals/SlideUpModal';
import { VOLUME_TYPES, VolumeType } from '@/lib/data/Exercise';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import StandardList from '../lists/StandardList';
import ListItem from '../lists/ListItem';
import { toTitleCase } from '@/lib/utils/stringUtils';
import { ChevronRight } from 'lucide-react-native';

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
            <StandardList
                data={VOLUME_TYPES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <ListItem
                        label={toTitleCase(item)}
                        Icon={ChevronRight}
                        onPress={() => {
                            onSelect(item);
                            onClose();
                        }}
                    />
                )}
                style={resolvedStyles.list}
                scrollEnabled={false}
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
