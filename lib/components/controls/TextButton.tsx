import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleProp, Text, TextStyle } from 'react-native';
import ThemeText from '../theme/ThemeText';

interface Props {
    onPress?: () => unknown,
    label: string,
    style?: StyleProp<TextStyle>
}

export default function TextButton({ onPress, label, style }: Props) {
    const colors = useThemeColors();

    return (
        <Pressable onPress={ onPress }>
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