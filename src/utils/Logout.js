// utils/Logout.js
import { signOut } from 'firebase/auth';
import { auth } from '../database/firebase'; // Importe seu Firebase corretamente
import AsyncStorage from '@react-native-async-storage/async-storage';

// Função para realizar o logout e redirecionar para a tela de login
export const handleLogout = async (navigation) => {
  try {
    await signOut(auth); // Faz o logout
    console.log('Usuário deslogado com sucesso!');

    // Remove os dados do AsyncStorage
    await AsyncStorage.removeItem('Uemail');  // Remove o e-mail do usuário
    await AsyncStorage.removeItem('Role');    // Remove o cargo (role) do usuário

    navigation.navigate('AuthScreen'); // Redireciona para a tela de login
  } catch (error) {
    console.error('Erro ao deslogar:', error.message);
  }
};
