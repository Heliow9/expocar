// screens/AdminHome.js
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, FAB } from 'react-native-paper';

export default function ManagerHome({ navigation, route }) {
  const { Uemail } = route.params;



  useEffect(() => {
    console.log(Uemail)
  }, [])
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel do Gestor</Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('UserRegistrationManager')}
        style={styles.button}
      >
        Cadastrar Motoristas
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('UsersViewerManager', { Uemail })}
        style={styles.button}
      >
        Visualizar Motoristas
      </Button>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('FuelFilter', {Uemail})}
        style={styles.button}
      >
       Relatórios de Abastecimento
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Allchecks', {Uemail})}
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
        labelStyle={{ color: '#ffffff' }} // Define a cor do texto do label
      />
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 8,
    backgroundColor: '#6200ee',
  },
});
