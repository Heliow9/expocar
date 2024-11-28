import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Card, Modal, Portal, Button, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../database/firebase'; // Certifique-se de importar o firestore corretamente

const UsersViewerManager = ({ route }) => {
    const { Uemail } = route.params;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUserData = async () => {
        try {
            // 1. Buscar todos os centros de custo que têm o Uemail como ccResponsavel
            const ccQuery = query(
                collection(firestore, 'cc'),
                where('ccResponsavel', '==', Uemail)
            );
            const ccSnapshot = await getDocs(ccQuery);

            if (!ccSnapshot.empty) {
                // Pega os números dos centros de custo
                const ccNumbers = ccSnapshot.docs.map(doc => doc.id); // Aqui os IDs dos centros de custo são obtidos

                // 2. Buscar os usuários vinculados aos centros de custo encontrados
                const userQuery = query(
                    collection(firestore, 'users'),
                    where('cc', 'in', ccNumbers) // Consulta ajustada para comparar 'cc' com os números de centros de custo
                );

                const usersSnapshot = await getDocs(userQuery);
                if (!usersSnapshot.empty) {
                    const userData = usersSnapshot.docs.map(doc => doc.data());
                    setUsers(userData);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar os dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [Uemail]);

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedUser(null);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator animating={true} size="50" />
                <Text>Carregando...</Text>
            </View>
        );
    }
    const formatDate = (isoDate) => {
        const date = new Date(isoDate);

        // Extrair dia, mês e ano
        const day = String(date.getDate()).padStart(2, '0'); // Adiciona '0' se for menor que 10
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa do zero
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };
    const checkCnhStatus = (cnhValidade) => {
        if (!cnhValidade) return 'Não Cadastrado';

        let cnhDate;

        // Verifica se cnhValidade é um timestamp Firestore
        if (cnhValidade.seconds) {
            cnhDate = new Date(cnhValidade.seconds * 1000); // Converte segundos para milissegundos
        } else {
            cnhDate = new Date(cnhValidade); // Assume que é uma string de data ou formato compatível
        }

        console.log(cnhDate);

        if (isNaN(cnhDate)) {
            console.error("Formato de data inválido:", cnhValidade);
            return "Data Inválida";
        }

        const currentDate = new Date();
        return cnhDate < currentDate ? `Vencida / ${formatDate(cnhDate)}` : `Válida / ${formatDate(cnhDate)}`;
    };

    return (
        <View style={{ flex: 1, padding: 10 }}>
            {users.length > 0 ? (
                <FlatList
                    data={users}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Card style={{ marginBottom: 10 }} onPress={() => handleOpenModal(item)}>
                            <Card.Title title={item.name} subtitle={item.email} />
                            <Card.Content>
                                <Text>Centro de Custo: {item.cc}</Text>
                            </Card.Content>
                        </Card>
                    )}
                />
            ) : (
                <Text>Nenhum usuário encontrado.</Text>
            )}

            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={handleCloseModal}
                    contentContainerStyle={{
                        backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        marginHorizontal: 20,
                        maxHeight: '80%',
                        alignItems: 'center',
                    }}
                >
                    {selectedUser && (

                        <View style={{ width: '100%' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Detalhes do Usuário</Text>
                            <Text style={{ marginBottom: 10 }}>Nome: {selectedUser.name}</Text>
                            <Text style={{ marginBottom: 10 }}>Email: {selectedUser.email}</Text>
                            <Text style={{ marginBottom: 10 }}>Centro de Custo: {selectedUser.cc}</Text>
                            <Text style={{ marginBottom: 10 }}>CNH: {selectedUser ? selectedUser.cnh : 'Não Cadastrado.'}</Text>
                            <Text style={{ marginBottom: 10 }}>
                                CNH Status: {checkCnhStatus(selectedUser.cnhExpiration)}
                            </Text>
                            <Text style={{ marginBottom: 10 }}>CPF: {selectedUser.cpf}</Text>
                            <Text style={{ marginBottom: 10 }}>RG: {selectedUser.rg}</Text>
                            <Text style={{ marginBottom: 10 }}>Data de Nascimento: {selectedUser.birthDate}</Text>
                            <Text style={{ marginBottom: 10 }}>Celular:  {selectedUser.cellphone?selectedUser.cellphone : 'não informado.'}</Text>
                            <Text style={{ marginBottom: 10 }}>Tipo Sanguíneo:  {selectedUser.bloodType?selectedUser.bloodType : 'não informado.'}</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Contatos de Emergencia</Text>
                            <Text style={{ marginBottom: 10 }}>Nome: {selectedUser.emergencyContact.name?selectedUser.emergencyContact.name : 'não informado.'}</Text>
                            <Text style={{ marginBottom: 10 }}>Telefone: {selectedUser.emergencyContact.phone?selectedUser.emergencyContact.phone : 'não informado.'}</Text>
                            <Text style={{ marginBottom: 10 }}>Relação: {selectedUser.emergencyContact.relation?selectedUser.emergencyContact.relation : 'não informado.'}</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Outras informações</Text>
                            <Text style={{ marginBottom: 10 }}>Observações Gerais: {selectedUser.generalObservations?selectedUser.generalObservations : 'não informado.'}</Text>
                            <Text style={{ marginBottom: 10 }}>Restrições Medicas: {selectedUser.medicalRestrictions?selectedUser.medicalRestrictions : 'nada consta.'}</Text>

                            <Button
                                mode="contained"
                                onPress={handleCloseModal}
                                style={{ marginTop: 20, alignSelf: 'center' }}
                            >
                                Fechar
                            </Button>
                        </View>
                    )}
                </Modal>
            </Portal>
        </View>
    );
};

export default UsersViewerManager;
