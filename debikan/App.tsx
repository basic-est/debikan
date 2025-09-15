import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StatusBar,
  useColorScheme
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDB } from './src/Database';
import ItemManager from './src/components/ItemManager';
import MonthlyView from './src/components/MonthlyView';

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  const [dbInitialized, setDbInitialized] = useState(false);
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

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator>
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
    </SafeAreaProvider>
  );
}

export default App;