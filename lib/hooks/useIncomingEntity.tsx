import { createContext, useContext, useState, PropsWithChildren } from 'react';
import { Exercise, RawExercise } from '../data/Exercise';
import { FullRawWorkout, Workout } from '../data/Workout';
import { FullRawRoutine, Routine } from '../data/Routine';

type IncomingEntityData = {
    type: 'exercise';
    data: {
       exercise: Exercise;
    }
} | {
    type: 'workout';
    data: {
        workout: Workout;
        exercises: Exercise[];
    }
} | {
    type: 'routine';
    data: {
        routine: Routine;
        workouts: Workout[];
        exercises: Exercise[];
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
        throw new Error('No incoming entity available.');
    }
    return context;
}