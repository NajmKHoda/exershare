import { View, StyleSheet } from 'react-native';
import SlideUpModal from './SlideUpModal';
import ListItem from '../lists/ListItem';
import { Edit3, QrCode } from 'lucide-react-native';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import Separator from '../lists/elements/Separator';
import { standardOutline, standardShadow } from '@/lib/standardStyles';

interface Props {
    visible: boolean;
    onClose?: () => void;
    onManualCreate?: () => void;
    onScan?: () => void;
    entityType: string; // e.g., "exercise", "workout", "routine"
}

export default function AddOptionsModal({ visible, onClose, onManualCreate, onScan, entityType }: Props) {
    const colors = useThemeColors();
    const styles = useResolvedStyles(stylesTemplate);

    const handleManualCreate = () => {
        onManualCreate?.();
        onClose?.();
    };

    const handleScan = () => {
        onScan?.();
        onClose?.();
    };

    return (
        <SlideUpModal
            visible={visible}
            onClose={onClose}
            title={`Add ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}
        >
            <View style={styles.container}>
                <ListItem
                    label="Create Manually"
                    Icon={Edit3}
                    iconColor={colors.primary as string}
                    onPress={handleManualCreate}
                />
                <Separator />
                <ListItem
                    label="Scan QR Code"
                    Icon={QrCode}
                    iconColor={colors.primary as string}
                    onPress={handleScan}
                />
            </View>
        </SlideUpModal>
    );
}

const stylesTemplate = (colors: ThemeColors) => StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundSecondary,

        ...standardShadow,
        ...standardOutline(colors),
    }
});
