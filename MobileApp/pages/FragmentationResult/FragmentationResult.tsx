// FragmentationResult.tsx
import React, {useContext} from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {FormContext} from '../../context/FragmentationContext';
import { API_IP } from '@env';
import { useToast } from '../../context/ToastContext';

type NavProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationResult'
>;

export default function FragmentationResult() {
  const navigation = useNavigation<NavProp>();
  const {formData, saveToDatabase} = useContext(FormContext);
  const result = formData.finalAnalysisResults[0];
  const screenWidth = Dimensions.get('window').width;
  const {showToast} = useToast()
  // Replace localhost → 10.0.2.2 on Android emulator
  const imageUri = result.plot_image_base64.replace('localhost', API_IP);

  const summaryArray = Object.entries(result.threshold_percentages)
    .map(([size, pct]) => ({size: parseFloat(size), pct}))
    .sort((a, b) => b.size - a.size);

  const onSave = async () => {
    const ok = await saveToDatabase();
    if (ok) {
      showToast("Save Fragmentation success", "success")
      navigation.navigate('Homepage'); // or wherever
    } else {
      showToast("Failed saving fragmentation", "error")
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={{uri: imageUri}}
          style={{
            width: screenWidth - 32,
            height: (screenWidth - 32) * 0.6,
            borderRadius: 8,
          }}
          resizeMode="contain"
        />

        <View style={styles.header}>
          <Text style={styles.headerText}>Ringkasan</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.rowHeader]}>
            <Text style={[styles.cell, styles.cellHeader]}>Size (mm)</Text>
            <Text style={[styles.cell, styles.cellHeader]}>%</Text>
          </View>
          {summaryArray.map((row, idx) => (
            <View
              key={row.size}
              style={[
                styles.row,
                idx % 2 === 0 ? styles.rowEven : styles.rowOdd,
              ]}>
              <Text style={styles.cell}>{row.size.toFixed(3)}</Text>
              <Text style={styles.cell}>{row.pct.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom center: Tambah Digging Time */}
      <View style={styles.bottomCenter}>
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => navigation.navigate('DiggingTimePage')}>
          <Text style={styles.centerText}>Tambah Digging Time</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom right: Simpan */}
      <View style={styles.bottomRight}>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveText}>Simpan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#f3f4f6'},
  container: {padding: 16, paddingBottom: 100},
  header: {
    backgroundColor: '#a4d4ae',
    padding: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  headerText: {fontSize: 18, fontWeight: 'bold', color: '#fff'},
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {flexDirection: 'row', paddingVertical: 6},
  rowHeader: {backgroundColor: '#eaeaea'},
  rowEven: {backgroundColor: '#fff'},
  rowOdd: {backgroundColor: '#f9f9f9'},
  cell: {flex: 1, textAlign: 'center', fontSize: 14, color: '#333'},
  cellHeader: {fontWeight: '600'},

  bottomCenter: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  centerButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  centerText: {color: '#fff', fontWeight: 'bold'},

  bottomRight: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  saveButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: {color: '#fff', fontWeight: 'bold'},
});
