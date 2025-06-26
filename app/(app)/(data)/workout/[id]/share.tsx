import { useLocalSearchParams } from 'expo-router';
import ShareScreen from '@/lib/components/screens/ShareScreen';

export default function ShareWorkoutScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <ShareScreen
            id={id}
            type="workout"
            entityTable="workouts"
        />
    );
}
