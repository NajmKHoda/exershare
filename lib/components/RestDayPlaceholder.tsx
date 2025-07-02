import { Image, StyleSheet, View } from 'react-native';
import Text from './theme/Text';
import { Images } from '@/assets/images/images';

export default function RestDayPlaceholder() {
    return (
        <View style={ styles.container }>
            <Text>Kick back and relax. You've earned it!</Text>
            <Image style={ styles.image } source={ Images.personSleeping } />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },

    image: {
        width: 280,
        height: 240
    }
});