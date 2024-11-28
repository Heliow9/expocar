import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Image, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { auth, firestore } from '../database/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import logo from "../../assets/logo.png" // Importa a logo

export default function AuthScreen({ navigation }) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(null);

  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([  
        Animated.timing(moveAnim, {
          toValue: -35,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [moveAnim]);

  const login = async () => {
    try {
      // Procurar o e-mail pelo CPF no Firestore
      const userRef = doc(firestore, 'users', cpf);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const email = userData.email;

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const Uemail = userData.cpf;
        const role = userData.role;
        if (role === 'admin') {
          navigation.navigate('AdminHome', { userCredential, Uemail });
        } else if (role === 'user') {
          navigation.navigate('UserHome', { Uemail });
        } else if(role === 'manager'){
          navigation.navigate('ManagerHome', { Uemail });

        }
         else {
          setVisible(true);
        }
      } else {
        setError('Usuário não encontrado!');
        setVisible(true);
      }
    } catch (error) {
      if (error.message === 'auth/invalid-credential') {
        setError('Senha incorreta, verifique!');
        setVisible(true);
      }
      console.error("Erro ao fazer login: ", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          />
          <TextInput
            label="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Button mode="contained" onPress={login} style={styles.button}>
            Entrar
          </Button>
          <Snackbar
            visible={visible}
            onDismiss={() => setVisible(false)}
            duration={3000}
            style={styles.snackbar}
          >
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
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 24,
    resizeMode:'contain'
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#6200ee',
  },
  snackbar: {
    backgroundColor: '#d32f2f',
  },
});
