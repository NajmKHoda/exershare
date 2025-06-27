import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

export default function useSQLiteQuery<T>(query: string, multiple: true): [T[], QueryRefresher, boolean];
export default function useSQLiteQuery<T>(query: string, multiple?: false): [T | null, QueryRefresher, boolean];
export default function useSQLiteQuery<T>(query: string, multiple: boolean = false) {
    const db = useSQLiteContext();
    const [result, setResult] = useState<T[] | T | null>(multiple ? [] : null);
    const [done, setDone] = useState(false);
    const [queryTrigger, setQueryTrigger] = useState(true);

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

    function rerunQuery() {
        setQueryTrigger(prev => !prev);
    }

    return [result, rerunQuery, done] as const;
}

type QueryRefresher = () => void;