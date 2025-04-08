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
  const images = formData.imageUris;

  // Local state for which image is being edited.
  const [editingIndex, setEditingIndex] = useState<number>(-1);

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
        updateForm({imageUris: [...images, uri]});
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
    updateForm({imageUris: newImages});
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
  const handleNext = () => {
    if (images.length === 0) {
      return; // No images? Don't navigate.
    }
    navigation.navigate('FragmentationForm5');
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
            disabled={images.length === 0}
            style={[
              styles.nextButton,
              images.length === 0 && {backgroundColor: 'gray', opacity: 0.6},
            ]}>
            <Text style={styles.nextButtonText}>Next</Text>
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
});
