import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, FAB } from 'react-native-paper';

export default function UserHome({ navigation, route }) {
  const { Uemail } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel do Motorista</Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('WeeklyChecklist', { Uemail })}
        style={styles.button}
      >
        Preencher Checklist Semanal
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('RouterControl', { Uemail })}
        style={styles.button}
      >
        Controle de Rota
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('CombustivelControl', { Uemail })}
        style={styles.button}
      >
        Controle de Combustivel
      </Button>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('CheckList Diário', { Uemail })}
        style={styles.button}
      >
        Histórico Checklist Diário
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('VehicleViewByUser', { Uemail })}
        style={styles.button}
      >
        Ver Veículo Vinculado
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Live Chat')}
        style={styles.button}
      >
        Ver notificações do Administrador
      </Button>

      {/* Botão flutuante para Chat ao Vivo */}
      <FAB
        style={styles.fab}
        icon="chat"
        label="Chat ao Vivo"
        onPress={() => navigation.navigate('Live Chat', { Uemail })}
        labelStyle={styles.fabColor} // Define a cor do texto do label

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
    color: '#f45214',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 8,
    backgroundColor: '#f45214',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#f45214',
    
  },
  fabColor:{
    color:'white'
  }
});
