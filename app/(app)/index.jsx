import React from 'react';
import { supabase } from '../../lib/supabase';
import { View, Text, TouchableOpacity } from 'react-native';

export default function HomeScreen() {

    const handleLogout = async () => {
    await supabase.auth.signOut();
    // no cal fer router.replace manualment —
    // onAuthStateChange del _layout detecta el logout i redirigeix sol
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Pantalla de chat</Text>

      <TouchableOpacity onPress={handleLogout}>
      <Text>Logout</Text>
    </TouchableOpacity>
    </View>

    
  );

}