import React, {useContext, useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {FormContext} from '../../context/FragmentationContext';
import {launchImageLibrary} from 'react-native-image-picker';

// Our advanced editing UI
import EditingApp from './EditingApp';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';

// Import your SQLite service singleton (adjust the path as needed)
import {dbService} from '../../database/services/dbService';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationForm4'
>;

export default function FragmentationForm4() {
  const navigation = useNavigation<NavigationProp>();
  const {formData, updateForm} = useContext(FormContext);
  const images = formData.rawImageUris;

  // Local state for which image is being edited.
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Animation values
  const spinValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(1);

  // Start spinning animation
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 700,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      spinValue.setValue(0);
      scaleValue.setValue(1);
    }
  }, [isLoading, spinValue, scaleValue]);

  // Create the spin interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Connectivity state: isOnline is true if connected to the Internet.
  const [isOnline, setIsOnline] = useState<boolean>(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // The user might pick from local gallery – optional.
  const handleAddImage = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (uri) {
        const newUris = [...images, uri];
        updateForm({rawImageUris: newUris});
      }
    }
  };

  // Called when user taps "Edit" on an image.
  const handleEditImage = (index: number) => {
    setEditingIndex(index);
  };

  // When the user finishes editing an image, update the corresponding URI.
  const handleSaveEdited = (resultUri: string) => {
    if (editingIndex < 0) return;
    const newImages = images.map((imgUri, idx) =>
      idx === editingIndex ? resultUri : imgUri,
    );
    updateForm({rawImageUris: newImages});
    setEditingIndex(-1);
  };

  // Offline "Save Local" button action.
  // This calls the SQLite service to save the fragmentation data locally.
  // After saving, navigates to the FragmentationHistory screen.
  const handleSaveLocal = async () => {
    try {
      // Save the current form data to the local SQLite database.
      // It is assumed that dbService.saveFragmentationData accepts a data object
      // matching your FragmentationData structure.
      await dbService.init();
      await dbService.saveOrUpdateFragmentationData(formData);
      Alert.alert('Success', 'Data saved locally.');
      navigation.navigate('FragmentationHistory');
    } catch (error) {
      console.error('Error saving data locally:', error);
      Alert.alert('Error', 'Failed to save data locally.');
    }
  };

  // Online "Next" button action.
  // For example, if online, you might continue to the next form in the workflow.
  const handleNext = async () => {
    if (formData.rawImageUris.length === 0) return;

    // Set loading state to true to show animation
    setIsLoading(true);

    try {
      // 1. Upload each local URI
      const uploadUrls: string[] = [];
      for (let i = 0; i < formData.rawImageUris.length; i++) {
        const uri = formData.rawImageUris[i];
        const form = new FormData();
        form.append('file', {
          uri,
          type: 'image/jpeg',
          name: `upload${i}.jpg`,
        } as any);

        const resp = await fetch('http://10.0.2.2:5180/api/Upload/upload', {
          method: 'POST',
          body: form,
        });
        const body = await resp.json();
        uploadUrls.push(body.url);
      }
      updateForm({uploadedImageUrls: uploadUrls});

      // 2. Call multi‑fragment with those uploaded files
      const multiForm = new FormData();
      uploadUrls.forEach(u => {
        multiForm.append('files', {
          uri: u,
          type: 'image/jpeg',
          name: u.split('/').pop(),
        } as any);
      });
      const mfResp = await fetch(
        'http://10.0.2.2:5180/api/Fragmentation/multi-fragment',
        {method: 'POST', body: multiForm},
      );

      // 3. Build your fragment URLs from mfResults
      //    e.g. your API returns just filename, so prefix with your static folder
      const mfResults: Array<{
        filename: string;
        result: {
          marker_properties: {conversion_factor: number};
          output_image: string;
        };
      }> = await mfResp.json();
      const fragmentedResults = mfResults.map(r => ({
        imageData: `data:image/png;base64,${r.result.output_image}`, // or use r.result.output_image if you prefer inline base64
        conversionFactor: r.result.marker_properties.conversion_factor,
      }));
      updateForm({fragmentedResults});

      // Set loading state to false before navigation
      setIsLoading(false);
      navigation.navigate('FragmentationForm5');
    } catch (e) {
      console.error(e);
      // Set loading state to false on error
      setIsLoading(false);
      Alert.alert('Error', 'Failed to process images');
    }
  };

  const isEditing = editingIndex >= 0;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Render images in a list */}
        {images.map((uri, idx) => (
          <View key={idx} style={styles.imageWrapper}>
            <Image source={{uri}} style={styles.image} resizeMode="contain" />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditImage(idx)}>
              <Text style={{color: '#fff'}}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add image button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddImage}>
          <Text style={styles.addButtonText}>+ Add Image</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.bottomBar}>
        {isOnline ? (
          <TouchableOpacity
            onPress={handleNext}
            disabled={images.length === 0 || isLoading}
            style={[
              styles.nextButton,
              (images.length === 0 || isLoading) && {
                backgroundColor: 'gray',
                opacity: 0.6,
              },
            ]}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Animated.View
                  style={[
                    styles.loadingIconContainer,
                    {
                      transform: [{rotate: spin}, {scale: scaleValue}],
                    },
                  ]}>
                  <ActivityIndicator size="small" color="#fff" />
                </Animated.View>
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSaveLocal}
            style={[styles.nextButton, {backgroundColor: 'orange'}]}>
            <Text style={styles.nextButtonText}>Save Locally</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* If editingIndex >= 0, show the EditingApp modal */}
      <Modal visible={isEditing} animationType="slide">
        {isEditing && (
          <EditingApp
            initialImage={images[editingIndex]}
            onClose={(resultUri: string | null) => {
              if (resultUri) {
                handleSaveEdited(resultUri);
              } else {
                setEditingIndex(-1);
              }
            }}
          />
        )}
      </Modal>

      {/* Full screen loading overlay for better UX */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Animated.View
              style={{
                transform: [{rotate: spin}, {scale: scaleValue}],
              }}>
              <ActivityIndicator size="large" color="green" />
            </Animated.View>
            <Text style={styles.loadingCardTitle}>Processing Images</Text>
            <Text style={styles.loadingCardText}>
              Please wait while we process your images. This may take a
              moment...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#fff'},
  scrollContent: {
    padding: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1, // square
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  editButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  addButton: {
    backgroundColor: 'orange',
    padding: 14,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: 'green',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    marginRight: 8,
  },
  loadingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  loadingCardText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
