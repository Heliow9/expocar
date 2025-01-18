import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Image, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { TextInput, Button, Snackbar, ActivityIndicator, Checkbox } from 'react-native-paper';
import { auth, firestore } from '../database/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importa o AsyncStorage
import logo from "../../assets/icon.png";
import { CommonActions } from '@react-navigation/native';

export default function AuthScreen({ navigation }) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Adiciona um estado de carregamento
  const [rememberCpf, setRememberCpf] = useState(false);

  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, { toValue: -15, duration: 800, useNativeDriver: true }),
        Animated.timing(moveAnim, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    ).start();
  }, [moveAnim]);

  // Verifica se já existe um usuário salvo e redireciona automaticamente
  useEffect(() => {
    const checkLogin = async () => {
      const storedCpf = await AsyncStorage.getItem('savedCpf');
      if (storedCpf) {
        setCpf(storedCpf);
        setRememberCpf(true); // Marca a opção como ativada
      }

      const storedUemail = await AsyncStorage.getItem('Uemail');
      const storedRole = await AsyncStorage.getItem('role');

      if (storedUemail && storedRole) {
        redirectUser(storedRole, storedUemail);
      } else {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  const login = async () => {
    if (rememberCpf) {
      await AsyncStorage.setItem('savedCpf', cpf);
    } else {
      await AsyncStorage.removeItem('savedCpf');
    }
    try {
      // Buscar o e-mail pelo CPF no Firestore
      const userRef = doc(firestore, 'users', cpf);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const email = userData.email;
        const role = userData.role;
        const Uemail = userData.cpf;

        await signInWithEmailAndPassword(auth, email, password);

        // Salva os dados no AsyncStorage
        await AsyncStorage.setItem('Uemail', Uemail);
        await AsyncStorage.setItem('role', role);

        redirectUser(role, Uemail);
      } else {
        setError('Usuário não encontrado!');
        setVisible(true);
      }
    } catch (error) {


      // console.error("Erro ao fazer login: ", error.code);
      if (error.code === 'auth/invalid-credential') {
        setError('Senha incorreta')
        setVisible(true)
      } else if (error.code === 'auth/missing-password') {
        setError('Senha precisa conter 6 ou mais digitos.')
        setVisible(true)
      }
    }
  };

  // Função para redirecionar o usuário com base no papel (role)
  const redirectUser = (role, Uemail) => {
    let screenName = '';
    if (role === 'admin') {
      screenName = 'AdminHome';
    } else if (role === 'user') {
      screenName = 'UserHome';
    } else if (role === 'manager') {
      screenName = 'ManagerHome';
    } else {
      setError('Permissão não reconhecida!');
      setVisible(true);
      return;
    }

    // Redireciona diretamente para a tela do usuário
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: screenName, params: { Uemail } }],
      })
    );
  };

  // Se ainda estiver carregando, exibe o indicador de carregamento
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f45214" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <Animated.View style={{ transform: [{ translateY: moveAnim }] }}>
            <Image source={logo} style={styles.logo} />
          </Animated.View>
          <TextInput
            label="CPF"
            value={cpf}
            onChangeText={setCpf}
            style={styles.input}
            keyboardType="numeric"
            autoCapitalize="none"
            underlineColor="gray"
            activeUnderlineColor="#f45214"
          />
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={rememberCpf ? 'checked' : 'unchecked'}
              onPress={() => setRememberCpf(!rememberCpf)}
            />
            <Text style={styles.checkboxLabel}>Lembrar CPF</Text>
          </View>
          <TextInput
            label="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            underlineColor="gray"
            activeUnderlineColor="#f45214"
          />
          <Button mode="contained" onPress={login} style={styles.button}>
            Entrar
          </Button>
          <Snackbar visible={visible} onDismiss={() => setVisible(false)} duration={3000} style={styles.snackbar}>
            {error || 'Erro de autenticação!'}
          </Snackbar>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f8',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f8',
  },
  logo: {
    width: 280,
    height: 190,
    alignSelf: 'center',
    marginBottom: 24,
    resizeMode: 'contain',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#f45214',
  },
  snackbar: {
    backgroundColor: '#f45214',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
});
