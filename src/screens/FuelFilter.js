
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, TextInput, Card, Menu, Divider } from 'react-native-paper';
import React, { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../database/firebase'
import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FetchByUserDate } from '../utils/report';
const FuelFilter = ({ route }) => {

    const { Uemail, uid } = route.params;


    const [filterType, setFilterType] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState({ start: false, end: false });
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedCostCenter, setSelectedCostCenter] = useState('');
    const [drivers] = useState(['João', 'Maria', 'Pedro']); // Simulação de motoristas disponíveis.
    const [costCenters] = useState(['01', '02', '03']); // Simulação de centros de custo disponíveis.
    const [selectedMotorista, setSelectedMotorista] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [driverName, setDriverName] = useState(false);
    const [motoristas, setMotoristas] = useState([])



    useEffect(() => {
        const fetchMotoristas = async () => {
            try {
                // Buscar os centros de custo onde o ccResponsavel é igual ao Uemail
                const ccCollectionRef = collection(firestore, 'cc');
                const ccQuery = query(ccCollectionRef, where('ccResponsavel', '==', Uemail));
                const ccSnapshot = await getDocs(ccQuery);

                const ccIds = ccSnapshot.docs.map((doc) => doc.id);

                if (ccIds.length === 0) {
                    console.log('Nenhum centro de custo encontrado para este gestor.');
                    setMotoristas([]);
                    return;
                }

                // Buscar todos os usuários
                const usersCollectionRef = collection(firestore, 'users');
                const usersSnapshot = await getDocs(usersCollectionRef);

                let motoristasList = [];

                usersSnapshot.forEach((userDoc) => {
                    const userData = userDoc.data();

                    // Verificar se o usuário tem algum CC que coincida com os CCs do gestor
                    // Verificar se o usuário tem o mesmo CC que um dos CCs do gestor
                    if (ccIds.includes(userData.cc)) {
                        motoristasList.push({
                            id: userDoc.id,
                            ...userData,
                        });
                    }
                });

                setMotoristas(motoristasList);
                console.log(motoristasList);
            } catch (error) {
                console.error('Erro ao buscar motoristas:', error);
            }
        };

        fetchMotoristas();
    }, [Uemail]);




    const handleDateChange = (event, date, type) => {
        setShowDatePicker({ start: false, end: false }); // Fecha o DateTimePicker ao selecionar a data
        if (date) {
            if (type === 'start') {
                setStartDate(date); // Atualiza a data inicial corretamente
            } else {
                setEndDate(date); // Atualiza a data final corretamente
            }
        }
    };

    // Função para lidar com o fechamento do menu
    const handleMenuDismiss = () => {
        setMenuVisible(false); // Apenas fecha o menu sem alterar o valor de selectedDriver
    };

    // Função para abrir o menu
    const handleMenuOpen = () => {
        setMenuVisible(true); // Abre o menu
    };
    console.log(selectedDriver)

    const renderInputs = () => {
        switch (filterType) {
            case 'motorista':
                return (
                    <>
                        <Text variant="titleMedium" style={styles.label}>
                            Selecione o Motorista
                        </Text>
                        <Menu
                            visible={menuVisible} // Controla a visibilidade do menu
                            onDismiss={handleMenuDismiss} // Fecha o menu ao clicar fora
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={handleMenuOpen} // Abre o menu ao clicar no botão
                                >
                                    {driverName || 'Selecionar Motorista'}  {/* Exibe o nome do motorista ou "Selecionar Motorista" */}
                                </Button>
                            }
                        >
                            {motoristas.map((driver, index) => (
                                <Menu.Item
                                    key={index}
                                    onPress={() => {
                                        setSelectedDriver(driver.cpf); // Atualiza o motorista selecionado
                                        setDriverName(driver.name); // Atualiza o motorista selecionado
                                        setMenuVisible(false); // Fecha o menu após a seleção
                                    }}
                                    title={driver.name} // Exibe o nome do motorista
                                />
                            ))}
                        </Menu>
                        <Divider style={styles.divider} />
                        {renderDateInputs()}
                    </>
                );

            case 'centroCusto':
                return (
                    <>
                        <Text variant="titleMedium" style={styles.label}>
                            Selecione o Centro de Custo
                        </Text>
                        <Menu
                            visible={!!selectedCostCenter}
                            onDismiss={() => setSelectedCostCenter('')}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setSelectedCostCenter('open')}
                                >
                                    {selectedCostCenter || 'Selecionar Centro de Custo'}
                                </Button>
                            }
                        >
                            {costCenters.map((center, index) => (
                                <Menu.Item
                                    key={index}
                                    onPress={() => setSelectedCostCenter(center)}
                                    title={center}
                                />
                            ))}
                        </Menu>
                        <Divider style={styles.divider} />
                        {renderDateInputs()}
                    </>
                );
            case 'data':
                return renderDateInputs();
            default:
                return null;
        }
    };

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Os meses são baseados em zero
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };




    const renderDateInputs = () => (
        <>
            <Text variant="titleMedium" style={styles.label}>
                Data Inicial
            </Text>
            <Button
                mode="outlined"
                onPress={() => setShowDatePicker({ ...showDatePicker, start: true })}
                style={styles.dateButton}
            >
                {formatDate(startDate)}  {/* Exibe corretamente a data inicial */}
            </Button>
            {showDatePicker.start && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => handleDateChange(e, date, 'start')}
                />
            )}
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.label}>
                Data Final
            </Text>
            <Button
                mode="outlined"
                onPress={() => setShowDatePicker({ ...showDatePicker, end: true })}
                style={styles.dateButton}
            >
                {formatDate(endDate)}  {/* Exibe corretamente a data final */}
            </Button>
            {showDatePicker.end && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => handleDateChange(e, date, 'end')}
                />
            )}
        </>
    );

    function handlerGetReport() {
        if (selectedDriver) {
            FetchByUserDate(selectedDriver, startDate, endDate)
        } else {
            return Alert.alert('Erro', 'Selecione um motorista')
        }
    }

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Filtros de Relatórios
            </Text>
            <View style={styles.buttonGroup}>
                <Button
                    mode="contained"
                    style={styles.filterButton}
                    onPress={() => setFilterType('motorista')}
                >
                    Motorista
                </Button>
                <Button
                    mode="contained"
                    style={styles.filterButton}
                    onPress={() => setFilterType('centroCusto')}
                >
                    C. Custo
                </Button>
                <Button
                    mode="contained"
                    style={styles.filterButton}
                    onPress={() => setFilterType('data')}
                >
                    Por Data
                </Button>
            </View>
            <Card style={styles.card}>
                <Card.Content>{renderInputs()}</Card.Content>
            </Card>
            <Button mode="contained" style={styles.submitButton}

                onPress={() => handlerGetReport()}

            >
                Gerar Relatório
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    filterButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    card: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
    },
    input: {
        marginBottom: 16,
    },
    divider: {
        marginVertical: 16,
    },
    dateButton: {
        marginBottom: 16,
    },
    submitButton: {
        marginTop: 16,
    },
});

export default FuelFilter;
