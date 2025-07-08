import TextButton from '@/lib/components/controls/TextButton';
import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export default function SettingsLayout() {
    const resolvedStyles = useResolvedStyles(stylesTemplate);
    const router = useRouter();

    return (
        <View style={resolvedStyles.container}>
            <TextButton
                label='Log out'
                Icon={LogOut}
                onPress={() => {
                    supabase.auth.signOut();
                    router.push('/login');
                }}
            />
        </View>
    );
}

const stylesTemplate = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        backgroundColor: colors.background
    }
});