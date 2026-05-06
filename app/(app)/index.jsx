import React from 'react';
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
    const { session } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
  // per poder fer scroll programàticament
    const flatListRef = useRef(null);

    const { clearAuth } = useAuthStore();

    const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth(); // crida a l'acció per netejar la sessió automaticament
    // no cal fer router.replace manualment —
    // onAuthStateChange del _layout detecta el logout i redirigeix sol
  };

    useEffect(() => {
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
        .order('created_at', { ascending: true }); // els més antics primer

      if (!error) setMessages(data); // guardem els missatges a l'estat
      setLoading(false);
    };

    fetchMessages(); // executem la càrrega inicial

    // subscripció realtime: supabase avisa quan s'insereix un missatge nou
    const channel = supabase
      .channel('missatges-channel')
      .on(
        'postgres_changes',          // escolta canvis a la base de dades
        { event: 'INSERT', schema: 'public', table: 'missatges' }, // només insercions a missatges
        async (payload) => {
          // payload.new conté el nou missatge, però sense el JOIN de profiles
          // per tant fem una consulta addicional per obtenir el display_name
          const { data } = await supabase
            .from('missatges')
            .select(`
              id,
              content,
              user_id,
              created_at,
              profiles ( display_name )
            `)
            .eq('id', payload.new.id) // busquem el missatge pel seu id
            .single();                // esperem un sol resultat

          // afegim el nou missatge al final de la llista sense re-carregar tot
          if (data) setMessages((prev) => [...prev, data]);
        }
      )
      .subscribe(); // activem la subscripció

    // cleanup: quan el component es desmunta, cancel·lem la subscripció
    // això evita memory leaks i missatges duplicats
    return () => supabase.removeChannel(channel);
  }, []); // [] = només s'executa una vegada, quan es munta el component

  // cada vegada que la llista de missatges canvia, fem scroll automàtic al final
  useEffect(() => {
    if (messages.length > 0) {
      // setTimeout de 100ms per esperar que la FlatList hagi re-renderitzat
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]); // s'executa cada vegada que messages canvia

  // funció que s'executa quan l'usuari prem el botó d'enviar
  const handleSend = async () => {
    const trimmed = text.trim(); // eliminem espais al principi i final
    if (!trimmed) return;        // si està buit no fem res

    setText(''); // buidem l'input immediatament (no esperem la resposta de supabase)

    // inserim el missatge a la base de dades
    const { error } = await supabase.from('missatges').insert({
      user_id: session.user.id, // id de l'usuari que envia
      content: trimmed,         // text del missatge
      // created_at es genera automàticament a la base de dades
    });

    if (error) console.error('Error enviant missatge:', error.message);
    // si va bé, no cal fer res més:
    // el canal realtime detecta l'INSERT i afegeix el missatge a la llista
  };

  // funció perquè funcioni l'hora del missatge
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // funció que renderitza cada missatge de la llista
  // item és un missatge de l'array messages
  const renderMessage = ({ item }) => {
    // comprovem si el missatge és nostre comparant l'id de l'usuari
    const isOwn = item.user_id === session.user.id;

    // agafem el display_name del join amb profiles
    // si no existeix (per algun error) mostrem "Usuari" per defecte
    const displayName = item.profiles?.display_name || 'Usuari';

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleLogout}>
                <Text>Logout</Text>
            </TouchableOpacity>
        </View>
    );

    return (

      // messageRow és el contenidor de cada missatge
      // si és nostre l'alineem a la dreta amb messageRowOwn
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>

        {/* bubble és la bombolla del missatge
            color lila si és nostre, blanc si és d'un altre */}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>

          {/* només mostrem el nom si el missatge NO és nostre */}
          {!isOwn && (
            <Text style={styles.displayName}>{displayName}</Text>
          )}

          {/* text del missatge */}
          <Text style={isOwn ? styles.textOwn : styles.textOther}>{item.content}</Text>

          {/* hora d'enviament, alineada a la dreta de la bombolla */}
          <Text style={[styles.time, isOwn && styles.timeOwn]}>
            {formatTime(item.created_at)}
          </Text>

        </View>
      </View>
    );
  };

  // mentre es carreguen els missatges inicials mostrem simbol de càrrega centrat
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    // KeyboardAvoidingView puja el contingut quan apareix el teclat
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}                    // referència per fer scroll
        data={messages}                      // array de missatges
        keyExtractor={(item) => item.id}     // id únic per cada element
        renderItem={renderMessage}           // funció que renderitza cada missatge
        contentContainerStyle={styles.messagesList}
        // quan la llista es munta per primera vegada fem scroll al final sense animació
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* barra inferior amb l'input i el botó d'enviar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escriu un missatge..."
          placeholderTextColor="#999"
          value={text}                       // valor controlat per l'estat
          onChangeText={setText}             // actualitza l'estat quan l'usuari escriu
          multiline                          // permet múltiples línies
        />

        {/* botó d'enviar, desactivat si l'input està buit */}
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}            // no es pot clicar si no hi ha text
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                    // ocupa tota la pantalla
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'flex-start', // missatges aliens alineats a l'esquerra
  },
  messageRowOwn: {
    justifyContent: 'flex-end',   // missatges propis alineats a la dreta
  },
  bubble: {
    maxWidth: '75%',              // la bombolla no ocupa tota l'amplada
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  bubbleOwn: {
    backgroundColor: '#4f46e5',   // lila per als meus missatges
    borderBottomRightRadius: 4,   // cantonada punxeguda a baix a la dreta
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,    // cantonada punxeguda a baix a l'esquerra
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    color: 'rgba(255,255,255,0.7)', // blanc semitransparent sobre fons lila
  },
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
    maxHeight: 100,               // limitem l'alçada màxima de l'input multiline
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
    opacity: 0.4,                 // botó semi-transparent quan està desactivat
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});
  

