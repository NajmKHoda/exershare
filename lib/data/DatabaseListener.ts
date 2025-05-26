import { useNetworkState } from 'expo-network';
import { useEffect } from 'react';
import { syncData } from './sync';
import { useSQLiteContext } from 'expo-sqlite';
import { useSession } from '../hooks/useSession';

export default function DatabaseListener() {
    const db = useSQLiteContext();
    const { session, isSessionLoading } = useSession();
    const { isInternetReachable } = useNetworkState();

    useEffect(() => {
        if (isInternetReachable && session) {
            syncData(db);
        }
    }, [isInternetReachable, session, isSessionLoading]);
    
    return null;
}