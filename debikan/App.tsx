import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StatusBar,
  useColorScheme,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

import { initDB } from './src/Database';
import ItemManager from './src/components/ItemManager';
import MonthlyView from './src/components/MonthlyView';
import SettingsScreen from './src/components/SettingsScreen';

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    initDB()
      .then(() => {
        setDbInitialized(true);
        console.log('Database initialized');
      })
      .catch((err) => {
        console.log('Database initialization failed', err);
      });
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#111' : '#FFF',
    flex: 1,
  };

  if (!dbInitialized) {
    return (
      <View style={[backgroundStyle, {flex: 1, justifyContent: 'center', alignItems: 'center'}]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Text>Initializing Database...</Text>
      </View>
    );
  }

  const headerRightButton = () => (
    <TouchableOpacity
      onPress={() => setIsSettingsVisible(true)}
      style={{ marginRight: 16 }}
    >
      <Feather name="settings" size={22} color="gray" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Monthly') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Items') {
                iconName = focused ? 'list' : 'list-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: 'gray',
            headerRight: headerRightButton,
          })}
        >
          <Tab.Screen 
            name="Monthly"
            component={MonthlyView}
            options={{ title: '月次' }} 
          />
          <Tab.Screen 
            name="Items"
            component={ItemManager}
            options={{ title: '項目管理' }} 
          />
        </Tab.Navigator>
      </NavigationContainer>
      <Modal
        animationType="slide"
        visible={isSettingsVisible}
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <SettingsScreen onClose={() => setIsSettingsVisible(false)} />
      </Modal>
    </SafeAreaProvider>
  );
}

export default App;