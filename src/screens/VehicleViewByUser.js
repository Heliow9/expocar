import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Modal, Portal, Button, Provider, ActivityIndicator } from 'react-native-paper';
import { firestore } from '../database/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GradientHeader from './GradientHeader';

const VehicleListByUser = ({ route }) => {
    const { Uemail } = route.params;
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Função para buscar os veículos vinculados ao usuário
    const fetchUserVehicles = async () => {
        if (!Uemail) {
            console.warn("Uemail não está definido");
            setLoading(false);
            return;
        }

        try {
            const vehicleCollection = collection(firestore, 'vehicles');
            // Alteração aqui para usar `array-contains` no campo `userIds`
            const q = query(vehicleCollection, where('userIds', 'array-contains', Uemail));
            const vehicleSnapshot = await getDocs(q);
            const vehicleList = vehicleSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setVehicles(vehicleList);
        } catch (error) {
            console.error("Erro ao buscar veículos: ", error);
        } finally {
            setLoading(false);
        }
    };

    // Carrega os veículos do usuário quando o componente é montado
    useEffect(() => {
        fetchUserVehicles();
    }, [Uemail]);

    // Função para abrir o modal com as informações detalhadas
    const openVehicleDetails = (vehicle) => {
        setSelectedVehicle(vehicle);
        setModalVisible(true);
    };

    // Função para renderizar cada item
    const renderItem = ({ item }) => (
        <Card style={styles.card} onPress={() => openVehicleDetails(item)}>
            <Card.Content>
                <Icon name="directions-car" size={24} color="#388e3c" style={styles.icon} />
                <Title>{item.marca}</Title>
                <Paragraph>Placa: {item.plate.toUpperCase()}</Paragraph>
            </Card.Content>
        </Card>
    );

    return (
        <Provider>
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator animating={true} size="50"/>
                        <Paragraph style={styles.loadingText}>Carregando veículos...</Paragraph>
                    </View>
                ) : (
                    <FlatList
                        data={vehicles}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                    />
                )}

                {/* Modal para exibir detalhes do veículo */}
                <Portal>
                    <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
                        {selectedVehicle ? (
                            <View>
                                <Title>{selectedVehicle.modelo || 'Veículo sem nome'}</Title>
                                <Paragraph>Marca: {selectedVehicle.marca}</Paragraph>
                                <Paragraph>Modelo: {selectedVehicle.modelo}</Paragraph>
                                <Paragraph>Ano: {selectedVehicle.anoFab}</Paragraph>
                                <Paragraph>Cor: {selectedVehicle.cor}</Paragraph>
                                <Paragraph>Município: {selectedVehicle.municipio}</Paragraph>
                                <Paragraph>Placa: {selectedVehicle.plate.toUpperCase()}</Paragraph>
                                <Paragraph>Combustível: {selectedVehicle.combustivel}</Paragraph>
                                <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                    Fechar
                                </Button>
                            </View>
                        ) : (
                            <Paragraph>Informações do veículo não disponíveis.</Paragraph>
                        )}
                    </Modal>
                </Portal>
            </View>
        </Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5', // Cor de fundo mais suave
    },
    card: {
        marginBottom: 12,
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 2,
    },
    icon: {
        marginBottom: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 16,
        color: '#666',
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 16,
        borderRadius: 8,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#388e3c',
    },
});

export default VehicleListByUser;
