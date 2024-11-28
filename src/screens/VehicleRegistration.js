// screens/VehicleRegistration.js
import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { TextInput, Button, Title, Provider } from 'react-native-paper';
import { firestore } from '../database/firebase'; // Importe sua configuração do Firebase
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import axios from 'axios';

const VehicleRegistration = ({ navigation }) => {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anoFab, setAnoFab] = useState('');
  const [cor, setCor] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [plate, setPlate] = useState('');
  const [combustivel, setCombustivel] = useState('');
  const [campos, setCampos] = useState(true);

  const handleRegisterVehicle = async () => {
    // Verifica se todos os campos obrigatórios estão preenchidos
    if (!marca || !modelo || !anoFab || !cor || !municipio || !plate) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return; // Sai da função se os campos não estiverem preenchidos
    }

    try {
      // Verifica se o usuário existe usando o email
      const q = query(collection(firestore, 'users'), where('email', '==', userEmail));
      const userSnapshot = await getDocs(q);

      if (!userSnapshot.empty) {
        const userId = userSnapshot.docs[0].id; // Pegue o UID do usuário

        // Cria um novo documento na coleção 'vehicles'
        await addDoc(collection(firestore, 'vehicles'), {
          marca,
          modelo,
          anoFab,
          cor,
          municipio,
          plate,
          combustivel,
          userId: userId,
          createdAt: Timestamp.fromDate(new Date()),
        });

        Alert.alert('Sucesso', 'Veículo cadastrado com sucesso!');
        setMarca('');
        setModelo('');
        setAnoFab('');
        setCor('');
        setMunicipio('');
        setUserEmail('');
        setPlate('');
        setCombustivel('');
      } else {
        Alert.alert('Erro', 'Usuário não encontrado. Verifique o email.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar o veículo.');
      console.error(error);
    }
  };

  function handleSarchPlateData(event) {
    if (event.length === 7) {
      axios.get('http://172.16.0.155:21042/getplate', {
        params: {
          plate
        }
      }).then((response) => {
        if (!response.data) {
          setCampos(false);
          console.log(response.data);
        } else {
          console.log(response.data)
          const data = response.data.resultado;
          setMarca(data.marca);
          setModelo(data.modelo);
          setAnoFab(data.anoFabricacao);
          setCor(data.cor);
          setMunicipio(data.municipio);
          setCombustivel(data.combustivel);
        }
      }).catch((error) => { console.error(error); });
    }
  }

  return (
    <Provider>
      <View style={styles.container}>
        <Title style={styles.title}>Registro de Veículo</Title>

        <TextInput
          label="Placa"
          onChangeText={event => {
            setPlate(event);
            handleSarchPlateData(event);
          }}
          mode="outlined"
          style={styles.input}
          maxLength={8}
        />
        <TextInput
          label="Marca"
          value={marca}
          onChangeText={setMarca}
          mode="outlined"
          style={styles.input}
          disabled={campos}
        />
        <TextInput
          label="Modelo"
          value={modelo}
          onChangeText={setModelo}
          mode="outlined"
          style={styles.input}
          disabled={campos}
        />
        <TextInput
          label="Ano de Fabricação"
          value={anoFab}
          onChangeText={setAnoFab}
          mode="outlined"
          style={styles.input}
          disabled={campos}
        />
        <TextInput
          label="Cor"
          value={cor}
          onChangeText={setCor}
          mode="outlined"
          style={styles.input}

        />
        <TextInput
          label="Município"
          value={municipio}
          onChangeText={setMunicipio}
          mode="outlined"
          style={styles.input}
          disabled={campos}
        />
        <TextInput
          label="Email do Usuário"
          value={userEmail}
          onChangeText={setUserEmail}
          mode="outlined"
          style={styles.input}
        />
        <Button mode="contained" onPress={handleRegisterVehicle} style={styles.button}>
          Registrar Veículo
        </Button>
        <Button mode="text" onPress={() => navigation.goBack()} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    </Provider>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
};

export default VehicleRegistration;
