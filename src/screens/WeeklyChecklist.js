import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, RadioButton, TextInput, Button, ProgressBar } from 'react-native-paper';
import { firestore, storage } from '../database/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
const WeeklyChecklist = ({ route }) => {
  const { Uemail } = route.params;


  const [vehicle, setVehicle] = useState(null);
  const [checklist, setChecklist] = useState({
    oleoMotor: { condition: '', observation: '', imageUrl: null },
    fluidoFreio: { condition: '', observation: '' },
    direcaoHidraulica: { condition: '', observation: '' },
    oleoDiferencial: { condition: '', observation: '' },
    liquidoArrefecimento: { condition: '', observation: '', imageUrl: null },
    oleo4x4: { condition: '', observation: '' },
    oleoCaixa: { condition: '', observation: '' },
    oleoHidraulicoSky: { condition: '', observation: '' },
    oleoHidraulicoMuck: { condition: '', observation: '' },
    pastilhaFreio: { condition: '', observation: '' },
    burrinhoFreio: { condition: '', observation: '' },
    tamborFreio: { condition: '', observation: '' },
    sapatasFreio: { condition: '', observation: '' },
    discoFreio: { condition: '', observation: '' },
    frenagemIrregular: { condition: '', observation: '' },
    pincaFreio: { condition: '', observation: '' },
    nivelCombustivel: { km: '', imageUrl: null },
    qualidadePneus: { condition: '', observation: '' },
    alinhamento: { condition: '', observation: '' },
    balanceamento: { condition: '', observation: '' },
    calibragem: { condition: '', observation: '' },
    amortecedores: { condition: '', observation: '' },
    molas: { condition: '', observation: '' },
    suspensao: { condition: '', observation: '' },
    luzAlta: { condition: '', observation: '' },
    luzBaixa: { condition: '', observation: '' },
    lanternasDianteiras: { condition: '', observation: '' },
    setasDianteiras: { condition: '', observation: '' },
    setasTraseiras: { condition: '', observation: '' },
    luzdeRe: { condition: '', observation: '' },
    luzdeFreio: { condition: '', observation: '' },
    luzInterna: { condition: '', observation: '' },
    arCondicionado: { condition: '', observation: '' },
    ventilador: { condition: '', observation: '' },
    luzdeInjecaoEletronica: { condition: '', observation: '' },
    luzdeTemperarura: { condition: '', observation: '' },
    luzdeControldeTracao: { condition: '', observation: '' },
    luzdeOleo: { condition: '', observation: '' },
  });
  const [buttonsDisabled, setButtonsDisabled] = useState({
    oleoMotor: false,
    liquidoArrefecimento: false,
    nivelCombustivel: false,
  });
  const [imageUris, setImageUris] = useState({
    oleoMotor: null,
    liquidoArrefecimento: null,
    nivelCombustivel: null,
  });
  const [canSubmit, setCanSubmit] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sendChecklist, setSendChecklist] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);


  // obter localização do usuário atual
  // Função para obter a localização
  const getLocation = async () => {
    try {
      // Solicitar permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão para acessar a localização foi negada.');
        return null;
      }

      // Obter a localização
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      return null;
    }
  };


  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        // Consulta para verificar se o CPF do motorista logado está no array 'userIds'
        const q = query(collection(firestore, 'vehicles'), where('userIds', 'array-contains', Uemail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const vehicleData = querySnapshot.docs[0].data();
          setVehicle({ ...vehicleData, vehicleId: querySnapshot.docs[0].id });

          // Passa também o Uemail para garantir verificação de checklist por motorista
          checkDailyChecklist(querySnapshot.docs[0].id, Uemail);
        } else {
          Alert.alert('Erro', 'Nenhum veículo vinculado encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar veículo:', error);
      }
    };

    const checkDailyChecklist = async (vehicleId, userId) => {
      if (!vehicleId || !userId) return;

      try {
        console.log("Iniciando verificação de checklist para vehicleId:", vehicleId, "e userId (motorista):", userId);

        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // Cria a query para verificar checklists para o vehicleId e userId nas últimas 24 horas
        const checklistQuery = query(
          collection(firestore, 'checklists'),
          where('vehicleId', '==', vehicleId),
          where('Uemail', '==', Uemail), // Verifica o checklist para o motorista logado
          where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo))
        );

        // Executa a consulta e verifica os resultados
        const checklistSnapshot = await getDocs(checklistQuery);
        console.log("Quantidade de checklists encontrados nas últimas 24 horas para este motorista:", checklistSnapshot.size);

        if (!checklistSnapshot.empty) {
          setCanSubmit(false);
          const lastChecklistTime = checklistSnapshot.docs[0].data().createdAt.toDate();
          const timeDiff = new Date() - lastChecklistTime;
          const remainingTime = 24 * 60 * 60 * 1000 - timeDiff;
          if (remainingTime > 0) {
            setTimeRemaining(remainingTime);
            const interval = setInterval(() => {
              setTimeRemaining(prev => prev - 1000);
            }, 1000);
            return () => clearInterval(interval);
          }
        } else {
          console.log("Nenhum checklist encontrado nas últimas 24 horas para este motorista.");
          setCanSubmit(true);
        }
      } catch (error) {
        console.error('Erro ao verificar checklist diário por motorista:', error);
      }
    };


    console.log("CPF do motorista logado:", Uemail); // Verifique o valor de Uemail
    fetchVehicle();
  }, [Uemail]);

  const formatTime = (time) => {
    const hours = Math.floor(time / (1000 * 60 * 60));
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleChecklistChange = (key, condition) => {
    setChecklist((prevChecklist) => ({
      ...prevChecklist,
      [key]: { ...prevChecklist[key], condition },
    }));
  };

  const handleObservationChange = (key, observation) => {
    setChecklist((prevChecklist) => ({
      ...prevChecklist,
      [key]: { ...prevChecklist[key], observation },
    }));
  };

  const captureImage = async (key) => {
    try {
        const isMotorola = Device.brand?.toLowerCase() === 'motorola';

        if (isMotorola) {
            console.warn('Usando react-native-image-crop-picker para Motorola');

            const image = await ImageCropPicker.openCamera({
                width: 300,
                height: 400,
                cropping: true,
                compressImageQuality: 0.7,
            });

            if (image && image.path) {
                setImageUris((prev) => ({ ...prev, [key]: image.path }));
                setButtonsDisabled((prev) => ({ ...prev, [key]: true }));
                Alert.alert('Sucesso', 'Imagem capturada com sucesso!');
            }
        } else {
            console.warn('Usando expo-image-picker para outras marcas');

            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão Negada', 'O app precisa de permissão para acessar a câmera.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const { uri } = result.assets[0];
                setImageUris((prev) => ({ ...prev, [key]: uri }));
                setButtonsDisabled((prev) => ({ ...prev, [key]: true }));
                Alert.alert('Sucesso', 'Imagem capturada com sucesso!');
            }
        }
    } catch (error) {
        console.error('Erro ao capturar imagem:', error);
        Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
};

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `checklist-images/${Uemail}-${Date.now()}.jpg`);

      setUploadProgress(10);
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 500);

      await uploadBytes(storageRef, blob);

      clearInterval(interval);
      setUploadProgress(100);

      const imageUrl = await getDownloadURL(storageRef);
      setUploadProgress(0);
      return imageUrl;

    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      Alert.alert('Erro', 'Não foi possível anexar a imagem.');
      setUploadProgress(0);
      return null;
    }
  };

const handleSaveChecklist = async () => {
  setSendChecklist(true);

  // Validação para verificar se todas as imagens obrigatórias foram capturadas
  if (!imageUris.oleoMotor || !imageUris.liquidoArrefecimento || !imageUris.nivelCombustivel) {
    Alert.alert(
      'Checklist erro',
      'Você precisa capturar as imagens obrigatórias: Óleo do Motor, Líquido de Arrefecimento e Odômetro.'
    );
    setSendChecklist(false); // Desativa o envio para permitir novas tentativas
    return;
  }

  if (!canSubmit) {
    Alert.alert('Aviso', 'Checklist diário já preenchido.');
    return;
  }

  let imagesUrls = {};
  for (const key in imageUris) {
    if (imageUris[key]) {
      imagesUrls[key] = await uploadImage(imageUris[key]);
    }
  }

  try {
    // Obter a localização
    const location = await getLocation();

    // Verifique se a localização foi obtida
    if (!location) {
      Alert.alert('Erro', 'Não foi possível obter a localização.');
      return;
    }

    const checklistData = {
      Uemail,
      vehicleId: vehicle ? vehicle.vehicleId : null,
      items: {
        ...checklist,
        oleoMotor: { ...checklist.oleoMotor, imageUrl: imagesUrls.oleoMotor },
        liquidoArrefecimento: { ...checklist.liquidoArrefecimento, imageUrl: imagesUrls.liquidoArrefecimento },
        nivelCombustivel: { ...checklist.nivelCombustivel, imageUrl: imagesUrls.nivelCombustivel },
      },
      createdAt: Timestamp.fromDate(new Date()),
      marca: vehicle ? vehicle.marca : null,
      plate: vehicle ? vehicle.plate : null,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      }, // Adiciona a localização
    };

    await addDoc(collection(firestore, 'checklists'), checklistData);
    Alert.alert('Sucesso', 'Checklist salvo com sucesso!');
    setCanSubmit(false);
  } catch (error) {
    Alert.alert('Erro', 'Não foi possível salvar o checklist.');
    console.error('Erro ao salvar checklist:', error);
  }
};


  if (!vehicle) {
    return <Paragraph>Carregando veículo...</Paragraph>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Checklist Semanal - {vehicle.modelo} ({vehicle.plate})</Title>
          <Paragraph style={styles.paragraph}>
            {timeRemaining !== null
              ? `Tempo até próximo checklist: ${formatTime(timeRemaining)}`
              : 'Checklist disponível'}
          </Paragraph>
        </Card.Content>
      </Card>

      <Title style={styles.sectionTitle}>Itens Verificados</Title>
      {Object.keys(checklist).map((key, index) => (
        <Card key={index} style={styles.itemCard}>
          <Card.Content>
            <Title style={styles.itemTitle}>{key.replace(/([A-Z])/g, ' $1').trim()}:</Title>
            {key === 'nivelCombustivel' ? (
              <>
                <TextInput
                  label="Quilometragem Atual"
                  mode="outlined"
                  value={checklist.nivelCombustivel.km}
                  onChangeText={(text) => setChecklist((prev) => ({
                    ...prev,
                    nivelCombustivel: { ...prev.nivelCombustivel, km: text },
                  }))}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Button onPress={() => captureImage('nivelCombustivel')} mode="contained" style={styles.captureButton} disabled={!canSubmit || buttonsDisabled.nivelCombustivel}>
                  Capturar Odometro
                </Button>
              </>
            ) : (
              <RadioButton.Group
                onValueChange={(value) => handleChecklistChange(key, value)}
                value={checklist[key].condition}
              >
                <View style={styles.radioGroup}>
                  <RadioButton.Item label="Bom" value="Bom" />
                  <RadioButton.Item label="Ruim" value="Ruim" />
                  <RadioButton.Item label="Não possui" value="NaoPossui" />
                </View>
              </RadioButton.Group>
            )}
            <TextInput
              label="Observação"
              mode="outlined"
              value={checklist[key].observation}
              onChangeText={(text) => handleObservationChange(key, text)}
              style={styles.input}
            />
            {key === 'oleoMotor' && (
              <Button onPress={() => captureImage('oleoMotor')} mode="contained" style={styles.captureButton} disabled={!canSubmit || buttonsDisabled.oleoMotor}>
                Capturar Imagem de Óleo Motor
              </Button>
            )}
            {key === 'liquidoArrefecimento' && (
              <Button onPress={() => captureImage('liquidoArrefecimento')} mode="contained" style={styles.captureButton} disabled={!canSubmit || buttonsDisabled.liquidoArrefecimento}>
                Capturar Imagem de Líquido de Arrefecimento
              </Button>
            )}
          </Card.Content>
        </Card>
      ))}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <ProgressBar
          progress={uploadProgress / 100}
          color="#4CAF50"
          style={styles.progressBar}
        />
      )}
      <Button
        mode="contained"
        onPress={handleSaveChecklist}
        style={styles.saveButton}
        disabled={!canSubmit || sendChecklist}
      >
        <Icon name="save" size={20} color="#ffffff" />
        Salvar Checklist
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f7f9fc',
    flexGrow: 1,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 4,
    marginBottom: 20,
  },
  itemCard: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#fefefe',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginVertical: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    marginTop: 12,
  },
  captureButton: {
    marginTop: 12,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 60,
    height: 67,
    justifyContent: "center"
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    height: 5,
    width: '100%',
    borderRadius: 5,
  },
});

export default WeeklyChecklist;
