import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TextButton from '../controls/TextButton';
import ThemeText from '../theme/ThemeText';
import { ChevronLeft } from 'lucide-react-native';

interface Props {
    visible: boolean,
    onClose?: () => void,
    title?: string,
    additionalControls?: React.ReactNode,
    children?: React.ReactNode
}

export default function SlideUpModal({ visible, title, onClose, additionalControls, children }: Props) {
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
                        <View style={ styles.controls }>
                            <TextButton
                                label='Back'
                                Icon={ChevronLeft}
                                style={{ fontSize: 20 }}
                                onPress={ onClose } />
                            { additionalControls }
                        </View>
                        { title && <ThemeText style={ styles.title }>{ title }</ThemeText> }
                        { children }
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

    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold'
    }
});
