import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Modal, Portal, Button, Provider, ActivityIndicator, TextInput } from 'react-native-paper';
import { firestore } from "../database/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import dayjs from 'dayjs'
const VehicleView = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [cpfInputs, setCpfInputs] = useState(["", "", ""]);
    const [driverNames, setDriverNames] = useState([]);
    const [lastChecklistDate, setLastChecklistDate] = useState(null);
    const [crlvUri, setCrvlUri] = useState(null); // Estado para armazenar o URI do CRLV
    




    const fetchVehicles = async () => {
        try {
            const vehicleCollection = collection(firestore, 'vehicles');
            const vehicleSnapshot = await getDocs(vehicleCollection);
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

    const fetchDriverNames = async (cpfs) => {
        const names = await Promise.all(cpfs.map(async (cpf) => {
            const name = await getUserNameByCpf(cpf);
            return name;
        }));
        return names;
    };

    const getUserNameByCpf = async (cpf) => {
        if (!cpf) return 'Não vinculado';
        try {
            const userDoc = doc(firestore, 'users', cpf);
            const userSnapshot = await getDoc(userDoc);
            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                return userData.name || 'Nome não disponível';
            }
            return 'Não vinculado';
        } catch (error) {
            console.error("Erro ao buscar nome do motorista: ", error);
            return 'Erro na busca';
        }
    };

    const fetchLastChecklistDate = async (vehicleId) => {
        try {
            const checklistsRef = collection(firestore, 'checklists');
            const q = query(
                checklistsRef,
                where('vehicleId', '==', vehicleId),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const lastChecklist = querySnapshot.docs[0].data();
                setLastChecklistDate(lastChecklist.createdAt);
                console.log("Último checklist encontrado:", lastChecklist.createdAt.toDate()); // Log da data do último checklist
            } else {
                setLastChecklistDate(null);
            }
        } catch (error) {
            console.error("Erro ao buscar a data do último checklist: ", error);
        }
    };

    useEffect(() => {
        fetchVehicles();
        
    }, [cpfInputs]);

    useEffect(() => {
        console.log("Data do último checklist:", lastChecklistDate); // Log da data do último checklist
    }, [lastChecklistDate]);

    const openVehicleDetails = async (vehicle) => {
        const updatedUserIds = vehicle.userIds || [];
        setSelectedVehicle({ ...vehicle, userIds: updatedUserIds });
        const names = await fetchDriverNames(updatedUserIds);
        setDriverNames(names);
        fetchLastChecklistDate(vehicle.id);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const handleAddCpf = async (index) => {
        const newCpf = cpfInputs[index].trim();
        if (newCpf) {
            const updatedUserIds = selectedVehicle.userIds ? [...selectedVehicle.userIds] : [];
            if (!updatedUserIds.includes(newCpf)) {
                updatedUserIds.push(newCpf);
                const vehicleDoc = doc(firestore, 'vehicles', selectedVehicle.id);
                await updateDoc(vehicleDoc, { userIds: updatedUserIds });
                setDriverNames(await fetchDriverNames(updatedUserIds));
                setCpfInputs((prevInputs) => {
                    const newInputs = [...prevInputs];
                    newInputs[index] = "";
                    return newInputs;
                });
            }
        }
    };

    const handleUnlinkCpf = async (cpfToRemove) => {
        try {
            const vehicleDoc = doc(firestore, 'vehicles', selectedVehicle.id);
            const updatedUserIds = selectedVehicle.userIds.filter(cpf => cpf !== cpfToRemove);
            await updateDoc(vehicleDoc, { userIds: updatedUserIds });
            setSelectedVehicle((prevVehicle) => ({ ...prevVehicle, userIds: updatedUserIds }));
            setDriverNames(await fetchDriverNames(updatedUserIds));
            setCpfInputs((prevInputs) => {
                const emptyIndex = prevInputs.findIndex(input => input === "");
                if (emptyIndex !== -1) {
                    return [...prevInputs.slice(0, emptyIndex), "", ...prevInputs.slice(emptyIndex + 1)];
                }
                return prevInputs;
            });
        } catch (error) {
            console.error("Erro ao desvincular CPF: ", error);
        }
    };

    const confirmDeleteVehicle = () => {
        Alert.alert(
            "Confirmação",
            "Tem certeza de que deseja excluir este veículo?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: handleDeleteVehicle
                }
            ],
            { cancelable: true }
        );
    };

    const handleDeleteVehicle = async () => {
        try {
            const vehicleDoc = doc(firestore, 'vehicles', selectedVehicle.id);
            await deleteDoc(vehicleDoc);
            fetchVehicles();
            setModalVisible(false);
        } catch (error) {
            console.error("Erro ao excluir veículo: ", error);
        }
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card} onPress={() => openVehicleDetails(item)}>
            <Card.Content>
                <Title style={styles.cardTitle}>{item.modelo}</Title>
                <Paragraph style={styles.cardParagraph}>Placa: {item.plate}</Paragraph>
            </Card.Content>
        </Card>
    );

    const today = dayjs();

    // Obtém o último caractere da placa para definir a data de vencimento
    const lastDigit = selectedVehicle?.plate ? selectedVehicle.plate.slice(-1) : "";

    // Definição das datas de vencimento baseadas no final da placa
    const ipvaDueDates = {
        "1": "2025-02-05",
        "2": "2025-02-05",
        "3": "2025-02-10",
        "4": "2025-02-10",
        "5": "2025-02-15",
        "6": "2025-02-15",
        "7": "2025-02-20",
        "8": "2025-02-20",
        "9": "2025-02-25",
        "0": "2025-02-25",
    };

    const ipvaDueDate = dayjs(ipvaDueDates[lastDigit]);
    const diffDays = ipvaDueDate.diff(today, "day");

    let ipvaStatus = "IPVA sem informação"; // Caso não tenha data cadastrada

    if (diffDays < 0) {
        ipvaStatus = "🚨 IPVA vencido!";
    } else if (diffDays <= 7) {
        ipvaStatus = "⚠️ IPVA vence em poucos dias!";
    } else if (diffDays <= 30) {
        ipvaStatus = "📅 IPVA vence em menos de um mês!";
    } else if (diffDays <= 60) {
        ipvaStatus = "📅 IPVA vence em dois meses!";
    } else {
        ipvaStatus = "✅ IPVA está regular.";
    }

    return (
        <Provider>
            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator animating={true} size="50" />
                ) : (
                    <FlatList
                        data={vehicles}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                    />
                )}

                <Portal>
                    
                    <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modal}>
                        {selectedVehicle && (
                            <View>
                                <Title style={styles.modalTitle}>{selectedVehicle.plate.toUpperCase()}</Title>
                               
                                {
                                    selectedVehicle.plate ? <Paragraph style={styles.modalParagraph}>{ipvaStatus}</Paragraph> : null
                                }

                                {/* Exibir a data do último checklist abaixo da placa */}
                                <Paragraph style={styles.modalParagraph}>
                                    Último Checklist: {lastChecklistDate ? lastChecklistDate.toDate().toLocaleDateString() : "Nenhum checklist encontrado"}
                                </Paragraph>

                                {driverNames.map((driverName, index) => (
                                    <Paragraph key={index} style={styles.modalParagraph}>Motorista: {driverName}</Paragraph>
                                ))}

                                {selectedVehicle.userIds.length < 3 && (
                                    <>
                                        <TextInput
                                            label="Adicionar CPF do motorista"
                                            value={cpfInputs[selectedVehicle.userIds.length]}
                                            onChangeText={(text) => {
                                                const newInputs = [...cpfInputs];
                                                newInputs[selectedVehicle.userIds.length] = text;
                                                setCpfInputs(newInputs);
                                            }}
                                            mode="outlined"
                                            style={styles.input}
                                        />
                                        <Button
                                            mode="contained"
                                            onPress={() => handleAddCpf(selectedVehicle.userIds.length)}
                                            style={styles.addButton}
                                        >
                                            Adicionar CPF
                                        </Button>
                                    </>
                                )}

                                {selectedVehicle.userIds.map((cpf, index) => (
                                    <Button
                                        key={cpf}
                                        mode="outlined"
                                        onPress={() => handleUnlinkCpf(cpf)}
                                        style={styles.unlinkButton}
                                    >
                                        Desvincular CPF {driverNames[index]}
                                    </Button>
                                ))}

                                <Paragraph style={styles.modalParagraph}>Marca: {selectedVehicle.marca}</Paragraph>
                                <Paragraph style={styles.modalParagraph}>Modelo: {selectedVehicle.modelo}</Paragraph>
                                <Paragraph style={styles.modalParagraph}>Ano: {selectedVehicle.anoFab}</Paragraph>
                                <Paragraph style={styles.modalParagraph}>Cor: {selectedVehicle.cor}</Paragraph>
                                <Paragraph style={styles.modalParagraph}>Município: {selectedVehicle.municipio}</Paragraph>

                                <Button
                                    mode="outlined"
                                    onPress={closeModal}
                                    style={styles.closeButton}
                                >
                                    Fechar
                                </Button>

                                <Button
                                    mode="contained"
                                    onPress={confirmDeleteVehicle}
                                    style={styles.deleteButton}
                                >
                                    Excluir Veículo
                                </Button>
                            </View>
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
    },
    card: {
        marginVertical: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardParagraph: {
        fontSize: 14,
    },
    modal: {
        padding: 20,
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    modalParagraph: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        marginBottom: 16,
    },
    addButton: {
        marginBottom: 16,
    },
    unlinkButton: {
        marginVertical: 4,
    },
    closeButton: {
        marginTop: 16,
    },
    deleteButton: {
        marginTop: 16,
        backgroundColor: 'red',
    },
    listContainer: {
        paddingBottom: 100,
    },
});

export default VehicleView;
