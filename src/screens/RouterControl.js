import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nome da tarefa de localização em segundo plano
const LOCATION_TASK_NAME = 'background-location-task';

const RouterControl = () => {
  const [destination, setDestination] = useState('');
  const [returnAddress, setReturnAddress] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [routeData, setRouteData] = useState([]); // Estado para armazenar os pontos do roteiro

  useEffect(() => {
    // Função para solicitar permissões de localização
    const requestPermissions = async () => {
      const { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à localização para continuar.');
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert('Permissão de localização em segundo plano necessária', 'Permita o acesso à localização em segundo plano.');
      }
    };

    requestPermissions(); // Solicitar permissões ao carregar o componente
    loadStoredLocations(); // Carregar os pontos armazenados ao iniciar
  }, []);

  // Função para carregar os dados do AsyncStorage e atualizar o estado
  const loadStoredLocations = async () => {
    const locationData = await AsyncStorage.getItem('locationData');
    const parsedData = JSON.parse(locationData) || [];
    setRouteData(parsedData);
  };

  const startTracking = async () => {
    console.log("Iniciando o rastreamento...");
  
    // Se a permissão for concedida, inicia o rastreamento em segundo plano
    console.log("Iniciando o rastreamento em segundo plano...");
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
    const destination = 'Seu destino'; // Substitua com o destino real
    await AsyncStorage.setItem('destination', destination);
    console.log("Rastreamento iniciado com sucesso e destino salvo:", destination);
  };


  const stopTracking = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setIsTracking(false);

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

      {/* Exibir os pontos de localização armazenados */}
      <Text style={styles.label}>Pontos registrados:</Text>
      <FlatList
        data={routeData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Text style={styles.item}>
            {index + 1}: {item.coords.latitude}, {item.coords.longitude}
          </Text>
        )}
      />
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
    const newPoint = {
      timestamp: Date.now(),
      coords: locations[0].coords,
    };

    parsedData.push(newPoint);
    await AsyncStorage.setItem('locationData', JSON.stringify(parsedData));

    // Disparar um evento para atualizar a lista na tela
    const event = new CustomEvent('updateRoute', { detail: parsedData });
    document.dispatchEvent(event);
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
  item: {
    fontSize: 14,
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});

export default RouterControl;
