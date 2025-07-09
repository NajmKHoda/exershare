import { ThemeColors, ThemeColorsProvider } from '@/lib/hooks/useThemeColors';
import { Slot } from 'expo-router';
import { PlatformColor } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/lib/hooks/useSession';
import { IncomingEntityProvider } from '@/lib/hooks/useIncomingEntity';
import { Inter_100Thin, Inter_200ExtraLight, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';

export default function RootLayout() {
    const [loaded, error] = useFonts({
        Inter_100Thin,
        Inter_200ExtraLight,
        Inter_400Regular,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    if (!loaded && !error) return null;

    return (
        <SessionProvider>
        <ThemeColorsProvider value={ themeColors }>
        <IncomingEntityProvider>
        <GestureHandlerRootView>
        <SafeAreaProvider>
            <Slot />
        </SafeAreaProvider>
        </GestureHandlerRootView>
        </IncomingEntityProvider>
        </ThemeColorsProvider>
        </SessionProvider>
    );
}

const themeColors: ThemeColors = {
    primary: PlatformColor('label'),
    secondary: PlatformColor('secondaryLabel'),
    accent: PlatformColor('link'),
    background: PlatformColor('systemBackground'),
    backgroundSecondary: PlatformColor('secondarySystemBackground'),
    separator: PlatformColor('opaqueSeparator'),

    red: PlatformColor('systemRed'),
    orange: PlatformColor('systemOrange'),
    yellow: PlatformColor('systemYellow'),
    green: PlatformColor('systemGreen'),
    blue: PlatformColor('systemBlue'),
    purple: PlatformColor('systemPurple'),
    gray: PlatformColor('systemGray')
}
