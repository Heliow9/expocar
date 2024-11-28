import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Button, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { firestore } from '../database/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

const LiveChat = ({ route }) => {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { Uemail } = route.params;

  useEffect(() => {
    const q = query(collection(firestore, 'users'), where('role', '==', 'admin'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adminsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(adminsList);
    });
    return () => unsubscribe();
  }, []);

  const selectAdmin = (admin) => {
    setSelectedAdmin(admin);
    const messagesQuery = query(collection(firestore, 'chats'), where('adminId', '==', admin.id));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(chatMessages);
    });
    return () => unsubscribe();
  };

  const sendMessage = async () => {
    if (newMessage.trim()) {
      await addDoc(collection(firestore, 'chats'), {
        text: newMessage,
        timestamp: new Date(),
        sender: 'user',
        adminId: selectedAdmin.id,
        UserClient: Uemail,  // Usando UserClient no lugar de userEmail
      });
      setNewMessage('');
    }
  };

  const renderMessageItem = ({ item, index }) => {
    const currentDate = dayjs(item.timestamp.toDate()).format('DD/MM/YYYY');
    const previousDate = index > 0 ? dayjs(messages[index - 1].timestamp.toDate()).format('DD/MM/YYYY') : null;
    const showDateDivider = currentDate !== previousDate;

    return (
      <View>
        {showDateDivider && (
          <Text style={styles.dateDivider}>{currentDate}</Text>
        )}
        <View style={item.sender === 'admin' ? styles.adminMessage : styles.userMessage}>
          <Text>{item.text}</Text>
        </View>
      </View>
    );
  };

  const AdminCard = ({ admin, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.adminItem}>
      <LinearGradient colors={['#836FFF', '#2575fc']} style={styles.gradient}>
        <MaterialCommunityIcons name="account" size={24} color="#fff" style={styles.icon} />
        <Text style={styles.adminName}>{admin.nome}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {selectedAdmin ? (
        <View style={styles.chatContainer}>
          <Text style={styles.chatTitle}>Chat com administrador: {selectedAdmin.nome}</Text>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
          />
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem"
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <Button title="Enviar" onPress={sendMessage} />
        </View>
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AdminCard admin={item} onPress={() => selectAdmin(item)} />
          )}
          ListEmptyComponent={<Text>Nenhum administrador disponível</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f8',
  },
  chatContainer: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateDivider: {
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  adminItem: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  adminName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  adminMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ececec',
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6200ee',
    color: 'white',
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
});

export default LiveChat;
