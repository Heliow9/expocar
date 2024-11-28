import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, TextInput, Button, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot, addDoc, getDoc, doc } from 'firebase/firestore';
import { firestore } from '../database/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

const LiveChatAdmin = ({ route }) => {
    const [chats, setChats] = useState([]); // Lista de chats agrupada por usuário
    const [selectedUserChat, setSelectedUserChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [usersData, setUsersData] = useState({});  // Armazenar os dados dos usuários aqui
    const { Uemail } = route.params;  // Uemail do administrador logado
    
    useEffect(() => {
        // Listen to all chat conversations where the adminId (email do admin) is equal to the logged-in Uemail
        const q = query(collection(firestore, 'chats'), where('adminId', '==', Uemail));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Agrupar as mensagens por 'UserClient' (email do usuário)
            const groupedChats = groupChatsByUser(chatsList);
            setChats(groupedChats);

            // After getting the chats, fetch user info based on 'UserClient' (email)
            chatsList.forEach(chat => {
                getUserInfo(chat.UserClient);  // Buscando as informações do usuário
            });
        });
        return () => unsubscribe();
    }, [Uemail]);

    const groupChatsByUser = (chatsList) => {
        const grouped = {};

        // Agrupar chats por 'UserClient'
        chatsList.forEach(chat => {
            if (!grouped[chat.UserClient]) {
                grouped[chat.UserClient] = {
                    UserClient: chat.UserClient,
                    messages: [],
                };
            }
            grouped[chat.UserClient].messages.push(chat);
        });

        return Object.values(grouped);
    };

    const getUserInfo = async (UserClient) => {
        // Pega as informações do usuário da coleção 'users' com base no 'UserClient' (email)
        const userRef = doc(firestore, 'users', UserClient);  // 'userClient' é a chave
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            setUsersData((prevData) => ({
                ...prevData,
                [UserClient]: userData.nome,  // Armazenando o nome do usuário pelo 'UserClient'
            }));
        }
    };

    const selectUserChat = (userClient) => {
        // Encontrar o chat específico para o UserClient selecionado
        const selectedChat = chats.find(chat => chat.UserClient === userClient);
        setSelectedUserChat(selectedChat);
    };

    const sendMessage = async () => {
        if (newMessage.trim() && selectedUserChat) {
            await addDoc(collection(firestore, 'chats'), {
                text: newMessage,
                timestamp: new Date(),
                sender: 'admin',
                userId: selectedUserChat.UserClient,  // Supondo que cada chat esteja vinculado a um userId
                adminId: Uemail,  // Armazenando o email do admin como adminId
            });
            setNewMessage('');
        }
    };

    const renderChatCard = ({ item }) => {
        const userName = usersData[item.UserClient] || 'Carregando...';  // Exibe o nome do usuário, se disponível
        return (
            <TouchableOpacity onPress={() => selectUserChat(item.UserClient)} style={styles.chatCard}>
                <LinearGradient colors={['#836FFF', '#2575fc']} style={styles.gradient}>
                    <MaterialCommunityIcons name="account" size={24} color="#fff" style={styles.icon} />
                    <Text style={styles.chatTitle}>Conversa com {userName}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const renderMessageItem = ({ item, index }) => {
        const currentDate = dayjs(item.timestamp.toDate()).format('DD/MM/YYYY');
        const previousDate = index > 0 ? dayjs(selectedUserChat.messages[index - 1].timestamp.toDate()).format('DD/MM/YYYY') : null;
        const showDateDivider = currentDate !== previousDate;
    
        return (
            <View>
                {showDateDivider && (
                    <Text style={styles.dateDivider}>{currentDate}</Text>
                )}
                <View style={item.sender === 'admin' ? styles.adminMessage : styles.userMessage}>
                    <Text style={item.sender === 'admin' ? styles.adminText : styles.userText}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {selectedUserChat ? (
                <View style={styles.chatContainer}>
                    <Text style={styles.chatTitle}>Chat com usuário: {selectedUserChat.UserClient}</Text>
                    <FlatList
                        data={selectedUserChat.messages} // Exibe as mensagens do chat selecionado
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessageItem}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Digite sua resposta"
                        value={newMessage}
                        onChangeText={setNewMessage}
                    />
                    <Button title="Enviar" onPress={sendMessage} />
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item.UserClient}
                    renderItem={renderChatCard}
                    ListEmptyComponent={<Text>Nenhuma conversa disponível</Text>}
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
    chatCard: {
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
    chatTitle: {
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
    adminText: {
        color: '#000', // Cor para o texto do admin
    },
    userText: {
        color: '#fff', // Cor para o texto do usuário
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
    },
});

export default LiveChatAdmin;
