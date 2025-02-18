import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Routine } from '../data/Routine';
import { useSQLiteContext } from 'expo-sqlite';

interface ActiveRoutineContext {
    activeRoutine: Routine | null,
    refreshActiveRoutine: () => unknown
}

const ActiveRoutineContext = createContext<ActiveRoutineContext | null>(null);

export function ActiveRoutineProvider({ children }: PropsWithChildren) {
    const db = useSQLiteContext();
    const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

    async function refreshActiveRoutine() {
        const routine = await Routine.pullActive(db);
        setActiveRoutine(routine);
    }

    useEffect(() => { refreshActiveRoutine() }, []);

    return (
        <ActiveRoutineContext.Provider value={{ activeRoutine, refreshActiveRoutine }}>
            { children }
        </ActiveRoutineContext.Provider>
    );
}

export function useActiveRoutine() {
    const context = useContext(ActiveRoutineContext);
    if (!context) {
        throw new Error('useActiveRoutine must be used within an ActiveRoutineProvider');
    }

    return context;
}