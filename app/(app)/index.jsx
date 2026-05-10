import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView, //evita que el teclat tapi l'input
  Platform,  //detecta si estem a ios o android
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../context/useAuthStore';
import { supabase } from '../../lib/supabase';


export default function ChatScreen() {
    const { session, clearAuth  } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
  // per poder fer scroll programàticament
    const flatListRef = useRef(null);
  

     useEffect(() => {
    // càrrega inicial de missatges
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('missatges')
        .select(`
          id,
          content,
          user_id,
          created_at,
          profiles ( display_name )
        `)
        .order('created_at', { ascending: true });

      if (error) console.error('Error carregant missatges:', error.message);
      else setMessages(data);

      setLoading(false); 
    };

    fetchMessages();

    const channel = supabase
      .channel('missatges-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'missatges' },
        async (payload) => {
          const { data } = await supabase
            .from('missatges')
            .select(`
              id,
              content,
              user_id,
              created_at,
              profiles ( display_name )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) setMessages((prev) => [...prev, data]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText('');

    const { error } = await supabase.from('missatges').insert({
      user_id: session.user.id,
      content: trimmed,
    });

    if (error) console.error('Error enviant missatge:', error.message);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.user_id === session.user.id;
    const displayName = item.profiles?.display_name || 'Usuari';

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {!isOwn && <Text style={styles.displayName}>{displayName}</Text>}
          <Text style={isOwn ? styles.textOwn : styles.textOther}>{item.content}</Text>
          <Text style={[styles.time, isOwn && styles.timeOwn]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Xat general</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sortir</Text>
        </TouchableOpacity>
      </View>
      
       {/* ── LLISTA DE MISSATGES ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* ── INPUT + BOTÓ ENVIAR ── */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escriu un missatge..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  logoutButton: {
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logoutText: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── missatges ──
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  bubbleOwn: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 2,
  },
  displayName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
    marginBottom: 2,
  },
  textOwn: {
    color: '#fff',
    fontSize: 15,
  },
  textOther: {
    color: '#1a1a1a',
    fontSize: 15,
  },
  time: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },

  // ── input ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

