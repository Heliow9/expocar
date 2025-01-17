// screens/AdminHome.js
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { handleLogout } from '../utils/Logout'; // Importe a função de logout

export default function AdminHome({ navigation, route }) {
  const { Uemail } = route.params;

  useFocusEffect(
    React.useCallback(() => {
      console.log('AdminHome entrou em foco');
      const onBackPress = () => {
        console.log('Botão voltar pressionado, bloqueado');
        return true; // Bloqueia o botão "Voltar"
      };
  
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
  
      return () => {
        console.log('AdminHome perdeu o foco');
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [])
  );

  useEffect(() => {
    console.log(Uemail);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel do Administrador</Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('UserRegistration')}
        style={styles.button}
      >
        Cadastrar Usuário
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('VehicleRegistration')}
        style={styles.button}
      >
        Cadastrar Veículo
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('VehicleViewer')}
        style={styles.button}
      >
        Consultar Veículos
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Allchecks')}
        style={styles.button}
      >
        Visualizar Checklists
      </Button>
      
      {/* Botão flutuante para Chat ao Vivo */}
      <FAB
        style={styles.fab}
        icon="chat"
        label="Chat ao Vivo ADM"
        onPress={() => navigation.navigate('Live ChatAdmin', { Uemail })}
        labelStyle={{ color: '#ffffff' }}
      />

      {/* Botão de Logout */}
      <Button
        mode="outlined"
        onPress={() => handleLogout(navigation)} // Chama a função handleLogout
        style={styles.logoutButton}
        labelStyle={styles.logoutButtonLabel}
      >
        Sair
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f8',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f45214',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 8,
    backgroundColor: '#f45214',
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 8,
    borderColor: '#f45214',
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignSelf: 'center',
    width: '80%',
  },
  logoutButtonLabel: {
    color: '#f45214',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#f45214',
  },
});
