import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { useAdminStore } from './src/store/useAdminStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdminNavigator } from './src/navigation/AdminNavigator';

export default function App() {
  const admin = useAdminStore((state) => state.admin);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        {admin ? <AdminNavigator /> : <LoginScreen />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
