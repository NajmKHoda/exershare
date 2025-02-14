import { View, TextInput, StyleSheet } from 'react-native';
import ThemeText from '../theme/ThemeText';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

interface Props {
    name: string;
    initialValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

export default function LabeledTextField({ name, initialValue, value, onValueChange }: Props) {
    const colors = useThemeColors();

    return (
        <View style={ styles.container }>
            <ThemeText style={ styles.label }>{ name }:</ThemeText>
            <View style={[ styles.inputContainer, { borderBottomColor: colors.primary } ]}>
                <TextInput
                    style={[ styles.input, { color: colors.primary } ]}
                    value={ value }
                    defaultValue={ initialValue }
                    onChangeText={ onValueChange }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        alignSelf: 'stretch',
        gap: 5
    },

    label: {
        fontSize: 20,
        lineHeight: 22,
        fontWeight: 600
    },

    inputContainer: {
        flexDirection: 'row',
        flex: 1,
        borderBottomWidth: 2
    },

    input: {
        flex: 1,
        fontSize: 20,
        lineHeight: 22
    },
});