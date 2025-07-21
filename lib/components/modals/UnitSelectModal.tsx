import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { MeasurementSystem } from '@/lib/utils/units';
import { StyleSheet, Pressable, View, Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Text from '../theme/Text';
import { X } from 'lucide-react-native';
import { standardOutline, standardShadow } from '@/lib/standardStyles';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { useSQLiteContext } from 'expo-sqlite';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function UnitSelectModal({ visible, onClose }: Props) {
    const colors = useThemeColors();
    const styles = useResolvedStyles(stylesTemplate);
    const db = useSQLiteContext();

    const { units } = useUserPreferences();

    const handleSelectUnit = (newUnits: MeasurementSystem) => {
        db.runAsync('UPDATE user SET units = ?;', newUnits);
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaProvider>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Select Units</Text>
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <X size={24} color={colors.primary} />
                            </Pressable>
                        </View>
                        
                        <View style={styles.optionsContainer}>
                            <Pressable 
                                style={[
                                    styles.optionButton,
                                    units === 'metric' && styles.selectedOption
                                ]}
                                onPress={() => handleSelectUnit('metric')}
                            >
                                <Text style={[
                                    styles.optionText,
                                    units === 'metric' && styles.selectedOptionText
                                ]}>
                                    Metric (kg, km)
                                </Text>
                            </Pressable>
                            
                            <Pressable 
                                style={[
                                    styles.optionButton,
                                    units === 'imperial' && styles.selectedOption
                                ]}
                                onPress={() => handleSelectUnit('imperial')}
                            >
                                <Text style={[
                                    styles.optionText,
                                    units === 'imperial' && styles.selectedOptionText
                                ]}>
                                    Imperial (lbs, mi)
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </SafeAreaProvider>
        </Modal>
    );
}

const stylesTemplate = (colors: ThemeColors) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 16,
        padding: 20,
        ...standardShadow,
        ...standardOutline,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    optionsContainer: {
        marginTop: 10,
    },
    optionButton: {
        padding: 16,
        marginBottom: 10,
        backgroundColor: colors.background,
        ...standardOutline(colors),
    },
    selectedOption: {
        backgroundColor: colors.accent,
    },
    optionText: {
        fontSize: 16,
        textAlign: 'center',
    },
    selectedOptionText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
