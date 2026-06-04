import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../context/useAuthStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    const { session, setAuth } = useAuthStore();

    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        // comprovem sessió inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuth(session);
        });

        // escoltem canvis de login/logout
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setAuth(session);
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
    <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}></Stack>      
    </SafeAreaProvider>
       
    );
}