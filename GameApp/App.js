// GameApp/App.js
/**
 * PROJECT 1 — GameApp
 * Luồng: WelcomeScreen → GameplayScreen
 * Khi thắng: Linking.openURL → UserApp (Project 2)
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import WelcomeScreen  from './src/screens/WelcomeScreen';
import GameplayScreen from './src/screens/GameplayScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar hidden />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            cardStyle: { backgroundColor: '#000' },
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: { opacity: current.progress },
            }),
          }}
        >
          <Stack.Screen name="Welcome"  component={WelcomeScreen} />
          <Stack.Screen name="Gameplay" component={GameplayScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
