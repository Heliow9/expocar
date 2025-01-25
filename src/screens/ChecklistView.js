import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { List, Card, Provider } from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { firestore } from '../database/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';


const ChecklistView = ({ route }) => {
  const { Uemail } = route.params;

  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChecklistId, setExpandedChecklistId] = useState(null);

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const checklistQuery = query(
          collection(firestore, 'checklists'),
          where('Uemail', '==', Uemail),
          orderBy('createdAt', 'desc')
        );

        const checklistSnapshot = await getDocs(checklistQuery);
        const checklistData = checklistSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const checklistsWithImages = checklistData.filter(item =>
          Object.values(item.items).some(detail => detail.imgurl)
        );

        const checklistsWithoutImages = checklistData.filter(item =>
          !Object.values(item.items).some(detail => detail.imgurl)
        );

        const sortedChecklistData = [...checklistsWithImages, ...checklistsWithoutImages];

        setChecklists(sortedChecklistData);
      } catch (error) {
        console.error('Erro ao buscar checklists: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [Uemail]);

  const toggleExpandedChecklist = (checklistId) => {
    setExpandedChecklistId(prevId => (prevId === checklistId ? null : checklistId));
  };

  const formatDate = (date) => {
    return date.toDate().toLocaleDateString('pt-BR');
  };

  const shareImage = async (url) => {
    try {
      const fileUri = FileSystem.documentDirectory + 'sharedImage.jpg';
      const response = await FileSystem.downloadAsync(url, fileUri);
      await Sharing.shareAsync(response.uri);
    } catch (error) {
      console.error('Erro ao compartilhar a imagem: ', error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="50" color="#00796b" />;
  }

  return (
    <Provider>
      <View style={styles.container}>
        <FlatList
          data={checklists}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <List.Item
                title={<Text style={styles.itemTitle}>Veículo: {item.marca}</Text>}
                description={
                  <Text style={styles.description}>
                    Placa: {item.plate} {'\n'}Data: {formatDate(item.createdAt)}
                  </Text>
                }
                left={props => <List.Icon {...props} icon="car" color="#2e86de" />}
                onPress={() => toggleExpandedChecklist(item.id)}
                style={styles.listItem}
              />
              {expandedChecklistId === item.id && (
                <View style={styles.expandedContent}>
                  {item.items && Object.entries(item.items).map(([key, details]) => (
                    <View key={key} style={styles.itemContainer}>
                      <Text style={styles.itemLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}:</Text>
                      <Text style={styles.itemDetail}>Condição: {details.condition}</Text>

                      {/* Exibir imagem se disponível */}
                      {details.imgurl && (
                        <View>
                          <Image
                            source={{ uri: details.imgurl }}
                            style={styles.image}
                          />
                          <TouchableOpacity onPress={() => shareImage(details.imgurl)}>
                            <Text style={styles.shareText}>Compartilhar</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <Text style={styles.itemDetail}>Observação: {details.observation || 'Nenhuma observação'}</Text>
                    </View>
                  ))}

                  {/* Exibir nível de combustível com KM */}
                  {item.items.nivelCombustivel && (
                    <View style={styles.itemContainer}>
                      <Text style={styles.itemLabel}>Nível de Combustível:</Text>
                      <Text style={styles.itemDetail}>Condição: {item.items.nivelCombustivel.condition}</Text>
                      <Text style={styles.itemDetail}>KM: {item.items.nivelCombustivel.km}</Text>

                      {item.items.nivelCombustivel.imageUrl && (
                        <View>
                          <Image
                            source={{ uri: item.items.nivelCombustivel.imageUrl }}
                            style={styles.image}
                          />
                          <TouchableOpacity onPress={() => shareImage(item.items.nivelCombustivel.imageUrl)}>
                            <Text style={styles.shareText}>Compartilhar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <Text style={styles.itemDetail}>Observação: {item.items.nivelCombustivel.observation || 'Nenhuma observação'}</Text>
                    </View>
                  )}

                  {/* Exibir líquido de arrefecimento */}
                  {item.items.liquidoArrefecimento && (
                    <View style={styles.itemContainer}>
                      <Text style={styles.itemLabel}>Líquido de Arrefecimento:</Text>
                      <Text style={styles.itemDetail}>Condição: {item.items.liquidoArrefecimento.condition}</Text>

                      {item.items.liquidoArrefecimento.imageUrl && (
                        <View>
                          <Image
                            source={{ uri: item.items.liquidoArrefecimento.imageUrl }}
                            style={styles.image}
                          />
                          <TouchableOpacity onPress={() => shareImage(item.items.liquidoArrefecimento.imageUrl)}>
                            <Text style={styles.shareText}>Compartilhar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <Text style={styles.itemDetail}>Observação: {item.items.liquidoArrefecimento.observation || 'Nenhuma observação'}</Text>
                    </View>
                  )}

                  {/* Exibir óleo do motor */}
                  {item.items.oleoMotor && (
                    <View style={styles.itemContainer}>
                      <Text style={styles.itemLabel}>Óleo do Motor:</Text>
                      <Text style={styles.itemDetail}>Condição: {item.items.oleoMotor.condition}</Text>

                      {item.items.oleoMotor.imageUrl && (
                        <View>
                          <Image
                            source={{ uri: item.items.oleoMotor.imageUrl }}
                            style={styles.image}
                          />
                          <TouchableOpacity onPress={() => shareImage(item.items.oleoMotor.imageUrl)}>
                            <Text style={styles.shareText}>Compartilhar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <Text style={styles.itemDetail}>Observação: {item.items.oleoMotor.observation || 'Nenhuma observação'}</Text>
                    </View>
                  )}

                  {/* Exibir localização no mapa, se disponível */}
                  {/* {item.location && item.location.latitude && item.location.longitude && (
                    <View style={styles.mapContainer}>
                      <Text style={styles.itemLabel}>Localização do Checklist:</Text>
                      <MapView
                        provider={PROVIDER_DEFAULT} // Usa OpenStreetMap
                        style={styles.map}
                        initialRegion={{
                          latitude: item.location.latitude,
                          longitude: item.location.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                      >
                        <Marker
                          coordinate={{
                            latitude: item.location.latitude,
                            longitude: item.location.longitude,
                          }}
                          title="Localização do Checklist"
                        />
                      </MapView>
                    </View>
                  )} */}


                </View>
              )}
            </Card>
          )}
        />
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f6f7',
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 4,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e86de',
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  expandedContent: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9fafb',
  },
  itemContainer: {
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
  },
  itemDetail: {
    fontSize: 14,
    color: '#7f8c8d',
    paddingLeft: 10,
  },
  image: {
    width: 300,
    height: 180,
    marginVertical: 5,
    borderRadius: 8,
  },
  shareText: {
    color: '#00796b',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mapContainer: {
    marginTop: 15,
    height: 200, // Defina uma altura fixa para o mapa
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

export default ChecklistView;
