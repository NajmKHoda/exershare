import TextButton from '@/lib/components/controls/TextButton';
import Separator from '@/lib/components/lists/elements/Separator';
import ListItem from '@/lib/components/lists/ListItem';
import StandardList from '@/lib/components/lists/StandardList';
import Text from '@/lib/components/theme/Text';
import { resetDatabase } from '@/lib/data/database';
import { syncData } from '@/lib/data/sync';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { standardShadow } from '@/lib/standardStyles';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CircleUser, LogOut, LucideIcon, RefreshCw, UserX } from 'lucide-react-native';
import { Fragment, useMemo } from 'react';
import { Alert, ScrollView, SectionList, SectionListData, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SETTINGS_OPTIONS: SectionListData<SettingsOption, { title: string }>[] = [
    {
        title: 'data',
        data: [
            {
                id: 'clean-and-resync',
                title: 'Clean and Resync',
                icon: RefreshCw,
            }
        ]
    }
];

export default function SettingsLayout() {
    const db = useSQLiteContext();
    const colors = useThemeColors();
    const router = useRouter();
    const styles = useResolvedStyles(stylesTemplate);

    const callbacks: Record<string, () => void> = useMemo(() => ({
        'clean-and-resync': () => {
            Alert.alert(
                'Clean and Resync',
                `This will delete all local data and resync from the server.
Are you sure you want to continue?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Yes',
                        style: 'destructive',
                        onPress: async () => {
                            await resetDatabase(db);
                            await syncData(db);
                        }
                    }
                ]
            )
        },
    }), [db])

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.profileContainer}>
                <CircleUser size={128} color={colors.primary} />
                <View style={styles.profileDetails}>
                    <Text style={styles.username}>Username</Text>
                    <Text>Joined 01/01/2025</Text>
                    <TextButton
                        label='Log Out'
                        Icon={LogOut}
                        onPress={() => {
                            supabase.auth.signOut()
                            .then(() => router.push('/login'))
                        }}
                    />
                </View>
            </SafeAreaView>
            <ScrollView style={styles.body}>
                {SETTINGS_OPTIONS.map((section) => (
                    <Fragment key={section.title}>
                        <Text style={styles.sectionHeader} key={section.title}>
                            {section.title.toUpperCase()}
                        </Text>
                        <StandardList
                            data={section.data}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <ListItem
                                    key={item.id}
                                    label={item.title}
                                    Icon={item.icon}
                                    onPress={() => callbacks[item.id]?.()}
                                />
                            )}
                        />
                    </Fragment>
                ))}
            </ScrollView>
        </View>
    );
}

const stylesTemplate = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'stretch',
        backgroundColor: colors.background
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 24,
        paddingHorizontal: 32,
        backgroundColor: colors.backgroundSecondary,

        ...standardShadow,
        shadowOffset: { width: 0, height: 3 },
    },
    profileDetails: {
        gap: 8
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    body: {
        flex: 1,
        padding: 24,
    },
    optionsList: {
        flex: 1,
    },
    optionsListContent: {
        backgroundColor: colors.backgroundSecondary,
    },
    sectionHeader: {
        fontWeight: 'ultralight',
        marginBottom: 8,
    }
});

interface SettingsOption {
    id: string;
    title: string;
    icon: LucideIcon;
}