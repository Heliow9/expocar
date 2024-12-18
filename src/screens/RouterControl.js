import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nome da tarefa de localização em segundo plano
const LOCATION_TASK_NAME = 'background-location-task';

const RouterControl = () => {
  const [destination, setDestination] = useState('');
  const [returnAddress, setReturnAddress] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Verifica se a tarefa de localização já está ativa
    const checkIfTracking = async () => {
      const tasks = await TaskManager.getRegisteredTasksAsync();
      const isTaskRunning = tasks.some(task => task.taskName === LOCATION_TASK_NAME);
      setIsTracking(isTaskRunning);
    };

    checkIfTracking();
  }, []);

  const startTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à localização para continuar.');
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // Captura a cada 5 segundos
      distanceInterval: 50, // Ou a cada 50 metros
      foregroundService: {
        notificationTitle: "Rastreamento em andamento",
        notificationBody: "Estamos registrando sua rota.",
      },
    });

    // Salvar o destino
    await AsyncStorage.setItem('destination', destination);
    setIsTracking(true);
  };

  const stopTracking = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setIsTracking(false);

    // Salvar endereço de retorno e finalizar
    await AsyncStorage.setItem('returnAddress', returnAddress);
    const locationData = await AsyncStorage.getItem('locationData');
    const parsedData = JSON.parse(locationData) || [];

    Alert.alert('Dia finalizado', `Roteiro salvo com sucesso!\nTrajeto: ${parsedData.length} pontos.`);
  };

  return (
    <View style={styles.container}>
      {!isTracking ? (
        <>
          <Text style={styles.label}>Endereço de destino:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o destino"
            value={destination}
            onChangeText={setDestination}
          />
          <Button title="Iniciar Dia" onPress={startTracking} />
        </>
      ) : (
        <>
          <Text style={styles.label}>Endereço de retorno:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o retorno"
            value={returnAddress}
            onChangeText={setReturnAddress}
          />
          <Button title="Finalizar Dia" onPress={stopTracking} />
        </>
      )}
    </View>
  );
};

// Definição da tarefa de localização em segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }

  if (data) {
    const { locations } = data;
    const locationData = await AsyncStorage.getItem('locationData');
    const parsedData = JSON.parse(locationData) || [];
    
    // Adiciona o novo ponto de localização
    parsedData.push({
      timestamp: Date.now(),
      coords: locations[0].coords,
    });

    await AsyncStorage.setItem('locationData', JSON.stringify(parsedData));
  }
});

// Estilização
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
});

export default RouterControl;
