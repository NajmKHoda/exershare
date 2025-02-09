import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { StyleSheet, View } from 'react-native';
import ThemeText from '@/lib/components/theme/ThemeText';
import { SymbolView } from 'expo-symbols';

interface Props {
    label: string
}

export default function ListItem({ label }: Props) {
    const colors = useThemeColors();

    return (
        <View
            style={{
                backgroundColor: colors.backgroundSecondary,
                ...styles.container
            }}
        >
            <ThemeText style={ styles.label }>{ label }</ThemeText>
            <SymbolView
                name='chevron.right'
                size={ 24 }
                tintColor={ colors.primary as string } />
        </View>
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