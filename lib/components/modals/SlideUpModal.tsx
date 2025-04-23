import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
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
    const resolvedStyles = useResolvedStyles(styles);

    return (
        <Modal
            animationType="slide"
            transparent={ true }
            visible={ visible }
            onRequestClose={ onClose }
        >
            <SafeAreaProvider>
                <SafeAreaView style={ resolvedStyles.safeArea } edges={[ 'top' ]}>
                    <View style={ resolvedStyles.container }>
                        <View style={ resolvedStyles.controls }>
                            <TextButton
                                label='Back'
                                Icon={ChevronLeft}
                                style={ resolvedStyles.backButton }
                                onPress={ onClose } />
                            { additionalControls }
                        </View>
                        { title && <ThemeText style={ resolvedStyles.title }>{ title }</ThemeText> }
                        { children }
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
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
        backgroundColor: colors.background
    },

    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    backButton: {
        fontSize: 20
    },

    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold'
    }
});
