import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleProp, StyleSheet, TextStyle } from 'react-native';
import Text from '../theme/Text';
import { LucideIcon } from 'lucide-react-native';

interface Props {
    onPress?: () => unknown,
    label: string,
    Icon: LucideIcon,
    iconSize?: number,
    style?: StyleProp<TextStyle>
}

export default function TextButton({ onPress, label, Icon, style, iconSize }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    const flattenedStyles = StyleSheet.flatten(style);
    const textColor = flattenedStyles?.color || colors.accent;
    const fontSize = flattenedStyles?.fontSize || iconSize || 16;

    return (
        <Pressable style={resolvedStyles.container} onPress={onPress}>
            <Icon size={fontSize} color={textColor as string} />
            <Text 
                style={[resolvedStyles.buttonText, style]}
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