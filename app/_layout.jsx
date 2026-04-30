import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
    const [session, setSession] = useState(undefined); // undefined = encara no sabem

    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        // comprovem sessió inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // escoltem canvis de login/logout
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session === undefined) return; // encara carregant
        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup) {
            router.replace('/(app)');
        }
    }, [session, segments]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
        </Stack>
    );
}