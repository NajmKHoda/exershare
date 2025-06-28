import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useDatabaseListener } from './useDatabaseListener';

export default function useSQLiteQuery<T>(query: string, multiple: true, tableName: string): [T[], QueryRefresher, boolean];
export default function useSQLiteQuery<T>(query: string, multiple: false, tableName: string): [T | null, QueryRefresher, boolean];
export default function useSQLiteQuery<T>(query: string, multiple: boolean = false, tableName: string) {
    const db = useSQLiteContext();
    const [result, setResult] = useState<T[] | T | null>(multiple ? [] : null);
    const [done, setDone] = useState(false);
    const [queryTrigger, setQueryTrigger] = useState(true);

    useDatabaseListener(tableName, rerunQuery);

    useEffect(() => {
        let isMounted = true;
        setDone(false);

        async function fetchData() {
            try {
                const res = multiple
                    ? await db.getAllAsync<T>(query) // Returns T[]
                    : await db.getFirstAsync<T>(query); // Returns T | null
                if (isMounted) setResult(res as any);
            } catch (err) {
                console.error("SQLite Query Error:", err);
            } finally {
                if (isMounted) setDone(true);
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [query, multiple, queryTrigger]);

    async function rerunQuery() {
        setQueryTrigger(prev => !prev);
    }

    return [result, rerunQuery, done];
}

type QueryRefresher = () => void;