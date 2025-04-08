import React, {useContext, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import { FormContext } from '../../context/FragmentationContext';

// Our advanced editing UI
import EditingApp from './EditingApp.tsx';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';

type FragmentationForm5RouteProp = RouteProp<
  RootStackParamList,
  'FragmentationForm5'
>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationForm5'
>;

export default function FragmentationForm5() {
  const route = useRoute<FragmentationForm5RouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { formData, updateForm } = useContext(FormContext);
    // Gambar disimpan di formData.imageUris (tipe: string[])
  const images = formData.imageUris;
//   const {images: initialImages} = route.params;
//   // We'll store multiple image URIs in an array:
//   const [images, setImages] = useState<string[]>(initialImages ?? []);

  // The index of the image currently being edited (or -1 if none)
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Called when user taps "Edit" on an image
  const handleEditImage = (index: number) => {
    setEditingIndex(index);
  };

  // The user closed the editing app with a new "resultUri"
  // so we replace the old image at "editingIndex" with the new one
  const handleSaveEdited = (resultUri: string) => {
     if (editingIndex < 0) return;
        const newImages = images.map((imgUri, idx) =>
          idx === editingIndex ? resultUri : imgUri
        );
        updateForm({ imageUris: newImages });
        setEditingIndex(-1);
  };

  // If editingIndex >=0, we show the EditingApp in a modal or separate screen
  const isEditing = editingIndex >= 0;
  const isFormValid = images.length > 0;
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Render images in a list */}
        {images.map((uri, idx) => (
          <View key={idx} style={styles.imageWrapper}>
            <Image source={{uri}} style={styles.image} resizeMode="contain" />
            {/* Edit button in top-left */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditImage(idx)}>
              <Text style={{color: '#fff'}}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          disabled={!isFormValid}
          onPress={() => {
            if (isFormValid) {
              navigation.navigate('FragmentationForm6');
            }
          }}
          style={[
            styles.nextButton,
            !isFormValid && {backgroundColor: 'gray', opacity: 0.6},
          ]}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* If editingIndex >=0, show the EditingApp in a modal */}
      <Modal visible={isEditing} animationType="slide">
        {/* We pass images[editingIndex] to the editor, plus an onClose that returns the final URI */}
        {isEditing && (
          <EditingApp
            initialImage={images[editingIndex]}
            onClose={(resultUri: string | null) => {
              // If user canceled or didn't produce a new image, resultUri might be null
              // If they produced a new image, we get that
              if (resultUri) {
                handleSaveEdited(resultUri);
              } else {
                // user canceled => no changes
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
