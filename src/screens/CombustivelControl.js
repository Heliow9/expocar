import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, FlatList } from 'react-native';
import { Button, Card, Text, IconButton, TextInput, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, getDocs, getDoc, arrayUnion, query, collection, where } from 'firebase/firestore';
import { firestore } from '../database/firebase';

const CombustivelControl = ({ route, navigation }) => {
    const { Uemail, uid } = route.params;
    const [beforeImage, setBeforeImage] = useState(null);
    const [afterImage, setAfterImage] = useState(null);
    const [km, setKm] = useState('');
    const [loading, setLoading] = useState(false);
    const [historico, setHistorico] = useState([]);
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

    const enviarAbastecimento = async () => {
        try {
            const vehicleId = await buscarVeiculo();  // Obter o ID do veículo vinculado ao usuário

            if (!vehicleId) return;

            const userDocRef = doc(firestore, 'fuel', Uemail);
            const userDocSnapshot = await getDoc(userDocRef);

            const abastecimentoData = {
                vehicleId,
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
    };

    const handleFuelControl = async () => {
        if (!beforeImage || !afterImage) {
            return Alert.alert('Atenção', 'Por favor, capture ambas as imagens do odômetro.');
        }

        if (!km || isNaN(km) || parseFloat(km) <= 0) {
            return Alert.alert('Atenção', 'Insira uma quilometragem válida.');
        }

        try {
            setLoading(true);
            setTimeout(() => {
                Alert.alert('Sucesso', 'Informações de abastecimento registradas com sucesso!');
                setKm('');
                setBeforeImage(null);
                setAfterImage(null);
                setLoading(false);
            }, 2000);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro ao registrar as informações de abastecimento verifique.');
        } finally {
            setLoading(false);
        }
    };

    const renderHistoricoItem = ({ item }) => (
        <Card style={styles.historyCard}>
            <Card.Content>
                <Text style={styles.historyText}>Data: {item.date.toDate().toLocaleDateString()}</Text>
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
