import { Pressable, StyleSheet } from 'react-native';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { Plus } from 'lucide-react-native';

interface Props {
    onAdd: () => void;
}

export default function AddFooter({ onAdd }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <Pressable
            onPress={onAdd}
            style={resolvedStyles.addButton}
        >
            <Plus size={24} color={colors.primary as string} />
        </Pressable>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    addButton: {
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        backgroundColor: colors.accent
    }
});
