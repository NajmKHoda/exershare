import { Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Plus } from 'lucide-react-native';

interface Props {
    onAdd: () => void;
}

export default function AddFooter({ onAdd }: Props) {
    const colors = useThemeColors();

    return (
        <Pressable
            onPress={ onAdd }
            style={{
                backgroundColor: colors.accent as string,
                ...styles.addButton 
            }}
        >
            <Plus size={24} color={colors.primary as string} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    addButton: {
        alignItems: 'center',
        paddingVertical: 10
    }
});
