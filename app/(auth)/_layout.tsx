import Text from '@/lib/components/theme/Text';
import { Slot } from 'expo-router';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
    const styles = useResolvedStyles(stylesTemplate);

    return (
        <LinearGradient colors={['#00bfff', '#00e98a']} style={styles.background}>
            <SafeAreaView edges={['top']} style={styles.background}>
                <KeyboardAvoidingView behavior='padding' style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <View style={styles.formContainer}>
                            <Text style={styles.title}>Exershare</Text>
                            <Slot />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    )
}

const stylesTemplate = (colors: ThemeColors) => StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    scrollContainer: {
        flex: 1,
        justifyContent: 'center',
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