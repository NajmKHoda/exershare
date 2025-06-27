import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextButton from '../controls/TextButton';
import { ChevronLeft, Save, Trash, Share2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import ThemeText from '../theme/ThemeText';

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
     
    return (
        <View style={resolvedStyles.container}>
            <SafeAreaView edges={['top']} style={resolvedStyles.header}>
                <TextButton label="Back" style={resolvedStyles.back} Icon={ChevronLeft} onPress={() => router.back()} />
                <ThemeText style={resolvedStyles.title}>{title}</ThemeText>
                {entityId && !isNewEntity && (
                    <TextButton 
                        label="Share" 
                        style={resolvedStyles.shareButton} 
                        Icon={Share2} 
                        onPress={handleShare} 
                    />
                )}
            </SafeAreaView>
            <View style={resolvedStyles.childrenContainer}>
                {children}
            </View>
            <SafeAreaView edges={['bottom']} style={{ ...resolvedStyles.footer, justifyContent: isNewEntity ? 'flex-end' : 'space-between' }}>
                {!isNewEntity &&
                <TextButton label="Delete" style={resolvedStyles.deleteControl} Icon={Trash} onPress={onDelete} />}
                <TextButton label="Save" style={resolvedStyles.control} Icon={Save} onPress={onSave} />
            </SafeAreaView>
        </View>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 10,
        backgroundColor: colors.backgroundSecondary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: colors.backgroundSecondary,
    },
    control: {
        fontSize: 22
    },
    deleteControl: {
        fontSize: 22,
        color: colors.red
    },
    back: {
        fontSize: 20,
        textAlign: 'left'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 28,
        textAlign: 'center',
        flex: 1
    },
    shareButton: {
        fontSize: 20,
        color: colors.primary
    },
    childrenContainer: {
        flex: 1,
        gap: 16,
        padding: 20
    },
});