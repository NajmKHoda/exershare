import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface Props {
    Icon: LucideIcon,
    label: string
}

export default function LabelButton({ Icon, label }: Props) {
    const themeColors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <Pressable style={resolvedStyles.container}>
            <Icon color='#ffffff' size={24} />
            <Text style={resolvedStyles.label}>{ label }</Text>
        </Pressable>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        gap: 5,
        backgroundColor: colors.accent
    },

    label: {
        fontSize: 16,
        color: '#ffffff'
    }
});