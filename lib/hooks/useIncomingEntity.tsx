import { createContext, useContext, useState, PropsWithChildren } from 'react';
import { RawExercise } from '../data/Exercise';
import { FullRawWorkout } from '../data/Workout';
import { FullRawRoutine } from '../data/Routine';

type IncomingEntityData = {
    type: 'exercise';
    data: {
       exercise: RawExercise;
    }
} | {
    type: 'workout';
    data: {
        workout: FullRawWorkout;
        exercises: RawExercise[];
    }
} | {
    type: 'routine';
    data: {
        routine: FullRawRoutine;
        workouts: FullRawWorkout[];
        exercises: RawExercise[];
    }
}

type IncomingEntityType = IncomingEntityData | null;

interface IncomingEntityContextValue {
    incomingEntity: IncomingEntityType;
    setIncomingEntity: (entity: IncomingEntityType) => void;
    clearIncomingEntity: () => void;
}

const IncomingEntityContext = createContext<IncomingEntityContextValue | null>(null);

export function IncomingEntityProvider({ children }: PropsWithChildren) {
    const [incomingEntity, setIncomingEntity] = useState<IncomingEntityType>(null);

    const clearIncomingEntity = () => setIncomingEntity(null);

    return (
        <IncomingEntityContext.Provider value={{
            incomingEntity,
            setIncomingEntity,
            clearIncomingEntity
        }}>
            {children}
        </IncomingEntityContext.Provider>
    );
}

export function useIncomingEntity() {
    const context = useContext(IncomingEntityContext);
    if (!context) {
        throw new Error('useIncomingEntity must be used within an IncomingEntityProvider');
    }
    return context;
}