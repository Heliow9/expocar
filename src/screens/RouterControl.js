import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Network from 'expo-network';
// Nome da tarefa de localização em segundo plano
const LOCATION_TASK_NAME = 'background-location-task';

const RouterControl = ({route}) => {
  const { Uemail } = route.params;
  const [destination, setDestination] = useState('');
  const [returnAddress, setReturnAddress] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [routeData, setRouteData] = useState([]); // Estado para armazenar os pontos do roteiro


  useEffect(() => {
    // Verifique se o rastreamento está ativo quando a tela for carregada
    const checkTrackingStatus = async () => {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(hasStarted);
      
    };
  
    checkTrackingStatus();
  }, []);
  useEffect(() => {
    // Função para solicitar permissões de localização
    const requestPermissions = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

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
    alert("Iniciando o rastreamento");
  
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      console.log("O rastreamento já está ativo.");
      return;
    }
  
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // Tente aumentar para 10 segundos
      distanceInterval: 30, // Reduza para capturar com mais precisão
      foregroundService: {
        notificationTitle: "Rastreamento ativo",
        notificationBody: "O aplicativo está capturando sua localização.",
        notificationColor: "#FF0000",
      },
    });
  
    await AsyncStorage.setItem("destination", destination);
    console.log("Rastreamento iniciado com sucesso e destino salvo:", destination);
    setIsTracking(true)
  };
  


  const stopTracking = async () => {
    console.log("Parando o rastreamento...");
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log("O rastreamento ainda está ativo?", isRunning);
    
    setIsTracking(false);
    await AsyncStorage.setItem("returnAddress", returnAddress);
  
    const locationData = await AsyncStorage.getItem("locationData");
    const parsedData = JSON.parse(locationData) || [];
  
    Alert.alert("Dia finalizado", `Roteiro salvo com sucesso!\nTrajeto: ${parsedData.length} pontos.`);
  };



const checkConnectivity = async () => {
  const networkState = await Network.getNetworkStateAsync();
  return networkState.isConnected;
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
  console.log("Executando a tarefa em segundo plano...");

  if (error) {
    console.error("Erro na tarefa de rastreamento:", error);
    return;
  }

  if (data) {
    const { locations } = data;
    if (!locations || locations.length === 0) return;

    console.log("Nova localização recebida:", locations[0]);

    const locationData = await AsyncStorage.getItem("locationData");
    const parsedData = JSON.parse(locationData) || [];

    parsedData.push({
      timestamp: Date.now(),
      coords: locations[0].coords,
    });

    await AsyncStorage.setItem("locationData", JSON.stringify(parsedData));
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
