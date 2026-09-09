import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { loginDriver } from '../services/api';

export default function LoginScreen() {
  const [driverId, setDriverId] = useState('');

  async function handleLogin() {
    if (!driverId.trim()) {
      Alert.alert('Driver ID required', 'Enter the UUID assigned to this driver.');
      return;
    }

    try {
      await loginDriver(driverId.trim());
      router.replace({ pathname: '/manifest', params: { driverId: driverId.trim() } });
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Unable to sign in.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>DELIVERY OPERATIONS</Text>
      <Text style={styles.title}>Driver sign in</Text>
      <Text style={styles.subtitle}>Enter your driver ID to load today's manifest.</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Driver UUID"
        placeholderTextColor="#82909b"
        value={driverId}
        onChangeText={setDriverId}
        style={styles.input}
      />
      <Pressable style={styles.primaryButton} onPress={() => void handleLogin()}>
        <Text style={styles.primaryButtonText}>View manifest</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f7f4' },
  eyebrow: { color: '#2f6f5e', fontSize: 12, fontWeight: '700', letterSpacing: 1.4, marginBottom: 12 },
  title: { color: '#14221f', fontSize: 34, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#53625e', fontSize: 16, lineHeight: 24, marginBottom: 28 },
  input: { backgroundColor: '#ffffff', borderColor: '#d5dfda', borderRadius: 10, borderWidth: 1, color: '#14221f', fontSize: 16, padding: 16, marginBottom: 14 },
  primaryButton: { alignItems: 'center', backgroundColor: '#236b57', borderRadius: 10, padding: 17 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
});
