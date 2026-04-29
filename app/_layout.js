import { use, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../supabase'; 
import { useAuthStore } from '../context/useAuthStore';

export default function RootLayout() {
    //agafem les dades del zustand
    const { session, isInitialized, setAuth } = useAuthStore();

    const router = useRouter();
    const segments = useSegments();

    //comprovar si hi ha sessió iniciada
    useEffect(() => {
        //preguntem a supabase si l'user ja estava loguejat
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuth(session); //guardem la sessió a zustand
        });

        //ensperem a evure si l'user fa login o logout
        const { data: {subscription} } = supabase.auth.onAuthStateChange((event, session) => {
            setAuth(session); //actualitzem la sessió a zustand
        });

        return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
        //si té sessió iniciada i a la pantalla de login la portem al xat
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
        //si no té sessió iniciada i a la pantalla de xat la portem al login
      router.replace('/(app)');
    }
}, [session, segments, isInitialized]);

//estructura bàsica
return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}