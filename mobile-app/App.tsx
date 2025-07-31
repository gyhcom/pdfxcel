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
import HistoryScreen from './src/screens/HistoryScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';

export type RootStackParamList = {
  Home: undefined;
  Upload: undefined;
  Preview: { 
    fileId: string; 
    filename?: string;
    data?: Array<Record<string, any>>; // Claude API JSON 데이터
  };
  Result: { fileId: string; filename?: string };
  History: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false, // 헤더 완전 제거로 깔끔한 UI
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Upload" 
            component={UploadScreen}
            options={{ 
              headerShown: true,
              title: 'PDF 업로드',
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#333333',
              headerTitleStyle: { fontWeight: '600' }
            }}
          />
          <Stack.Screen 
            name="Preview" 
            component={PreviewScreen}
            options={{ 
              headerShown: true,
              title: '미리보기',
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#333333',
              headerTitleStyle: { fontWeight: '600' }
            }}
          />
          <Stack.Screen 
            name="Result" 
            component={ResultScreen}
            options={{ 
              headerShown: true,
              title: '변환 완료',
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#333333',
              headerTitleStyle: { fontWeight: '600' }
            }}
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen}
            options={{ 
              headerShown: true,
              title: '변환 기록',
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#333333',
              headerTitleStyle: { fontWeight: '600' }
            }}
          />
          <Stack.Screen 
            name="PrivacyPolicy" 
            component={PrivacyPolicyScreen}
            options={{ title: '개인정보 처리방침', headerShown: false }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
        <Toast />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}