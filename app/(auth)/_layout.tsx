import ThemeText from '@/lib/components/theme/ThemeText';
import { Slot } from 'expo-router';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';

export default function AuthLayout() {
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <LinearGradient colors={['#00bfff', '#00e98a']} style={resolvedStyles.background}>
            <KeyboardAvoidingView behavior='padding' style={resolvedStyles.container}>
                <View style={resolvedStyles.formContainer}>
                    <ThemeText style={resolvedStyles.title}>Exershare</ThemeText>
                    <Slot />
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    )
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    formContainer: {
        padding: 24,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: colors.background,
    },
    title: {
        marginBottom: 48,
        fontSize: 48,
        fontWeight: 'bold',
    },
});