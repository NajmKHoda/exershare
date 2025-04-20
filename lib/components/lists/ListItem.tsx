import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '@/lib/components/theme/ThemeText';
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

    return (
        <Pressable
            style={{
                backgroundColor: colors.backgroundSecondary,
                ...styles.container
            }}
            onPress={ onPress }
        >
            <ThemeText style={ styles.label }>{ label }</ThemeText>
            <Icon
                size={ iconSize ?? 24 }
                color={ iconColor ?? colors.primary as string } />
        </Pressable>
    );
}

const styles = StyleSheet.create({
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