import { addDatabaseChangeListener } from 'expo-sqlite';
import { createContext, useContext, useEffect, useRef, useCallback } from 'react';

const DatabaseListenerContext = createContext<{
    addChangeListener: (tableName: string, listener: ListenerCallback) => void;
    removeChangeListener: (tableName: string, listener: ListenerCallback) => void;
} | null>(null);

export function DatabaseListenerProvider ({ children }: { children: React.ReactNode }) {
    const listeners = useRef<Map<string, Set<ListenerCallback>>>(new Map());

    useEffect(() => {
        const masterListener = addDatabaseChangeListener(({ tableName, rowId }) => {
            const listenerSet = listeners.current.get(tableName);
            if (listenerSet) {
                listenerSet.forEach(listener => listener(rowId));
            }
        })

        return () => masterListener.remove();
    }, []);

    const addChangeListener = useCallback((tableName: string, listener: ListenerCallback) => {
        let listenerSet = listeners.current.get(tableName);
        if (!listenerSet) {
            listenerSet = new Set();
            listeners.current.set(tableName, listenerSet);
        }
        listenerSet.add(listener);
    }, []);

    const removeChangeListener = useCallback((tableName: string, listener: ListenerCallback) => {
        listeners.current.get(tableName)?.delete(listener);
    }, []);

    return (
        <DatabaseListenerContext.Provider value={{ addChangeListener, removeChangeListener }}>
            {children}
        </DatabaseListenerContext.Provider>
    );
}

export function useDatabaseListener(tableName: string, listener: (rowId: number) => void) {
    const context = useContext(DatabaseListenerContext);
    if (!context) {
        throw new Error('useDatabaseListener must be used within a DatabaseListenerProvider');
    }

    const listenerRef = useRef(listener);
    listenerRef.current = listener;
    
    const stableListener = useCallback((rowId: number) => {
        listenerRef.current(rowId);
    }, []);

    useEffect(() => {
        context.addChangeListener(tableName, stableListener);
        return () => {
            context.removeChangeListener(tableName, stableListener);
        };
    }, [context, tableName, stableListener]);
}

type ListenerCallback = (rowId: number) => void;