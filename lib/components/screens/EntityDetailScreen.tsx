import { ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextButton from '../controls/TextButton';
import { ChevronLeft, Save, Trash, Share2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import Text from '../theme/Text';
import { standardShadow } from '@/lib/standardStyles';

interface EntityDetailScreenProps {
    onSave: () => unknown;
    onDelete: () => unknown;
    title: string;
    children: ReactNode;
    isNewEntity: boolean;
    entityId?: string;
}

export default function EntityDetailScreen({ 
    title, 
    onSave, 
    onDelete, 
    children, 
    isNewEntity,
    entityId
}: EntityDetailScreenProps) {
    const router = useRouter();
    const resolvedStyles = useResolvedStyles(styles);
    
    const handleShare = () => {
        router.push(`./${entityId}/share/`);
    };

    const handleDelete = () => {
        if (!entityId) return;

        Alert.alert(
            `Delete ${title}`,
            `Are you sure you want to delete this ${title.toLowerCase()}?\nThis action cannot be undone.`,
            [
                { text: 'Delete', style: 'destructive', onPress: onDelete },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };
     
    return (
        <View style={resolvedStyles.container}>
            <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                <View style={resolvedStyles.backContainer}>
                    <TextButton label="Back" style={resolvedStyles.back} Icon={ChevronLeft} onPress={() => router.back()} />
                </View>
                <View style={resolvedStyles.titleContainer}>
                    <Text style={resolvedStyles.title}>{title}</Text>
                </View>
                <View style={resolvedStyles.shareContainer}>
                    {entityId && !isNewEntity && (
                        <TextButton
                            label="Share"
                            style={resolvedStyles.shareButton}
                            Icon={Share2}
                            onPress={handleShare}
                        />
                    )}
                </View>
            </SafeAreaView>
            <View style={resolvedStyles.childrenContainer}>
                {children}
            </View>
            <SafeAreaView edges={['bottom']} style={{ ...resolvedStyles.footer, justifyContent: isNewEntity ? 'flex-end' : 'space-between' }}>
                {!isNewEntity &&
                <TextButton label="Delete" style={resolvedStyles.deleteControl} Icon={Trash} onPress={handleDelete} />}
                <TextButton label="Save" style={resolvedStyles.control} Icon={Save} onPress={onSave} />
            </SafeAreaView>
        </View>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 10,
        backgroundColor: colors.backgroundSecondary,
        flexDirection: 'row',
        alignItems: 'center',

        ...standardShadow,
        shadowOffset: { width: 0, height: 3}
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: colors.backgroundSecondary,

        ...standardShadow,
        shadowOffset: { width: 0, height: -3 }
    },
    control: {
        fontSize: 22
    },
    deleteControl: {
        fontSize: 22,
        color: colors.red
    },
    backContainer: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        alignItems: 'flex-start',
    },
    titleContainer: {
        flexGrow: 2,
        flexShrink: 1,
        flexBasis: 0,
        alignItems: 'center',
    },
    shareContainer: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 1,
        alignItems: 'flex-end',
    },
    back: {
        fontSize: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 28,
        textAlign: 'center',
    },
    shareButton: {
        fontSize: 20,
        color: colors.primary,
        flex: 1,
    },
    childrenContainer: {
        flex: 1,
        gap: 16,
        padding: 20
    },
});