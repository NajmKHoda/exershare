import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '@/lib/components/theme/Text';
import { LucideIcon } from 'lucide-react-native';

interface Props {
    label: string,
    Icon: LucideIcon,
    iconColor?: string,
    iconSize?: number,
    onPress?: () => unknown
}

export default function ListItem({ label, Icon, iconColor, iconSize, onPress }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <Pressable
            style={resolvedStyles.container}
            onPress={onPress}
        >
            <Text style={resolvedStyles.label}>{label}</Text>
            <Icon
                size={iconSize ?? 24}
                color={iconColor ?? colors.primary as string} />
        </Pressable>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15
    },

    label: {
        fontSize: 20,
        lineHeight: 20
    }
});