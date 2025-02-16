import { Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { SymbolView } from 'expo-symbols';

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
            <SymbolView name='plus' size={ 24 } tintColor={ colors.primary as string } />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    addButton: {
        alignItems: 'center',
        paddingVertical: 10
    }
});
