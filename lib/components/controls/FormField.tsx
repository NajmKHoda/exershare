import { KeyboardTypeOptions, Pressable, StyleProp, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import Text from '../theme/Text';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { useState } from 'react';
import { Eye, EyeClosed } from 'lucide-react-native';

interface FormFieldProps {
    name: string;
    isPassword?: boolean;
    keyboardType?: KeyboardTypeOptions;
    value: string;
    onChange: (value: string) => void;
    style?: StyleProp<ViewStyle>;
}

export default function FormField({ name, isPassword = false, keyboardType = 'default', value, onChange, style: userStyle }: FormFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <View style={[resolvedStyles.container, userStyle]}>
            <Text style={resolvedStyles.label}>{ name.toUpperCase() }</Text>
            <View style={resolvedStyles.fieldContainer}>
                <TextInput
                    keyboardType={keyboardType}
                    style={resolvedStyles.input}
                    secureTextEntry={isPassword && !showPassword}
                    value={value}
                    onChangeText={onChange}
                />
                {isPassword && (
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                        { showPassword ? <Eye /> : <EyeClosed /> }
                    </Pressable>
                )}
            </View>
        </View>
    )
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        alignSelf: 'stretch',
    },
    label: {
        fontWeight: 'thin',
        marginBottom: 2,
    },
    fieldContainer: {
        flexDirection: 'row',
        padding: 10,
        gap: 5,
        borderRadius: 10,
        backgroundColor: colors.backgroundSecondary,
    },
    input: {
        flex: 1,
        minHeight: 24,
        color: colors.primary,
    }
})