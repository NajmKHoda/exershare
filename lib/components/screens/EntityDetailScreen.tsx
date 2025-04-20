import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextButton from '../controls/TextButton';
import { ChevronLeft, Save, Trash } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import ThemeText from '../theme/ThemeText';

interface EntityDetailScreenProps {
    onSave: () => unknown;
    onDelete: () => unknown;
    title: string;
    children: ReactNode;
    isNewEntity: boolean;
}

export default function EntityDetailScreen({ title, onSave, onDelete, children, isNewEntity }: EntityDetailScreenProps) {
    const router = useRouter();
    const colors = useThemeColors();
     
    return (
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
            <SafeAreaView edges={['top']} style={{ ...styles.header, backgroundColor: colors.backgroundSecondary }}>
                <TextButton label="Back" style={styles.back} Icon={ChevronLeft} onPress={() => router.back()} />
                <ThemeText style={styles.title}>{title}</ThemeText>
            </SafeAreaView>
            <View style={styles.childrenContainer}>
                {children}
            </View>
            <SafeAreaView edges={['bottom']} style={{
                ...styles.footer,
                backgroundColor: colors.backgroundSecondary,
                justifyContent: isNewEntity ? 'flex-end' : 'space-between'
            }}>
                {!isNewEntity &&
                <TextButton label="Delete" style={{...styles.control, color: colors.red}} Icon={Trash} onPress={onDelete} />}
                <TextButton label="Save" style={styles.control} Icon={Save} onPress={onSave} />
            </SafeAreaView>
        </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    control: {
        fontSize: 22
    },
    back: {
        fontSize: 20,
        alignSelf: 'flex-start',
        textAlign: 'left'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 28,
        textAlign: 'center',
    },
    childrenContainer: {
        flex: 1,
        gap: 16,
        padding: 20
    },
});