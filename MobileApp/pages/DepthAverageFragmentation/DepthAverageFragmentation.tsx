import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {API_BASE_URL} from '@env';
import {useToast} from '../../context/ToastContext';
import Video from 'react-native-video';
import {FormContext} from '../../context/FragmentationContext';

export interface FragmentationResponse {
  id: number;
  skala: string;
  pilihan: string;
  ukuran: string;
  prioritas: number;
  lokasi: string;
  tanggal: string;
  litologi: string;
  ammoniumNitrate: string;
  volumeBlasting: string;
  powderFactor: string;
  synced: number;
  diggingTime: string | null;
  videoUri: string | null;
  fragmentationImages: FragmentationImage[];
}

export interface FragmentationImage {
  id: number;
  imageUri: string;
  synced: number;
  fragmentationImageResults: FragmentationImageResult[];
}

export interface FragmentationImageResult {
  id: number;
  result1: string;
  result2: AnalysisJson | string;
  measurement: string;
  synced: number;
}

export interface AnalysisJson {
  plot_image_base64: string;
  kuzram: Kuzram;
  threshold_percentages: Record<string, number>;
}

export interface Kuzram {
  P10: number;
  P20: number;
  P80: number;
  P90: number;
  X50: number;
  distribution: number[];
  sizes: number[];
  percentage_above_60: number;
  percentage_below_60: number;
}

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DepthAverageFragmention1'
>;

type NavigationProps = RouteProp<
  RootStackParamList,
  'DepthAverageFragmention1'
>;

const {width, height} = Dimensions.get('window');

const DepthAverageFragmentation = () => {
  const route = useRoute<NavigationProps>();
  const {priority, tanggal} = route.params;
  const {updateForm} = useContext(FormContext);
  const navigation = useNavigation<NavigationProp>();
  const [data, setData] = useState<FragmentationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const {showToast} = useToast();
  const [selectedItem, setSelectedItem] =
    useState<FragmentationResponse | null>(null);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUri, setCurrentVideoUri] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalUri, setImageModalUri] = useState<string | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  useEffect(() => {
    const formattedTanggalValue = formatDateP(tanggal);

    fetch(
      `${API_BASE_URL}/api/Fragmentation/today?priority=${priority}&tanggal=${formattedTanggalValue}`,
    )
      .then(res => {
        console.log('Raw response:', res);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(json => {
        console.log('Parsed JSON:', json);
        setData([json]);
      })
      .catch(err => {
        showToast('Failed to fetch Depth Average data', 'error');
        console.error('Fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, []);
  const handleShowSummary = (item: FragmentationResponse) => {
    setSelectedItem(item);
    setShowSummary(true);
  };

  const formatDateP = (tanggal: string) => {
    if (!tanggal) return '';

    // Parse the date and set the time to 00:00:00 (avoid time zone conversion)
    const date = new Date(tanggal);
    date.setHours(0, 0, 0, 0); // Set time to 00:00:00

    // Get the formatted date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleAddPhoto = (item: FragmentationResponse) => {
    updateForm({
      id: item.id,
      isEdit: true,
      origin: 'DepthAverageFragmention1',
      skala: item.skala,
      pilihan: item.pilihan,
      ukuran: item.ukuran,
      prioritas: item.prioritas,
      lokasi: item.lokasi,
      tanggal: item.tanggal,
      litologi: item.litologi,
      ammoniumNitrate: item.ammoniumNitrate,
      volumeBlasting: item.volumeBlasting,
      powderFactor: item.powderFactor,
      diggingTime: item.diggingTime || undefined,
      videoUri: item.videoUri || undefined,
      rawImageUris: item.fragmentationImages.map(fi => fi.imageUri),
    });

    navigation.navigate('FragmentationForm4');
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleViewVideo = (uri: string | null) => {
    if (!uri) {
      showToast('No video available');
      return;
    }
    setCurrentVideoUri(
      uri.startsWith('http://localhost')
        ? uri.replace('http://localhost:5180', API_BASE_URL)
        : uri,
    );
    setShowVideoModal(true);
  };

  const handleImagePress = (uri: string | undefined) => {
    if (!uri) return;
    setImageModalUri(
      uri.startsWith('http://localhost')
        ? uri.replace('http://localhost:5180', API_BASE_URL)
        : uri,
    );
    setShowImageModal(true);
  };

  const handleGalleryPress = (uris: string[]) => {
    if (!uris.length) return;
    setGalleryImages(
      uris.map(u =>
        u.startsWith('http://localhost')
          ? u.replace('http://localhost:5180', API_BASE_URL)
          : u,
      ),
    );
    setShowGalleryModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#00613B"
          style={{marginTop: 100}}
        />
      </SafeAreaView>
    );
  }

  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No fragmentation data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {data.map(item => {
          const firstImage = item.fragmentationImages[0];
          const firstResult = firstImage?.fragmentationImageResults[0];
          let analysisData: AnalysisJson | null = null;

          if (firstResult && typeof firstResult.result2 === 'string') {
            try {
              analysisData = JSON.parse(firstResult.result2) as AnalysisJson;
            } catch (e) {
              console.warn('Parsing result2 failed', e);
            }
          } else if (firstResult) {
            analysisData = firstResult.result2 as AnalysisJson;
          }

          const graphUri = analysisData?.plot_image_base64.startsWith(
            'http://localhost',
          )
            ? analysisData.plot_image_base64.replace(
                'http://localhost:5180',
                `${API_BASE_URL}`,
              )
            : analysisData?.plot_image_base64;

          return (
            <View key={item.id} style={styles.contentCard}>
              {/* Title with ID and Date */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Fragmentasi Batuan #{item.id}</Text>
                <Text style={styles.dateText}>{formatDate(item.tanggal)}</Text>
              </View>

              {/* Priority Display */}
              <View style={styles.priorityContainer}>
                <Text style={styles.priorityText}>
                  Prioritas: {item.prioritas}
                </Text>
              </View>

              {/* Image and Info Side by Side */}
              <View style={styles.imageAndInfoContainer}>
                {/* Left side - Image */}
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={() =>
                    handleGalleryPress(
                      item.fragmentationImages.map(img => img.imageUri),
                    )
                  }>
                  {firstImage && (
                    <Image
                      source={{uri: firstImage.imageUri}}
                      style={styles.fragmentationImage}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>

                {/* Right side - Digging Time and Buttons */}
                <View style={styles.infoContainer}>
                  <View style={styles.diggingTimeContainerNew}>
                    <Text style={styles.diggingTimeLabel}>Digging Time</Text>
                    <Text style={styles.diggingTimeValue}>
                      {item.diggingTime || '00:00'}
                    </Text>
                  </View>

                  <View style={styles.actionButtonsContainerNew}>
                    <TouchableOpacity
                      style={styles.addPhotoButton}
                      onPress={() => handleAddPhoto(item)}>
                      <Text style={styles.addPhotoButtonText}>
                        + Tambah Foto
                      </Text>
                    </TouchableOpacity>
                    {item.videoUri ? (
                      <TouchableOpacity
                        style={styles.viewVideoButton}
                        onPress={() => handleViewVideo(item.videoUri)}>
                        <Text style={styles.viewVideoButtonText}>
                          View Video
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Grafik</Text>

              {/* Graph Image and Summary Button Side by Side */}
              <View style={styles.graphAndSummaryContainer}>
                {/* Left side - Graph Image */}
                <TouchableOpacity
                  style={styles.graphContainer}
                  onPress={() => handleImagePress(graphUri)}>
                  {analysisData && (
                    <Image
                      source={{
                        uri: analysisData.plot_image_base64.startsWith(
                          'http://localhost',
                        )
                          ? analysisData.plot_image_base64.replace(
                              'http://localhost:5180',
                              `${API_BASE_URL}`,
                            )
                          : analysisData.plot_image_base64,
                      }}
                      style={styles.graphImage}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>

                {/* Right side - Summary Button */}
                <View style={styles.summaryContainer}>
                  <TouchableOpacity
                    style={styles.summaryButtonNew}
                    onPress={() => handleShowSummary(item)}>
                    <Text style={styles.summaryButtonText}>
                      Lihat Ringkasan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Summary Modal */}
      <Modal
        visible={showSummary}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSummary(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ringkasan Statistik</Text>

              {selectedItem && (
                <View style={styles.statsContainer}>
                  {selectedItem.fragmentationImages[0]
                    ?.fragmentationImageResults[0] &&
                    (() => {
                      const firstResult =
                        selectedItem.fragmentationImages[0]
                          .fragmentationImageResults[0];
                      let analysisData: AnalysisJson | null = null;

                      if (typeof firstResult.result2 === 'string') {
                        try {
                          analysisData = JSON.parse(
                            firstResult.result2,
                          ) as AnalysisJson;
                        } catch (e) {
                          console.warn('Parsing result2 failed', e);
                          return <Text>Error parsing data</Text>;
                        }
                      } else {
                        analysisData = firstResult.result2 as AnalysisJson;
                      }

                      if (!analysisData)
                        return <Text>No analysis data available</Text>;

                      return (
                        <>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>P10:</Text>
                            <Text style={styles.statValue}>
                              {analysisData.kuzram.P10.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>P20:</Text>
                            <Text style={styles.statValue}>
                              {analysisData.kuzram.P20.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>P80:</Text>
                            <Text style={styles.statValue}>
                              {analysisData.kuzram.P80.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>P90:</Text>
                            <Text style={styles.statValue}>
                              {analysisData.kuzram.P90.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>X50:</Text>
                            <Text style={styles.statValue}>
                              {analysisData.kuzram.X50.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>% Above 60:</Text>
                            <Text style={styles.statValue}>
                              {analysisData.kuzram.percentage_above_60.toFixed(
                                2,
                              )}
                              %
                            </Text>
                          </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>% Below 60:</Text>
                            <Text style={styles.statValue}>
                              {analysisData.kuzram.percentage_below_60.toFixed(
                                2,
                              )}
                              %
                            </Text>
                          </View>

                          {/* Added Threshold Percentages Section */}
                          <Text style={styles.thresholdTitle}>
                            Threshold Percentages
                          </Text>
                          {analysisData.threshold_percentages &&
                            Object.entries(
                              analysisData.threshold_percentages,
                            ).map(([key, value]) => (
                              <View style={styles.statRow} key={key}>
                                <Text style={styles.statLabel}>{key}:</Text>
                                <Text style={styles.statValue}>
                                  {value.toFixed(2)}%
                                </Text>
                              </View>
                            ))}
                        </>
                      );
                    })()}
                </View>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSummary(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Video Modal */}
      <Modal
        visible={showVideoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVideoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.videoModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Video Preview</Text>
            </View>
            {currentVideoUri && (
              <Video
                source={{uri: currentVideoUri}}
                style={styles.videoPlayer}
                controls
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVideoModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Single Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.imageModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Image Preview</Text>
            </View>
            {imageModalUri && (
              <Image
                source={{uri: imageModalUri}}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowImageModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gallery Modal */}
      <Modal
        visible={showGalleryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGalleryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.galleryModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Image Gallery</Text>
            </View>
            <FlatList
              data={galleryImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(uri, idx) => uri + idx}
              renderItem={({item, index}) => (
                <View style={styles.galleryImageContainer}>
                  <Image
                    source={{uri: item}}
                    style={styles.galleryImage}
                    resizeMode="contain"
                  />
                  <View style={styles.galleryPagination}>
                    <Text style={styles.galleryPaginationText}>
                      {index + 1}/{galleryImages.length}
                    </Text>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowGalleryModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
  },
  header: {
    height: 56,
    backgroundColor: '#00613B', // Exact dark green color from image
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 70,
    height: 40,
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoContainer: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 16,
    elevation: 3,
  },
  logo: {
    width: 80,
    height: 30,
    resizeMode: 'contain',
  },
  scrollView: {
    flex: 1,
    marginTop: 10,
  },
  contentCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFF5F5', // Light pink background exactly as in the image
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Title container with date
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  // Container for side-by-side layout of image and info
  imageAndInfoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  // Left side container for image
  imageContainer: {
    flex: 1,
    marginRight: 10,
  },
  // Right side container for info and buttons
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  fragmentationImage: {
    width: '100%',
    height: 120, // Max height
    aspectRatio: 1, // Will maintain aspect ratio
    borderRadius: 4,
    backgroundColor: '#f0f0f0', // Placeholder color
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  // Container for side-by-side layout of graph and summary button
  graphAndSummaryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  // Left side container for graph
  graphContainer: {
    flex: 1,
    marginRight: 10,
  },
  // Right side container for summary button
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphImage: {
    width: '100%',
    height: 100, // Max height
    aspectRatio: 1.5, // Will maintain aspect ratio (adjust as needed)
    borderRadius: 4,
    backgroundColor: '#f0f0f0', // Placeholder color
  },
  // Button style for Lihat Ringkasan
  summaryButtonNew: {
    backgroundColor: 'white',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    width: '100%',
  },
  summaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  // Left-aligned digging time
  diggingTimeContainerNew: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  diggingTimeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  diggingTimeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  // Right-aligned action buttons
  actionButtonsContainerNew: {
    flexDirection: 'column',
    gap: 8,
  },
  addPhotoButton: {
    backgroundColor: '#8CD4BC', // Light green color exactly as in the image
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  addPhotoButtonText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
  depthAverageButton: {
    backgroundColor: '#8CD4BC', // Light green color exactly as in the image
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  depthAverageButtonText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: height * 0.8,
    width: width * 0.8,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#00613B',
  },
  statsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  thresholdTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#00613B',
  },
  closeButton: {
    backgroundColor: '#8CD4BC',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignSelf: 'center',
    marginVertical: 15,
    marginBottom: 20, // Add more bottom margin
    width: 'auto', // Don't take full width
    minWidth: 120, // Set a minimum width
    alignItems: 'center', // Center text
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  priorityContainer: {
    marginVertical: 8,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  viewVideoButton: {
    backgroundColor: '#8CD4BC',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,

    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    marginTop: 8,
  },
  viewVideoButtonText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
  modalHeader: {
    backgroundColor: '#8CD4BC',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
  },
  videoPlayer: {
    width: width * 0.85,
    height: width * 0.85 * 0.6,
    backgroundColor: '#000',
  },
  modalImage: {
    width: width * 0.85,
    height: width * 0.85,
    backgroundColor: '#f8f8f8',
  },
  galleryImageContainer: {
    width: width * 0.9,
    height: height * 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  galleryImage: {
    width: width * 0.85,
    height: height * 0.5,
    backgroundColor: '#f8f8f8',
  },
  galleryPagination: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(140, 212, 188, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  galleryPaginationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  videoModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width * 0.85,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  imageModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width * 0.85,
    maxHeight: height * 0.8,
    overflow: 'hidden',
    shadowColor: '#000',
    paddingBottom: 20,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  galleryModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width * 0.9,
    height: height * 0.7,
    overflow: 'hidden',
    shadowColor: '#000',

    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default DepthAverageFragmentation;
