import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import HomeScreen from './src/screens/HomeScreen';
import UploadScreen from './src/screens/UploadScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import ResultScreen from './src/screens/ResultScreen';

export type RootStackParamList = {
  Home: undefined;
  Upload: undefined;
  Preview: { 
    fileId: string; 
    filename?: string;
    data?: Array<Record<string, any>>; // Claude API JSON 데이터
  };
  Result: { fileId: string; filename?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'PDFXcel' }}
          />
          <Stack.Screen 
            name="Upload" 
            component={UploadScreen}
            options={{ title: 'PDF 업로드' }}
          />
          <Stack.Screen 
            name="Preview" 
            component={PreviewScreen}
            options={{ title: '미리보기' }}
          />
          <Stack.Screen 
            name="Result" 
            component={ResultScreen}
            options={{ title: '변환 완료' }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
        <Toast />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}