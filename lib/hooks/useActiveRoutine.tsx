import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Routine } from '../data/Routine';
import { useSQLiteContext } from 'expo-sqlite';
import { useDatabaseListener } from './useDatabaseListener';

const ActiveRoutineContext = createContext<Routine | null>(null);

export function ActiveRoutineProvider({ children }: PropsWithChildren) {
    const db = useSQLiteContext();
    const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

    async function refreshActiveRoutine() {
        const routine = await Routine.pullActive(db);
        setActiveRoutine(routine);
    }

    // Avoids expensive re-fetching if something else changes in the user table
    async function needToRefresh() {
        const currentId = await db.getFirstAsync<string>('SELECT active_routine_id FROM user');
        const activeId = activeRoutine?.id ?? null;
        if (activeId !== currentId) {
            await refreshActiveRoutine();
        }
    }

    useEffect(() => { refreshActiveRoutine() }, []);
    useDatabaseListener('user', needToRefresh);

    return (
        <ActiveRoutineContext.Provider value={activeRoutine}>
            { children }
        </ActiveRoutineContext.Provider>
    );
}

export const useActiveRoutine = () => useContext(ActiveRoutineContext);