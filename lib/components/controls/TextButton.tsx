import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleProp, StyleSheet, TextStyle } from 'react-native';
import ThemeText from '../theme/ThemeText';
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

    const flattenedStyles = StyleSheet.flatten(style);
    const textColor = flattenedStyles?.color || colors.accent;
    const fontSize = flattenedStyles?.fontSize || iconSize || 16;

    return (
        <Pressable style={ styles.container } onPress={ onPress }>
            <Icon size={ fontSize } color={ textColor as string } />
            <ThemeText style={[ {
                color: colors.accent,
                fontWeight: 'bold'
            }, style ]}
            >
                { label }
            </ThemeText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    }
})