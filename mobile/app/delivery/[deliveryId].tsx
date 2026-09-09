import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { updateDeliveryStatus, uploadProofOfDelivery } from '../../services/api';
import type { DeliveryStatus } from '../../types/delivery';

export default function DeliveryDetailsScreen() {
  const params = useLocalSearchParams<{ deliveryId: string; driverId: string; orderRef: string; address: string; phone: string; status: DeliveryStatus }>();
  const [status, setStatus] = useState<DeliveryStatus>(params.status ?? 'READY_FOR_DISPATCH');
  const [saving, setSaving] = useState(false);

  async function changeStatus(nextStatus: 'OUT_FOR_DELIVERY' | 'DELIVERED') {
    if (!params.deliveryId || !params.driverId || saving) return;
    setSaving(true);
    try {
      let proofUri: string | undefined;
      if (nextStatus === 'DELIVERED') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera permission required', 'Allow camera access to capture Proof of Delivery.');
          return;
        }

        const capture = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.75,
          allowsEditing: true
        });
        if (capture.canceled || !capture.assets[0]?.uri) return;
        proofUri = capture.assets[0].uri;
      }

      const delivery = await updateDeliveryStatus(params.deliveryId, params.driverId, nextStatus);
      if (proofUri) await uploadProofOfDelivery(params.deliveryId, params.driverId, proofUri);
      setStatus(delivery.status);
      Alert.alert('Status updated', proofUri ? 'Delivery marked complete and Proof of Delivery uploaded.' : `${params.orderRef} is now ${delivery.status.replaceAll('_', ' ')}.`);
    } catch (requestError) {
      Alert.alert('Could not update status', requestError instanceof Error ? requestError.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const canStart = status === 'READY_FOR_DISPATCH';
  const canDeliver = status === 'OUT_FOR_DELIVERY';

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>DELIVERY DETAIL</Text>
      <Text style={styles.orderRef}>{params.orderRef}</Text>
      <View style={styles.detailBlock}><Text style={styles.label}>Delivery address</Text><Text style={styles.value}>{params.address}</Text></View>
      <View style={styles.detailBlock}><Text style={styles.label}>Customer phone</Text><Text style={styles.value}>{params.phone}</Text></View>
      <View style={styles.statusPill}><Text style={styles.statusText}>{status.replaceAll('_', ' ')}</Text></View>
      <View style={styles.actions}>
        <Pressable disabled={!canStart || saving} style={[styles.actionButton, (!canStart || saving) && styles.disabled]} onPress={() => void changeStatus('OUT_FOR_DELIVERY')}><Text style={styles.actionText}>Start Route</Text><Text style={styles.actionHint}>Out for Delivery</Text></Pressable>
        <Pressable disabled={!canDeliver || saving} style={[styles.actionButton, styles.deliveredButton, (!canDeliver || saving) && styles.disabled]} onPress={() => void changeStatus('DELIVERED')}><Text style={styles.actionText}>Mark Delivered</Text><Text style={styles.actionHint}>Confirm drop-off</Text></Pressable>
      </View>
      <Pressable style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>Back to manifest</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f4', padding: 22 },
  eyebrow: { color: '#2f6f5e', fontSize: 12, fontWeight: '700', letterSpacing: 1.4, marginTop: 12 },
  orderRef: { color: '#14221f', fontSize: 32, fontWeight: '800', marginBottom: 30, marginTop: 8 },
  detailBlock: { borderBottomColor: '#dce5e0', borderBottomWidth: 1, paddingBottom: 16, paddingTop: 16 },
  label: { color: '#718079', fontSize: 12, fontWeight: '700', marginBottom: 7, textTransform: 'uppercase' },
  value: { color: '#31403b', fontSize: 17, lineHeight: 24 },
  statusPill: { alignSelf: 'flex-start', backgroundColor: '#dceee7', borderRadius: 20, marginTop: 22, paddingHorizontal: 14, paddingVertical: 8 },
  statusText: { color: '#236b57', fontSize: 12, fontWeight: '800' },
  actions: { gap: 12, marginTop: 36 },
  actionButton: { alignItems: 'center', backgroundColor: '#236b57', borderRadius: 12, padding: 18 },
  deliveredButton: { backgroundColor: '#173f35' },
  disabled: { backgroundColor: '#aebbb5' },
  actionText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  actionHint: { color: '#d9eee7', fontSize: 13, marginTop: 4 },
  backButton: { alignItems: 'center', marginTop: 22, padding: 12 },
  backText: { color: '#236b57', fontSize: 15, fontWeight: '700' }
});
