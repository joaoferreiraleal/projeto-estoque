import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult, BarcodeType } from 'expo-camera';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useScannerLock } from '../src/hooks/useScannerLock';
import { registerStockMovement } from '../src/services/stockService';

const BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'itf14',
  'codabar',
  'qr',
];

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { locked, lock, tryLock } = useScannerLock();
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const scannerActive = useMemo(
    () => Boolean(permission?.granted && !locked && !modalVisible && !saving),
    [locked, modalVisible, permission?.granted, saving]
  );

  const closeQuantityModal = useCallback(() => {
    setModalVisible(false);
    setPendingBarcode(null);
    setQuantity('1');
    setErrorMessage(null);
    lock();
  }, [lock]);

  const handleCancelQuantity = useCallback(() => {
    if (saving) {
      return;
    }

    closeQuantityModal();
  }, [closeQuantityModal, saving]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!result.data || modalVisible || !tryLock()) {
        return;
      }

      setPendingBarcode(result.data);
      setQuantity('1');
      setErrorMessage(null);
      setSuccessMessage(null);
      setModalVisible(true);
    },
    [modalVisible, tryLock]
  );

  const handleConfirmQuantity = useCallback(async () => {
    if (!pendingBarcode) {
      return;
    }

    const trimmedQuantity = quantity.trim();
    const parsedQuantity = Number(trimmedQuantity);

    if (
      !/^\d+$/.test(trimmedQuantity) ||
      !Number.isSafeInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setErrorMessage('Informe uma quantidade maior que zero.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const movement = await registerStockMovement(
        pendingBarcode,
        parsedQuantity,
        getTodayMovementDate()
      );

      setSuccessMessage(
        `Registrado: ${movement.barcode} - quantidade ${movement.quantity}.`
      );
      closeQuantityModal();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [closeQuantityModal, pendingBarcode, quantity]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator color="#111827" size="large" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.permissionPanel}>
          <Text style={styles.permissionTitle}>Camera indisponivel</Text>
          <Text style={styles.permissionText}>
            A permissao da camera e necessaria para ler codigos de barras.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Permitir camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        active={scannerActive}
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
        facing="back"
        onBarcodeScanned={scannerActive ? handleBarcodeScanned : undefined}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Scanner</Text>
          {locked ? <Text style={styles.badge}>Pausado</Text> : null}
        </View>

        <View pointerEvents="none" style={styles.scanArea}>
          <View style={styles.scanFrame} />
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.statusText}>
            {successMessage ?? 'Aguardando leitura'}
          </Text>
        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        onRequestClose={handleCancelQuantity}
        transparent
        visible={modalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Quantidade</Text>
            <Text style={styles.barcodeText}>{pendingBarcode}</Text>

            <TextInput
              autoFocus
              editable={!saving}
              keyboardType="number-pad"
              onChangeText={setQuantity}
              returnKeyType="done"
              selectTextOnFocus
              style={styles.quantityInput}
              value={quantity}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                disabled={saving}
                onPress={handleCancelQuantity}
                style={[styles.secondaryButton, saving && styles.disabledButton]}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                disabled={saving}
                onPress={handleConfirmQuantity}
                style={[styles.primaryButton, saving && styles.disabledButton]}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Registrar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function getTodayMovementDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Nao foi possivel registrar a movimentacao.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  permissionPanel: {
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  permissionTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: '78%',
    maxWidth: 320,
    aspectRatio: 1.45,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bottomPanel: {
    minHeight: 56,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.58)',
    paddingHorizontal: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    padding: 20,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  barcodeText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '600',
  },
  quantityInput: {
    height: 54,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  primaryButton: {
    minHeight: 46,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 46,
    minWidth: 108,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
