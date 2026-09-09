import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchDriverManifest } from '../services/api';
import type { Delivery, DriverManifest } from '../types/delivery';

export default function ManifestScreen() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const [manifest, setManifest] = useState<DriverManifest | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadManifest = useCallback(async () => {
    if (!driverId) return;
    setError(null);
    try {
      setManifest(await fetchDriverManifest(driverId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load manifest.');
    }
  }, [driverId]);

  useEffect(() => { void loadManifest(); }, [loadManifest]);

  async function refresh() {
    setRefreshing(true);
    await loadManifest();
    setRefreshing(false);
  }

  function renderDelivery({ item }: { item: Delivery }) {
    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push({ pathname: '/delivery/[deliveryId]', params: {
          deliveryId: item.id,
          driverId,
          orderRef: item.orderRef,
          address: item.deliveryAddress,
          phone: item.customerPhone,
          status: item.status
        } })}
      >
        <View style={styles.cardTop}><Text style={styles.orderRef}>{item.orderRef}</Text><Text style={styles.status}>{item.status.replaceAll('_', ' ')}</Text></View>
        <Text style={styles.address}>{item.deliveryAddress}</Text>
        <Text style={styles.phone}>{item.customerPhone}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.eyebrow}>TODAY'S ROUTE</Text><Text style={styles.title}>{manifest?.driver.name ?? 'Driver manifest'}</Text></View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void loadManifest}><Text style={styles.retry}>Try again</Text></Pressable></View> : null}
      {!manifest && !error ? <ActivityIndicator color="#236b57" size="large" /> : null}
      {manifest ? <FlatList data={manifest.deliveries} keyExtractor={(item) => item.id} renderItem={renderDelivery} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} ListEmptyComponent={<Text style={styles.empty}>No deliveries assigned for today.</Text>} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f4', paddingTop: 24 },
  header: { paddingHorizontal: 20, paddingBottom: 18 },
  eyebrow: { color: '#2f6f5e', fontSize: 12, fontWeight: '700', letterSpacing: 1.4 },
  title: { color: '#14221f', fontSize: 30, fontWeight: '800', marginTop: 6 },
  list: { gap: 12, padding: 20 },
  card: { backgroundColor: '#ffffff', borderColor: '#dce5e0', borderRadius: 12, borderWidth: 1, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  orderRef: { color: '#14221f', fontSize: 17, fontWeight: '800' },
  status: { color: '#236b57', fontSize: 11, fontWeight: '800' },
  address: { color: '#31403b', fontSize: 15, lineHeight: 21 },
  phone: { color: '#718079', fontSize: 14, marginTop: 10 },
  empty: { color: '#53625e', fontSize: 16, paddingTop: 40, textAlign: 'center' },
  error: { alignItems: 'center', padding: 20 },
  errorText: { color: '#9b332d', textAlign: 'center' },
  retry: { color: '#236b57', fontWeight: '700', marginTop: 12 }
});
