import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, FlatList } from 'react-native';
import { Button, Card, Text, IconButton, TextInput, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, getDocs, getDoc, arrayUnion, query, collection, where } from 'firebase/firestore';
import { firestore } from '../database/firebase';
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


const CombustivelControl = ({ route, navigation }) => {
    const { Uemail, uid } = route.params;

    const [beforeImage, setBeforeImage] = useState(null);
    const [afterImage, setAfterImage] = useState(null);
    const [km, setKm] = useState(0);
    const [loading, setLoading] = useState(false);
    const [historico, setHistorico] = useState([]);
    const [userData, setUserData] = useState([]);
    const [vehicleIdentification, setVehicleIdentification] = useState('');

    const theme = useTheme();

    useEffect(() => {
        const requestPermissions = async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permissão Necessária',
                    'A permissão para acessar a câmera é necessária para capturar imagens.'
                );
            }
        };
        requestPermissions();

        // Buscar histórico de abastecimento ao carregar a tela
        buscarHistoricoAbastecimento();
    }, []);

    useEffect(() => {
        async function getVehicleIdentification() {
            const q = query(collection(firestore, 'vehicles'), where('userIds', 'array-contains', Uemail));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                Alert.alert('Erro', 'Nenhum veículo encontrado para este usuário.');
                return;
            }
            setVehicleIdentification(querySnapshot.docs[0].id)
        }
        getVehicleIdentification()
    })

    useEffect(() => {
        async function handlerGetUserName() {
            const userDocRef = doc(firestore, 'users', Uemail);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                setUserData(userData)
            } else {
                console.log('Usuário não encontrado');
            }
        }
        handlerGetUserName()
    }, [])

    const buscarVeiculo = async () => {
        setLoading(true);
        try {
            const q = query(collection(firestore, 'vehicles'), where('userIds', 'array-contains', Uemail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert('Erro', 'Nenhum veículo encontrado para este usuário.');
                return;
            }

            // Assumindo que o usuário tem apenas um veículo vinculado
            const vehicleData = querySnapshot.docs[0].data();
            setVehicleIdentification(querySnapshot.docs[0].id)
            return vehicleData;  // Retorna o ID do veículo
        } catch (error) {
            console.error("Erro ao buscar veículo:", error);
            Alert.alert('Erro', 'Não foi possível buscar o veículo.');
        } finally {
            setLoading(false);
        }
    };



    const buscarHistoricoAbastecimento = async () => {
        setLoading(true);
        try {
            // Buscar histórico de abastecimento do usuário na coleção 'fuel'
            const userDocRef = doc(firestore, 'fuel', Uemail);
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
                const abastecimentos = userDocSnapshot.data().abastecimentos || [];
                setHistorico(abastecimentos.reverse());
            } else {
                setHistorico([]);
            }
        } catch (error) {
            console.error("Erro ao buscar histórico de abastecimento:", error);
            Alert.alert('Erro', 'Não foi possível carregar o histórico de abastecimento.');
        } finally {
            setLoading(false);
        }
    };


    const pickImage = async (type) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                return Alert.alert(
                    'Permissão Negada',
                    'A permissão para acessar a câmera é necessária para capturar imagens.'
                );
            }
    
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Usar a constante correta
                quality: 1,
            });
    
            if (!result.canceled) {
                if (type === 'before') {
                    setBeforeImage(result.assets[0].uri);
                } else {
                    setAfterImage(result.assets[0].uri);
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível abrir a câmera. Tente novamente.');
        }
    };
    

    const buscarUltimoKm = async () => {
        try {
            const fuelCollectionRef = collection(firestore, 'fuel');
            const querySnapshot = await getDocs(fuelCollectionRef);

            let maxKm = 0; // Inicializa com o valor mínimo possível.

            querySnapshot.forEach(doc => {
                const abastecimentos = doc.data().abastecimentos || [];


                // Filtra os abastecimentos para o vehicleId específico
                const abastecimentoVeiculo = abastecimentos.filter(item => item.vehicleIdentification === vehicleIdentification);

                // Verifica o maior valor de km para o veículo
                abastecimentoVeiculo.forEach(item => {
                    if (item.km > maxKm) {
                        maxKm = item.km;
                    }
                });
            });

            return maxKm;
        } catch (error) {
            console.error('Erro ao buscar o último km:', error);
        }
    };


    const enviarAbastecimento = async () => {

        const lastKm = await buscarUltimoKm();
        if (beforeImage && afterImage != null) {
            if (km > lastKm) {
                try {
                    const vehicleId = await buscarVeiculo();  // Obter o ID do veículo vinculado ao usuário

                    if (!vehicleId) return;
                    const userDocRef = doc(firestore, 'fuel', Uemail);
                    const userDocSnapshot = await getDoc(userDocRef);

                    const abastecimentoData = {
                        userName: userData.name,
                        cc: userData.cc,
                        vehicleId,
                        vehicleIdentification: vehicleIdentification,
                        km,
                        beforeImage,
                        afterImage,
                        date: new Date(),
                    };

                    if (userDocSnapshot.exists()) {
                        await setDoc(userDocRef, {
                            abastecimentos: arrayUnion(abastecimentoData),
                        }, { merge: true });
                    } else {
                        await setDoc(userDocRef, {
                            abastecimentos: [abastecimentoData],
                        });
                    }

                    Alert.alert('Sucesso', 'Registro de abastecimento enviado com sucesso!');
                    navigation.goBack();
                } catch (error) {
                    console.error('Erro ao enviar abastecimento:', error);
                    Alert.alert('Erro', 'Não foi possível registrar o abastecimento.');
                } finally {
                    setLoading(false);
                    buscarHistoricoAbastecimento();  // Atualizar o histórico após o envio
                }
            } else {
                Alert.alert('Erro de Kilometragem', `O valor do km deve ser superior a ${lastKm} você não pode registrar um abastecimento com o valor: ${km}`);
            }
        } else {
            Alert.alert('Erro de Imagem', `É necesário anexar todas as imagems!`);

        }


    };




    const exportarHistoricoComoXLSX = async (historico) => {
        if (!historico || historico.length === 0) {
            Alert.alert('Aviso', 'Não há dados para exportar.');
            return;
        }

        try {
            // Formatar dados para a planilha
            const data = [
                ['Histórico de Abastecimento', '', '', '', '', ''], // Linha 1 com texto mesclado
                ['Usuario', 'Placa', 'Data', 'Km', 'Modelo', 'Combustivel'], // Cabeçalhos
                ...historico.reverse().map((item) => [
                    item.userName || 'N/A',
                    item.vehicleId.plate.toUpperCase() || 'N/A',
                    item.date.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) || 'N/A',
                    item.km || 'N/A',
                    item.vehicleId.modelo || 'N/A',
                    item.vehicleId.combustivel || 'N/A',
                ]),
            ];

            const ws = XLSX.utils.aoa_to_sheet(data);

        // Mesclar as células da linha 1
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Mescla de A1 até F1
        ];

        // Definir estilo para a célula mesclada
        ws['A1'].s = {
            alignment: { horizontal: 'center', vertical: 'center' }, // Centraliza o texto
            font: { bold: true }, // Aplica negrito
            wrapText: true, // Faz o texto quebrar linha, se necessário
        };

        
            ws['!cols'] = [
                { wch: 20 }, // Largura para a coluna "Usuario"
                { wch: 20 }, // Largura para a coluna "Data"
                { wch: 25 }, // Largura para a coluna "Quantidade"
                { wch: 12 }, // Largura para a coluna "Km"
                { wch: 20 }, // Largura para a coluna "Preço"
                { wch: 20 }, // Largura para a coluna "Total"
            ];


            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Histórico');

            // Gerar o arquivo como Base64
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            // Caminho do arquivo no Expo
            const fileUri = `${FileSystem.documentDirectory}historico_abastecimento.xlsx`;

            // Salvar o arquivo
            await FileSystem.writeAsStringAsync(fileUri, wbout, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Compartilhar o arquivo
            await Sharing.shareAsync(fileUri);
        } catch (error) {
            console.error('Erro ao exportar XLSX:', error);
            Alert.alert('Erro', 'Não foi possível exportar o histórico.');
        }
    };


    const renderHistoricoItem = ({ item }) => (
        <Card style={styles.historyCard}>
            <Card.Content>
                <Text style={styles.historyText}>
                    Data: {item.date.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </Text>
                <Text style={styles.historyText}>KM: {item.km}</Text>
                <Text style={styles.historyText}>
                    Placa: {item.vehicleId ? item.vehicleId.plate.toUpperCase() : 'Placa não disponível'}
                </Text>

            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Title
                    title="Controle de Combustível"
                    titleStyle={styles.title}
                    left={(props) => <IconButton {...props} icon="fuel" />}
                />
                <Card.Content>
                    <Text style={styles.text}>
                        Capture as imagens do odômetro antes e após o abastecimento e insira a quilometragem.
                    </Text>
                    <TextInput
                        label="Quilometragem Atual"
                        value={km}
                        onChangeText={setKm}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                        placeholder="Ex: 12345"
                    />
                    <View style={styles.buttonGroup}>
                        <Button
                            mode={beforeImage ? 'contained' : 'outlined'}
                            icon={beforeImage ? 'check-circle' : 'camera'}
                            style={styles.button}
                            onPress={() => pickImage('before')}
                            color={beforeImage ? theme.colors.green : theme.colors.primary}
                        >
                            Odômetro Antes
                        </Button>
                        <Button
                            mode={afterImage ? 'contained' : 'outlined'}
                            icon={afterImage ? 'check-circle' : 'camera'}
                            style={styles.button}
                            onPress={() => pickImage('after')}
                            color={afterImage ? theme.colors.green : theme.colors.primary}
                        >
                            Odômetro Depois
                        </Button>
                    </View>
                </Card.Content>
                <Card.Actions>
                    <Button
                        mode="contained"
                        onPress={enviarAbastecimento}
                        loading={loading}
                        disabled={loading}
                        style={styles.submitButton}
                        icon="check"
                    >
                        Registrar Abastecimento
                    </Button>
                </Card.Actions>
            </Card>

            {loading && <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />}

            <FlatList
                data={historico}
                renderItem={renderHistoricoItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.historyList}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum abastecimento registrado ainda.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 12,
        padding: 8,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    text: {
        fontSize: 16,
        marginBottom: 16,
    },
    input: {
        marginBottom: 16,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
    },
    submitButton: {
        flex: 1,
        marginVertical: 16,
    },
    exportButtom: {
        flex: 1,
        marginVertical: 10,
        marginHorizontal: 100
    },
    historyList: {
        marginTop: 20,
        width: '100%',
    },
    historyCard: {
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
    },
    historyText: {
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888',
    },
});

export default CombustivelControl;
