import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { TextInput, Button, Snackbar, Provider, Text, RadioButton, Modal, Portal } from 'react-native-paper';
import { auth, firestore } from '../database/firebase';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { setDoc, doc, getDoc, collection } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';


export default function UserRegistrationManager({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('');
  const [ccNumber, setCcNumber] = useState('');
  const [ccData, setCcData] = useState(null);
  const [ccName, setCcName] = useState('');
  const [ccResponsible, setCcResponsible] = useState('');
  const [ccNotFound, setCcNotFound] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [registerButton, setRegisterButton] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [rg, setRg] = useState('');
  const [address, setAddress] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [landline, setLandline] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [medicalRestrictions, setMedicalRestrictions] = useState('');
  const [generalObservations, setGeneralObservations] = useState('');
  const [cnh, setCnh] = useState('');
  const [cnhExpiration, setCnhExpiration] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [roleLevel, setRoleLevel] = useState('manager');

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Formato ISO (YYYY-MM-DD)
      setCnhExpiration(formattedDate);
    }
  };



  const validateFields = () => {
    if (!email || !password || !name || !cpf || !birthDate || !address || !cellphone || !cnh || !cnhExpiration) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return false;
    }
    if (role === 'manager' || 'user' && !ccNumber) {
      setErrorMessage('Por favor, informe o número do Centro de Custo.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  useEffect(() => {
    // Limpa mensagens de erro ao alterar o tipo de usuário
    if (role !== 'manager') {
      setErrorMessage('');
    }
  }, [role]);

  const checkEmailExists = async () => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      return false;
    }
  };

  const checkCpfExists = async () => {
    try {
      const docRef = doc(firestore, "users", cpf);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
      return false;
    }
  };

  const handleCcVerification = async () => {
    Keyboard.dismiss()
    const normalizedCcNumber = parseInt(ccNumber, 10).toString(); // Remove zeros à frente
    try {
      const docRef = doc(firestore, "cc", normalizedCcNumber);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCcData(docSnap.data());
        setCcNotFound(false);
      } else {
        setCcData(null);
        setCcNotFound(true);
      }
    } catch (error) {
      console.error("Erro ao buscar Centro de Custo:", error);
    }
  };

  const registerUser = async () => {
    if (!validateFields()) return;

    if (role === "manager" && !ccNumber) {
      setCcModalVisible(true); // Abre o modal do Centro de Custo
      setErrorMessage("Gestores precisam de um Centro de Custo associado.");
      return;
    }

    const emailExists = await checkEmailExists();
    if (emailExists) {
      setEmailError("Este email já está registrado. Use outro email.");
      return;
    } else {
      setEmailError("");
    }

    const cpfExists = await checkCpfExists();
    if (cpfExists) {
      setCpfError("Este CPF já está registrado. Use outro CPF.");
      return;
    } else {
      setCpfError("");
    }

    if (role === "manager") {
      const normalizedCcNumber = parseInt(ccNumber, 10).toString(); // Remove zeros à frente
      const ccRef = doc(firestore, "cc", normalizedCcNumber);
      const ccSnap = await getDoc(ccRef);

      if (!ccSnap.exists()) {
        setModalVisible(true); // Abre o modal do Centro de Custo
        setErrorMessage("Centro de Custo inválido. Por favor, cadastre ou informe um válido.");
        return;
      }
    }

    try {
      setRegisterButton(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        email: user.email,
        name: name,
        role: role,
        cpf: cpf.replace(/\D/g, ''),
        birthDate,
        rg,
        cnh,
        cnhExpiration,
        address,
        cellphone,
        landline,
        emergencyContact: {
          name: emergencyContactName,
          relation: emergencyContactRelation,
          phone: emergencyContactPhone,
        },
        bloodType,
        medicalRestrictions,
        generalObservations,
      };

      if (role === "manager" || role === 'user') {
        userData.cc = parseInt(ccNumber, 10).toString(); // Normaliza o número do CC
      }

      await setDoc(doc(firestore, "users", cpf.replace(/\D/g, '')), userData);

      setVisible(true);
      setRegisterButton(false);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("Email já cadastrado. Por favor, utilize outro email.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Senha tem que conter no mínimo 6 caracteres.");
      }

      setRegisterButton(false)
    }
  };




  // Função para aplicar a máscara no CPF
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não for número
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); // Aplica a máscara
  };

  // Função para validar o CPF
  const validateCPF = (value) => {
    // Remove a máscara para validar
    const cleanCpf = value.replace(/\D/g, '');
    if (!isValidCPF(cleanCpf)) {
      setCpfError('CPF inválido');
    } else {
      setCpfError('');
    }
  };

  // Função para manipular o input do CPF
  const handleCpfChange = (text) => {
    const formattedCpf = formatCPF(text); // Aplica a máscara
    setCpf(formattedCpf); // Atualiza o CPF formatado no input
  };





  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Cadastro de Usuário</Text>

          <TextInput
            label="Nome Completo"
            value={name}
            onChangeText={setName}
            style={styles.input}
            error={!name && !!errorMessage}
          />

          <TextInput
            label="Data de Nascimento"
            value={birthDate}
            onChangeText={setBirthDate}
            style={styles.input}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
          />

          <TextInput
            label="RG"
            value={rg}
            onChangeText={setRg}
            style={styles.input}
          />

          {/* Campo para CNH */}
          <TextInput
            label="Número da CNH"
            value={cnh}
            onChangeText={setCnh}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Campo para Vencimento da CNH */}
          <TextInput
            label="Vencimento da CNH"
            value={cnhExpiration}
            onFocus={() => setShowDatePicker(true)}
            style={styles.input}
            editable={true}
          />

          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          <TextInput
            label="Endereço Completo"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            placeholder="Rua, número, bairro, cidade, estado, CEP"
          />

          <TextInput
            label="Telefone Celular"
            value={cellphone}
            onChangeText={setCellphone}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TextInput
            label="Telefone Fixo (opcional)"
            value={landline}
            onChangeText={setLandline}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TextInput
            label="E-mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}



          <TextInput
            label="CPF"
            value={cpf}
            onChangeText={handleCpfChange}
            style={{ marginBottom: 8 }}
            keyboardType="numeric"
            maxLength={14} // Limita o CPF formatado com a máscara
          />
          {cpfError ? <Text style={{ color: 'red' }}>{cpfError}</Text> : null}

          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            error={!password && !!errorMessage}
          />

          <TextInput
            label="Contato de Emergência - Nome"
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
            style={styles.input}
          />

          <TextInput
            label="Contato de Emergência - Relação"
            value={emergencyContactRelation}
            onChangeText={setEmergencyContactRelation}
            style={styles.input}
          />

          <TextInput
            label="Contato de Emergência - Telefone"
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TextInput
            label="Tipo Sanguíneo"
            value={bloodType}
            onChangeText={setBloodType}
            style={styles.input}
            placeholder="A+, B-, O+, etc."
          />

          <TextInput
            label="Alergias ou Restrições Médicas"
            value={medicalRestrictions}
            onChangeText={setMedicalRestrictions}
            style={styles.input}
            multiline
          />


          <TextInput
            label="Observações Gerais"
            value={generalObservations}
            onChangeText={setGeneralObservations}
            style={styles.input}
            multiline
          />

          <Text style={styles.label}>Tipo de Usuário</Text>
          <RadioButton.Group
            onValueChange={(newRole) => {
              setRole(newRole);
              if (newRole === 'manager' || newRole === 'user') setModalVisible(true);
            }}
            value={role}
          >
            <View style={styles.radioContainer}>
              <RadioButton.Item label="Motorista" value="user" />
            </View>
          </RadioButton.Group>

          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Button mode="contained" disabled={registerButton} onPress={registerUser} style={styles.button}>
            Cadastrar Usuário
          </Button>

          <Snackbar visible={visible} onDismiss={() => setVisible(false)}>
            Usuário cadastrado com sucesso!
          </Snackbar>

          <Button mode="text" onPress={() => navigation.goBack()} style={styles.backButton}>
            Voltar
          </Button>

          <Portal>
            <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Ajusta o comportamento para iOS e Android
                
              >
                <Text style={styles.title}>Centro de Custo</Text>

                <TextInput
                  label="Número do Centro de Custo"
                  value={ccNumber}
                  onChangeText={(text) => setCcNumber(text.replace(/[^0-9]/g, ''))} // Aceita apenas números
                  style={styles.input}
                  keyboardType="numeric"
                />
                <Button mode="contained" onPress={handleCcVerification} style={styles.button}>
                  Verificar Centro de Custo
                </Button>

                {ccData && (
                  <View>
                    <Text style={styles.infoText}>Nome: {ccData.ccnome}</Text>
                    <Text style={styles.infoText}>Data: {ccData.ccdata}</Text>
                    <Text style={styles.infoText}>CPF: {ccData.ccResponsavel}</Text>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setModalVisible(false); // Fecha o modal
                      }}
                      style={styles.button}
                    >
                      Continuar
                    </Button>
                  </View>
                )}

                {ccNotFound && (
                  <View>

                    {
                      roleLevel === 'user' ? <>
                        <Text style={styles.infoText}>Centro de Custo não encontrado.</Text>
                      </> : <>
                        <Text style={styles.infoText}>Centro de Custo não encontrado. Cadastre um novo:</Text>
                        <TextInput
                          label="Nome do Centro de Custo"
                          value={ccName}
                          onChangeText={setCcName}
                          style={styles.input}
                          onFocus={() => ccNotFound}
                        />
                        <TextInput
                          label="CPF"
                          value={cpf}
                          onChangeText={setCpf}
                          style={styles.input}
                        />
                        <Button
                          mode="contained"
                          onPress={async () => {
                            const normalizedCcNumber = parseInt(ccNumber, 10).toString(); // Remove zeros à frente
                            await setDoc(doc(firestore, "cc", normalizedCcNumber), {
                              ccnome: ccName,
                              ccdata: new Date().toISOString(),
                              ccResponsavel: cpf,
                            });
                            setModalVisible(false); // Fecha o modal
                          }}
                          style={styles.button}
                        >
                          Cadastrar e Continuar
                        </Button>

                      </>
                    }

                  </View>
                )}
                 </KeyboardAvoidingView>
            </Modal>
          </Portal>

        </View>
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', // Alinha o conteúdo ao centro
    padding: 20,
  },
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginVertical: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    marginTop:-300
  },
});
