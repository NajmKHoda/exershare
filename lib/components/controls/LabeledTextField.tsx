import { View, TextInput, StyleSheet } from 'react-native';
import Text from '../theme/Text';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';

interface Props {
    name: string;
    initialValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

export default function LabeledTextField({ name, initialValue, value, onValueChange }: Props) {
    const colors = useThemeColors();
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <View style={resolvedStyles.container}>
            <Text style={resolvedStyles.label}>{name}:</Text>
            <View style={resolvedStyles.inputContainer}>
                <TextInput
                    style={resolvedStyles.input}
                    value={value}
                    defaultValue={initialValue}
                    onChangeText={onValueChange}
                />
            </View>
        </View>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
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
        borderBottomWidth: 2,
        borderBottomColor: colors.primary
    },

    input: {
        flex: 1,
        fontSize: 20,
        lineHeight: 22,
        color: colors.primary
    },
});