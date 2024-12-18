import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Text, IconButton, TextInput, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

const CombustivelControl = ({ route }) => {
    const { Uemail, uid } = route.params;
    const [beforeImage, setBeforeImage] = useState(null);
    const [afterImage, setAfterImage] = useState(null);
    const [km, setKm] = useState('');
    const [loading, setLoading] = useState(false);
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
    }, []);

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

    const handleFuelControl = async () => {
        if (!beforeImage || !afterImage) {
            return Alert.alert('Atenção', 'Por favor, capture ambas as imagens do odômetro.');
        }

        if (!km || isNaN(km) || parseFloat(km) <= 0) {
            return Alert.alert('Atenção', 'Insira uma quilometragem válida.');
        }

        try {
            setLoading(true);
            // Simulação de salvamento de dados
            setTimeout(() => {
                Alert.alert('Sucesso', 'Informações de abastecimento registradas com sucesso!');
                setKm('');
                setBeforeImage(null);
                setAfterImage(null);
                setLoading(false);
            }, 2000);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro ao registrar as informações de abastecimento.');
        } finally {
            setLoading(false);
        }
    };

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
                            mode={beforeImage ? 'contained' : 'outlined'} // Destaque o botão se a imagem foi capturada
                            icon={beforeImage ? 'check-circle' : 'camera'}
                            style={styles.button}
                            onPress={() => pickImage('before')}
                            color={beforeImage ? theme.colors.green : theme.colors.primary}
                        >
                            Odômetro Antes
                        </Button>
                        <Button
                            mode={afterImage ? 'contained' : 'outlined'} // Destaque o botão se a imagem foi capturada
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
                        onPress={handleFuelControl}
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
        </View>
    );
};

export default CombustivelControl;

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
});
