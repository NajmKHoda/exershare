import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleProp, StyleSheet, TextStyle } from 'react-native';
import Text from '../theme/Text';
import { LucideIcon } from 'lucide-react-native';

interface Props {
    onPress?: () => unknown,
    label: string,
    Icon: LucideIcon,
    iconSize?: number,
    style?: StyleProp<TextStyle>,
    disabled?: boolean;
}

export default function TextButton({ onPress, label, Icon, style, iconSize, disabled = false }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    const flattenedStyles = StyleSheet.flatten(style);
    const textColor = flattenedStyles?.color || (disabled ? colors.gray : colors.accent);
    const fontSize = flattenedStyles?.fontSize || iconSize || 16;

    return (
        <Pressable style={resolvedStyles.container} onPress={onPress} disabled={disabled}>
            <Icon size={fontSize} color={textColor as string} />
            <Text 
                style={[resolvedStyles.buttonText, style, { color: textColor }]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    buttonText: {
        color: colors.accent,
        fontWeight: 'bold'
    }
})