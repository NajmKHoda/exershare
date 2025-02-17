import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface Props {
    visible: boolean;
    onClose?: () => void;
    children: React.ReactNode;
}

export default function SlideUpModal({ visible, onClose, children }: Props) {
    const colors = useThemeColors();

    return (
        <Modal
            animationType="slide"
            transparent={ true }
            visible={ visible }
            onRequestClose={ onClose }
        >
            <SafeAreaProvider>
                <SafeAreaView style={ styles.safeArea } edges={[ 'top' ]}>
                    <View style={[ styles.container, { backgroundColor: colors.background } ]}>
                        {children}
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        alignItems: 'stretch',
        paddingTop: 20
    },
    container: {
        flex: 1,
        alignItems: 'stretch',
        gap: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
});
