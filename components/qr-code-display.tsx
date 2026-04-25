import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';

interface QRCodeDisplayProps {
  visible: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
  subtitle?: string;
}

// Simple QR code representation using ASCII art pattern
// In production, use react-native-qrcode-svg library
const QR_ASCII_PATTERN = `
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
▀▀▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▀▀
▀▄▄██▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀██▄▄▀
▀▄██▀▀▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▀▀██▄▀
▀▄██▄▄██▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀██▄▄██▄▀
▀▄██████▀▀▄▄▄▄▄▄▄▄▄▄▄▄▀▀██████▄▀
▀▄██████▄▄██▀▀▀▀▀▀▀▀██▄▄██████▄▀
▀▄██████████▀▀▄▄▀▀██████████▄▄▀
▀▄██████████▄▄██▄▄██████████▄▄▀
▀▄██████████████▄▄██████████▄▀
▀▄██████████▄▄████▄▄████████▄▀
▀▄██████▄▄████▀▀████▄▄██████▄▀
▀▄██████▄▄████▄▄████▄▄██████▄▀
▀▄████▄▄████▀▀████▄▄████████▄▀
▀▄██▄▄████▄▄████▀▀██████████▄▀
▀▄██▄▄██▀▀████▄▄████████████▄▀
▀▄▄████▄▄██▀▀▀▀████████████▄▀
▀▀▄██▄▄████▄▄████████████▄▄▀
▀▀▄▄██▄▄██▀▀▀▀▀▀▀▀▀▀▀▀██▄▄▀▀
▀▀▀▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▀▀▀
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`;

export function QRCodeDisplay({ 
  visible, 
  onClose, 
  url = 'https://github.com/seeditDev/TaskMe/releases/latest',
  title = 'Download TaskMe',
  subtitle = 'Scan with your phone camera'
}: QRCodeDisplayProps) {
  const colors = useColors();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* QR Code Area */}
          <View style={[styles.qrContainer, { backgroundColor: colors.background }]}>
            <Text style={styles.qrAscii}>{QR_ASCII_PATTERN}</Text>
          </View>

          {/* Instructions */}
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {subtitle}
          </Text>
          
          <Text style={[styles.url, { color: colors.primary }]} numberOfLines={2}>
            {url}
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.brand, { color: colors.muted }]}>
              TaskMe by SEED-ITES
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrAscii: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 11,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  url: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    marginTop: 8,
  },
  brand: {
    fontSize: 12,
  },
});

// Usage example:
// const [showQR, setShowQR] = useState(false);
// <QRCodeDisplay visible={showQR} onClose={() => setShowQR(false)} />
