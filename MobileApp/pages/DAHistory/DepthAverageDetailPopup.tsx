import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {
  X,
  MapPin,
  Calendar,
  BarChart,
  Layers,
  Hash,
  Star,
} from 'react-native-feather';
import type {DepthAverageData} from '../../context/DepthAverageContext';

const {height: windowHeight} = Dimensions.get('window');
const MODAL_MAX_HEIGHT = windowHeight * 0.8;

interface DepthAverageDetailPopupProps {
  visible: boolean;
  data: DepthAverageData | null;
  onClose: () => void;
}

const DepthAverageDetailPopup: React.FC<DepthAverageDetailPopupProps> = ({
  visible,
  data,
  onClose,
}) => {
  if (!data) return null;

  const safeParse = (jsonStr: string | null | undefined) => {
    try {
      return JSON.parse(jsonStr || '{}');
    } catch {
      return {};
    }
  };

  console.log("data detail: ", data);
  const kedalamanObj: Record<string, string> =
    typeof data.kedalaman === 'string'
      ? safeParse(data.kedalaman)
      : data.kedalaman || {};

  const jumlahLubang = data.jumlahLubang || '0';

  const kedalamanItems = Object.entries(kedalamanObj)
    .map(([key, value]) => ({
      number: parseInt(key.replace(/[^0-9]/g, ''), 10),
      label: key.replace(/([A-Za-z]+)(\d+)/, '$1 $2'),
      value,
    }))
    .sort((a, b) => a.number - b.number);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, {maxHeight: MODAL_MAX_HEIGHT}]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Detail Depth Average</Text>
            <TouchableOpacity onPress={onClose}>
              <X width={24} height={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.bodyContainer}
            showsVerticalScrollIndicator={false}>
            {data.image && (
              <View style={styles.imageWrapper}>
                <Image
                  source={{uri: data.image}}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            )}

            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <Star width={20} height={20} color="#15803d" />
                <Text style={styles.infoTitle}>Priority: {data.prioritas}</Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin width={20} height={20} color="#15803d" />
                <Text style={styles.infoText}>
                  Lokasi: {data.location || '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Calendar width={20} height={20} color="#15803d" />
                <Text style={styles.infoText}>Tanggal: {data.date || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <BarChart width={20} height={20} color="#15803d" />
                <Text style={styles.infoText}>
                  Average: {data.average || '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Hash width={20} height={20} color="#15803d" />
                <Text style={styles.infoText}>
                  Jumlah Lubang: {jumlahLubang}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={[styles.infoRow, {marginBottom: 8}]}>
                <Layers width={20} height={20} color="#15803d" />
                <Text style={styles.sectionTitle}>Kedalaman</Text>
              </View>

              {kedalamanItems.length > 0 ? (
                <View style={styles.kedalamanList}>
                  {kedalamanItems.map((item, i) => (
                    <View
                      key={i}
                      style={[
                        styles.kedalamanRow,
                        i < kedalamanItems.length - 1 && styles.kedalamanBorder,
                      ]}>
                      <Text style={styles.kedalamanLabel}>{item.label}</Text>
                      <Text style={styles.kedalamanValue}>{item.value} cm</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Tidak ada data kedalaman</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DepthAverageDetailPopup;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bodyContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  infoBlock: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    marginLeft: 8,
    color: '#065f46',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    marginLeft: 8,
    color: '#065f46',
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    color: '#065f46',
    fontSize: 16,
    fontWeight: 'bold',
  },
  kedalamanList: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  kedalamanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  kedalamanBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  kedalamanLabel: {
    color: '#065f46',
    fontSize: 14,
  },
  kedalamanValue: {
    color: '#047857',
    fontSize: 14,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  closeButton: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
