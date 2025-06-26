import { useLocalSearchParams } from 'expo-router';
import ShareScreen from '@/lib/components/screens/ShareScreen';

export default function ShareRoutineScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <ShareScreen
            id={id}
            type="routine"
            entityTable="routines"
        />
    );
}
