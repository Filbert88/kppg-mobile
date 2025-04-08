// FragmentationHistory.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Camera,
  Grid,
  Plus,
  Trash2,
  Edit,
  Clock,
  Flag,
} from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { dbService } from '../../database/services/dbService'; // Adjust the path as needed
import { FormContext } from '../../context/FragmentationContext';

// Define your FragmentationData type based on what is stored in your DB.
// For this example, we assume that your DB returns the following fields:
//   id, skala, pilihan, ukuran, prioritas, lokasi, tanggal, litologi, ammoniumNitrate,
//   volumeBlasting, powderFactor, synced, plus an attached "images" array.
// You can customize the type as needed.
export type FragmentationData = {
  id: number;
  skala: string;
  pilihan: string;
  ukuran: string;
  prioritas?: number;
  lokasi: string;
  tanggal: string;
  litologi: string;
  ammoniumNitrate: string;
  volumeBlasting: string;
  powderFactor: string;
  synced: number;
  // Additional computed fields
  title?: string; // We can compute or set a title based on other fields.
  status: 'done' | 'undone';
  images?: {
    id: number;
    imageUri: string;
    resultData: {
      id?: number;
      result1: string;
      result2: string;
      result3: string;
      measurement: string; // JSON string; you can parse it if needed.
      synced: number;
    } | null;
  }[];
  summaryData?: {size: string; percent: string}[];
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationHistory'
>;

// --------------------
// Done Fragmentation Card
// --------------------
const DoneFragmentationCard = ({ data }: { data: FragmentationData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // If no summaryData is provided, compute summary from the measurement field in the first image result.
  let summaryRows: {size: string; percent: string}[] = [];
  if (!data.summaryData && data.images && data.images.length > 0) {
    const firstImageResult = data.images[0].resultData;
    if (firstImageResult && firstImageResult.measurement) {
      try {
        // Parse measurement JSON and convert to array of rows.
        const measurementObj = JSON.parse(firstImageResult.measurement);
        // Here each key-value becomes a row.
        summaryRows = Object.entries(measurementObj).map(([key, value]) => ({
          size: key, // You could rename this if needed.
          percent: value.toString(),
        }));
      } catch (error) {
        console.error('Error parsing measurement JSON:', error);
      }
    }
  } else if (data.summaryData) {
    summaryRows = data.summaryData;
  }
  return (
    <View style={styles.doneCard}>
      <Text style={styles.cardTitle}>
        {data.title || `Fragmentation Record #${data.id}`}
      </Text>

      <View style={styles.cardContent}>
        {/* Left Column - Image and Graph */}
        <View style={styles.cardLeftColumn}>
          {/* Rock Image */}
          <View style={styles.imageContainer}>
            {data.images && data.images.length > 0 ? (
              <Image
                source={{uri: data.images[0].imageUri}}
                style={styles.rockImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Camera width={24} height={24} color="#9ca3af" />
                <Text style={styles.noImageText}>No image</Text>
              </View>
            )}
          </View>

          {/* Graph Image */}
          <View style={styles.graphContainer}>
            {/* For this example, we'll display the rock image as a placeholder.
                Replace with your actual graph image URI if available. */}
            {data.images && data.images.length > 0 ? (
              <Image
                source={{uri: data.images[0].imageUri}}
                style={styles.graphImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noGraphContainer}>
                <Text style={styles.noGraphText}>No graph data</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Column - Details */}
        <View style={styles.cardRightColumn}>
          <View style={styles.detailGroup}>
            <View style={styles.detailRow}>
              <MapPin
                width={16}
                height={16}
                color="#6b7280"
                style={styles.icon}
              />
              <Text style={styles.detailText}>
                Lokasi: <Text style={styles.detailValue}>{data.lokasi}</Text>
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Calendar
                width={16}
                height={16}
                color="#6b7280"
                style={styles.icon}
              />
              <Text style={styles.detailText}>
                Tanggal: <Text style={styles.detailValue}>{data.tanggal}</Text>
              </Text>
            </View>
            {data.prioritas !== undefined && (
              <View style={styles.detailRow}>
                <Flag
                  width={16}
                  height={16}
                  color="#6b7280"
                  style={styles.icon}
                />
                <Text style={styles.detailText}>
                  Prioritas:{' '}
                  <Text style={styles.detailValue}>{data.prioritas}</Text>
                </Text>
              </View>
            )}
            {data.skala && (
              <View style={styles.detailRow}>
                <Grid
                  width={16}
                  height={16}
                  color="#6b7280"
                  style={styles.icon}
                />
                <Text style={styles.detailText}>
                  Skala: <Text style={styles.detailValue}>{data.skala}</Text>
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.summaryToggleButton}
            onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.summaryToggleText}>Lihat Ringkasan</Text>
            {isExpanded ? (
              <ChevronUp width={20} height={20} color="#4b5563" />
            ) : (
              <ChevronDown width={20} height={20} color="#4b5563" />
            )}
          </TouchableOpacity>

          {isExpanded && data.summaryData && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Ringkasan</Text>
              {data.summaryData.map((item, index) => (
                <View key={index} style={styles.summaryRow}>
                  <Text style={styles.summarySize}>{item.size} μm</Text>
                  <Text style={styles.summaryPercent}>{item.percent}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// --------------------
// Undone Fragmentation Card
// --------------------
const UndoneFragmentationCard = ({
  data,
  onDelete,
  onContinue,
}: {
  data: FragmentationData;
  onDelete: (id: number) => void;
  onContinue: (data: FragmentationData) => void;
}) => {
  return (
    <View style={styles.undoneCard}>
      <Text style={styles.cardTitle}>
        {data.title || `Fragmentation Record #${data.id}`}
      </Text>
      <View style={styles.cardContent}>
        {/* Left Column - Image */}
        <View style={styles.cardLeftColumn}>
          <View style={styles.imageContainer}>
            {data.images && data.images.length > 0 ? (
              <Image
                source={{ uri: data.images[0].imageUri }}
                style={styles.rockImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Camera width={24} height={24} color="#9ca3af" />
                <Text style={styles.noImageText}>No image</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Column - Details */}
        <View style={styles.cardRightColumn}>
          <View style={styles.detailGroup}>
            <View style={styles.detailRow}>
              <MapPin width={16} height={16} color="#6b7280" style={styles.icon} />
              <Text style={styles.detailText}>
                Lokasi: <Text style={styles.detailValue}>{data.lokasi || 'Belum diisi'}</Text>
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Calendar width={16} height={16} color="#6b7280" style={styles.icon} />
              <Text style={styles.detailText}>
                Tanggal: <Text style={styles.detailValue}>{data.tanggal || 'Belum diisi'}</Text>
              </Text>
            </View>
            {data.prioritas && (
              <View style={styles.detailRow}>
                <Flag width={16} height={16} color="#6b7280" style={styles.icon} />
                <Text style={styles.detailText}>
                  Prioritas: <Text style={styles.detailValue}>{data.prioritas}</Text>
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Clock width={16} height={16} color="#f59e0b" style={styles.icon} />
              <Text style={[styles.detailText, { color: '#f59e0b' }]}>Belum selesai</Text>
            </View>
          </View>
          <View style={styles.undoneActionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(data.id)}>
              <Trash2 width={16} height={16} color="#be123c" />
              <Text style={styles.actionButtonText}>Hapus</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.continueButton]}
              onPress={() => onContinue(data)}>
              <Edit width={16} height={16} color="#1d4ed8" />
              <Text style={styles.actionButtonText}>Lanj..</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// --------------------
// Main FragmentationHistory Component
// --------------------
const FragmentationHistory = () => {
  const navigation = useNavigation<NavigationProp>();
  // State to hold fragmentation records fetched from SQLite.
  const [fragmentationData, setFragmentationData] = useState<FragmentationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'done' | 'undone'>('all');

  // Fetch fragmentation data from SQLite on mount.
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ensure the database is initialized.
        await dbService.init();
        const records = await dbService.getFragmentationData();
        // Compute done/undone status:
        // Record is "done" if each image has non-null resultData.
        const updatedRecords = records.map((record: any) => {
          const done =
            record.images &&
            record.images.length > 0 &&
            record.images.every((img: any) => img.resultData !== null);
          return { ...record, status: done ? 'done' : 'undone', title: `Record #${record.id}` };
        });
        setFragmentationData(updatedRecords);
      } catch (error) {
        console.error('Error fetching fragmentation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter records by status
  const filteredData = fragmentationData.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  // Handle record deletion: remove from SQLite and update state.
  const handleDelete = async (id: number) => {
    try {
      // Call SQLite service delete function (adjust as needed).
      await dbService.deleteData(id);
      setFragmentationData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

    const { updateForm } = useContext(FormContext);

    const handleContinue = (record: FragmentationData) => {
      // Update the FormContext with existing record data.
      updateForm({
        // Include the record id (for update later) if you add an id field in your context.
        // You may add an "id" property to your FragmentationData type in the FormContext.
        // For now, we spread all fields from the record.
        // Note: Adjust fields if necessary.
        imageUris: record.images ? record.images.map(img => img.imageUri) : [],
        skala: record.skala,
        pilihan: record.pilihan,
        ukuran: record.ukuran,
        lokasi: record.lokasi,
        tanggal: record.tanggal,
        litologi: record.litologi,
        ammoniumNitrate: record.ammoniumNitrate,
        volumeBlasting: record.volumeBlasting,
        powderFactor: record.powderFactor,
        // Optionally store the record id if updating later:
        id: record.id,
      });
      // Navigate to FragmentationForm4 (or whichever form screen is appropriate for editing)
      navigation.navigate('FragmentationForm4');
    };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#48bb78" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f3f4f6' }]}>
      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <View style={styles.filterInner}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' ? styles.filterActive : null]}
            onPress={() => setFilter('all')}>
            <Text style={filter === 'all' ? styles.filterActiveText : styles.filterText}>Semua</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'done' ? styles.filterActive : null]}
            onPress={() => setFilter('done')}>
            <Text style={filter === 'done' ? styles.filterActiveText : styles.filterText}>Selesai</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'undone' ? styles.filterActive : null]}
            onPress={() => setFilter('undone')}>
            <Text style={filter === 'undone' ? styles.filterActiveText : styles.filterText}>
              Belum Selesai
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada data</Text>
          </View>
        ) : (
          filteredData.map(data =>
            data.status === 'done' ? (
              <DoneFragmentationCard key={data.id} data={data} />
            ) : (
              <UndoneFragmentationCard
                key={data.id}
                data={data}
                onDelete={handleDelete}
                onContinue={handleContinue}
              />
            )
          )
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FragmentationHistory;

// --------------------
// Styles
// --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
  },
  filterInner: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  filterActive: {
    backgroundColor: '#f3f4f6',
  },
  filterText: {
    color: '#6b7280',
    fontSize: 14,
  },
  filterActiveText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Card Styles
  doneCard: {
    backgroundColor: '#FAF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  undoneCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardLeftColumn: {
    flex: 1,
    marginRight: 8,
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rockImage: {
    width: '100%',
    height: 160,
  },
  noImageContainer: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
  },
  graphContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  graphImage: {
    width: '100%',
    height: 80,
  },
  noGraphContainer: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGraphText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardRightColumn: {
    flex: 1,
    paddingLeft: 8,
    justifyContent: 'space-between',
  },
  detailGroup: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  detailValue: {
    fontWeight: '500',
    color: '#111827',
  },
  summaryToggleButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryToggleText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  summarySection: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summarySize: {
    fontSize: 14,
    color: '#4B5563',
  },
  summaryPercent: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  undoneActionButtons: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  deleteButton: {
    backgroundColor: '#FECACA',
  },
  continueButton: {
    backgroundColor: '#DBEAFE',
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

