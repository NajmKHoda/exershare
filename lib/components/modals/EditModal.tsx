import { Modal, View, StyleSheet, KeyboardAvoidingView } from 'react-native';
import TextButton from '../controls/TextButton';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Save, Trash, X } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onClose: () => unknown;
    onSave: () => unknown;
    onDelete?: () => unknown;
    children: React.ReactNode;
}

export default function EditModal({ visible, onClose, onSave, onDelete, children }: Props) {
    const colors = useThemeColors();

    return (
        <Modal
            visible={ visible }
            animationType='fade'
            transparent={ true }
            onRequestClose={ onClose }
        >
            <View style={ styles.overlay }>
                <KeyboardAvoidingView style={ styles.keyboardAvoidingView } behavior='height'>
                    <View style={[ styles.container, { backgroundColor: colors.background } ]}>
                        <View style={ styles.modalControls }>
                            <TextButton
                                label='Cancel'
                                Icon={X}
                                onPress={ onClose }
                                iconSize={ 20 }
                                style={ styles.control } />
                            <TextButton
                                label='Save'
                                Icon={ Save }
                                onPress={ onSave }
                                iconSize={ 24 }
                                style={ styles.control } />
                        </View>
                        { children }
                        { onDelete &&
                            <TextButton
                                label='Delete'
                                Icon={ Trash }
                                style={[ styles.deleteButton, { color: colors.red }]}
                                onPress={ onDelete } />
                        }
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'stretch',
        paddingHorizontal: 20
    },

    keyboardAvoidingView: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center'
    },

    container: {
        alignItems: 'stretch',
        maxHeight: '100%',
        padding: 20,
        gap: 25,
        borderRadius: 20,
    },

    modalControls: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    control: {
        fontSize: 20,
        lineHeight: 22
    },

    deleteButton: {
        fontSize: 20,
        lineHeight: 22
    }
});
