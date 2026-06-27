import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult, BarcodeType } from 'expo-camera';
import { Link } from 'expo-router';
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

import { AppBackground } from '../src/components/AppBackground';
import { BackIcon } from '../src/components/AppIcons';
import { colors, gradients, radius } from '../src/theme/design';
import { useScannerLock } from '../src/hooks/useScannerLock';
import { getTodayMovementDate, registerStockMovement } from '../src/services/stockService';

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
      <AppBackground contentStyle={styles.centeredContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={colors.white} size="large" />
      </AppBackground>
    );
  }

  if (!permission.granted) {
    return (
      <AppBackground contentStyle={styles.centeredContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionPanel}>
          <Text style={styles.permissionTitle}>Camera indisponivel</Text>
          <Text style={styles.permissionText}>
            A permissao da camera e necessaria para ler codigos de barras.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Permitir camera</Text>
          </Pressable>
        </View>
      </AppBackground>
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
      <LinearGradient
        colors={gradients.cameraOverlay}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <Link asChild href="/">
            <Pressable
              accessibilityLabel="Voltar para inicio"
              accessibilityRole="button"
              style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            >
              <BackIcon />
            </Pressable>
          </Link>

          <View style={styles.topTitleBlock}>
            <Text style={styles.title}>Scanner</Text>
            <Text style={styles.screenSubtitle}>Aponte para o codigo</Text>
          </View>

          <View style={styles.topRight}>
            {locked ? <Text style={styles.badge}>Pausado</Text> : null}
          </View>
        </View>

        <View pointerEvents="none" style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            <View style={styles.scanLine} />
          </View>
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
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                  saving && styles.disabledButton,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                disabled={saving}
                onPress={handleConfirmQuantity}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  saving && styles.disabledButton,
                ]}
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Nao foi possivel registrar a movimentacao.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy950,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionPanel: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 16,
  },
  permissionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  navButtonPressed: {
    backgroundColor: colors.surfaceStrong,
  },
  topTitleBlock: {
    alignItems: 'center',
    gap: 3,
  },
  topRight: {
    width: 78,
    alignItems: 'flex-end',
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceStrong,
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: 'rgba(8, 17, 33, 0.18)',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.green,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    right: -2,
    bottom: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    width: '72%',
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.blue,
  },
  bottomPanel: {
    minHeight: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: 16,
  },
  statusText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(3, 8, 16, 0.78)',
    padding: 20,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  barcodeText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  quantityInput: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    minHeight: 46,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.green,
    paddingHorizontal: 18,
  },
  primaryButtonPressed: {
    backgroundColor: colors.greenPressed,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 46,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.bluePressed,
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
