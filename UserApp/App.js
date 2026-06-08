// UserApp/App.js
/**
 * PROJECT 2 — UserApp
 * Luồng: InputFormScreen → WheelScreen → ResultScreen
 * Responsive: hoạt động tốt trên cả Phone lẫn Tablet
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import InputFormScreen from './src/screens/InputFormScreen';
import WheelScreen     from './src/screens/WheelScreen';
import ResultScreen    from './src/screens/ResultScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <StatusBar hidden />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="InputForm"
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            cardStyle: { backgroundColor: '#080A0F' },
            cardStyleInterpolator: ({ current, next, layouts }) => ({
              cardStyle: {
                opacity: current.progress,
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange:  [0, 1],
                      outputRange: [layouts.screen.width * 0.08, 0],
                    }),
                  },
                ],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [0, 0.4],
                }),
              },
            }),
          }}
        >
          <Stack.Screen name="InputForm" component={InputFormScreen} />
          <Stack.Screen name="Wheel"     component={WheelScreen} />
          <Stack.Screen name="Result"    component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
