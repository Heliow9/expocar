// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './src/screens/AuthScreen';
import AdminHome from './src/screens/AdminHome';
import UserHome from './src/screens/UserHome';
import UserRegistration from './src/screens/UserRegistration';
import VehicleRegistration from './src/screens/VehicleRegistration'
import VehicleViewer from './src/screens/VehicleView'
import VehicleViewOne from './src/screens/VehicleViewByUser'
import WeeklyChecklist from './src/screens/WeeklyChecklist';
import ChecklistViewer from './src/screens/ChecklistView';
import AllChecks from './src/screens/AllChecks';
import { Provider as PaperProvider } from 'react-native-paper';
import LiveChat from './src/screens/Livechat';
import LiveChatAdmin from './src/screens/LivechatAdmin';
import ManagerHome from './src/screens/ManagerHome'
import UserRegistrationManager from './src/screens/UserRegistrationManager';
import UsersViewerManager from './src/screens/UsersViewerManager';
import RouterControl from './src/screens/RouterControl'
import CombustivelControl from './src/screens/CombustivelControl';
import FuelFilter from './src/screens/FuelFilter';
const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="AuthScreen">
          <Stack.Screen name="AuthScreen" component={AuthScreen} options={{ title: 'RealEnergy Car' }} />
          <Stack.Screen name="UserHome" component={UserHome} options={{ title: 'Painel do Motorista' }} />
          <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: 'Painel do Administrador' }} />
          <Stack.Screen name="ManagerHome" component={ManagerHome} options={{ title: 'Painel do Gestor' }} />
          <Stack.Screen name="UserRegistration" component={UserRegistration} options={{ title: 'Registrar Usuario' }} />
          <Stack.Screen name="UserRegistrationManager" component={UserRegistrationManager} options={{ title: 'Registrar Motorista' }} />
          <Stack.Screen name="UsersViewerManager" component={UsersViewerManager} options={{ title: 'Lista de Motorista' }} />
          <Stack.Screen name="VehicleRegistration" component={VehicleRegistration} options={{ title: 'Registar Veiculo' }} />
          <Stack.Screen name="VehicleViewer" component={VehicleViewer} options={{ title: 'Visualizar Veiculo' }} />
          <Stack.Screen name="VehicleViewByUser" component={VehicleViewOne} options={{ title: 'Veiculos Vinculados' }} />
          <Stack.Screen name="WeeklyChecklist" component={WeeklyChecklist} options={{ title: 'Preencher Checklist Diário' }} />
          <Stack.Screen name="CombustivelControl" component={CombustivelControl} options={{ title: 'Controle de Combustivel' }} />
          <Stack.Screen name="FuelFilter" component={FuelFilter} options={{ title: 'Relatório de Abastecimentos' }} />
          <Stack.Screen name="CheckList Diário" component={ChecklistViewer} />
          <Stack.Screen name="Allchecks" component={AllChecks} options={{ title: "Todos os Checklist" }} />
          <Stack.Screen name="Live Chat" component={LiveChat} />
          <Stack.Screen name="Live ChatAdmin" component={LiveChatAdmin} />
          <Stack.Screen name="RouterControl" component={RouterControl} options={{ title: 'Rota Diária' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
