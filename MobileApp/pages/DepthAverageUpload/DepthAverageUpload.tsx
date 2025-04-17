import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { ArrowRight, Save } from 'react-native-feather';
import { requestPhotoPermission } from '../../components/requestPhotoPermission';
import { DepthAverageContext } from '../../context/DepthAverageContext';
import NetInfo from '@react-native-community/netinfo';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DepthAverageUpload'
>;

const DepthAverageUpload = () => {
  const navigation = useNavigation<NavigationProp>();
  const { formData, setFormData, saveToDatabase, resetForm } = useContext(DepthAverageContext);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });

    if (formData.imageUri) {
      setImageUri(formData.imageUri);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unblock = navigation.addListener('beforeRemove', e => {
      if (formData.isEdit) {
        e.preventDefault();
      }
    });
    return unblock;
  }, [navigation, formData.isEdit]);

  // 2️⃣ Swallow the Android hardware back button while editing
  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (formData.isEdit) {
            return true; // block
          }
          return false;  // allow
        }
      );
      return () => subscription.remove();
    }, [formData.isEdit])
  );


  const handleImagePicker = async () => {
    const hasPermission = await requestPhotoPermission();
    if (!hasPermission) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });

    if (result.didCancel) {
      console.log('User cancelled image picker');
    } else if (result.errorCode) {
      console.error('ImagePicker Error:', result.errorMessage);
      Alert.alert('Error', result.errorMessage || 'Failed to pick image');
    } else if (result.assets?.[0]?.uri) {
      const selectedUri = result.assets[0].uri;
      console.log('Selected image URI:', selectedUri);
      setImageUri(selectedUri);
    }
  };

  const handleNextOnline = async () => {
    if (!imageUri) return;

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      } as any);

      const uploadResponse = await fetch('http://10.0.2.2:5180/api/Upload/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.url;
      console.log("upload from dotnet: ",imageUrl)
      setFormData({ imageUri: imageUrl });

      const ocrResponse = await fetch('http://10.0.2.2:5180/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) throw new Error('OCR failed');
      const { ocr_result } = await ocrResponse.json();

      const kedalaman: Record<string, string> = {};
      const sorted = Object.entries(ocr_result)
        .map(([k, v]) => [parseInt(k), v] as [number, string])
        .sort(([a], [b]) => a - b);

      sorted.forEach(([_, val], i) => {
        const key = `kedalaman${i + 1}`;
        const cleanVal = parseFloat(String(val).replace(/[^0-9.]/g, ''));
        kedalaman[key] = isNaN(cleanVal) ? '' : cleanVal.toString();
      });

      setFormData({
        jumlahLubang: sorted.length.toString(),
        kedalaman,
      });

      navigation.navigate('FormDA1');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Gagal mengunggah atau memproses gambar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOffline = async () => {
    if (!imageUri) return;
  
    setFormData({ imageUri }); // still useful for consistency
  
    const success = await saveToDatabase({ imageUri }); // <== inject it here
  
    if (success) {
      Alert.alert('Berhasil', 'Data disimpan secara offline.');
      navigation.goBack();
    } else {
      Alert.alert('Gagal', 'Gagal menyimpan data secara offline.');
    }
  };  

  const handleCancelEdit = () => {
    resetForm();
    if (formData.origin === 'DAHistoryIncomplete') {
      navigation.navigate('DAHistoryIncomplete'); // Navigate back to DAHistoryIncomplete
    } else {
      navigation.navigate('DAHistory'); // Navigate back to DAHistory
    }
  };

  console.log(imageUri)
  const isFormValid = imageUri !== null;

  return (
    <View className="flex-1 justify-center items-center px-4">
      <TouchableOpacity
        className="w-full max-w-md h-[400px] border border-gray-400 bg-white rounded-lg flex justify-center items-center"
        onPress={handleImagePicker}
        style={{ width: '90%' }}
        disabled={isLoading}
      >
        {imageUri ? (
          <View className="w-full h-full">
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View className="flex-row items-center">
            <Image
              source={require('../../public/assets/Image.png')}
              className="w-20 h-20"
              resizeMode="contain"
            />
            <Image
              source={require('../../public/assets/Plus.png')}
              className="w-12 h-12 ml-4"
              resizeMode="contain"
            />
          </View>
        )}

        {!imageUri && (
          <Text className="text-gray-500 text-base mt-4">
            Masukkan gambar...
          </Text>
        )}
      </TouchableOpacity>

      {/* Fixed: Button container with proper layout */}
      <View className="w-full flex-row justify-between p-6 mb-4">
        {/* Cancel Edit (only when editing) - Now positioned to the left */}
        {formData.isEdit && (
          <TouchableOpacity
            className="px-4 py-3 bg-red-200 rounded-lg"
            onPress={handleCancelEdit}
          >
            <Text className="text-red-800 font-medium">Cancel Edit</Text>
          </TouchableOpacity>
        )}
        
        {/* Next/Save button */}
        <TouchableOpacity
          disabled={!isFormValid || isLoading}
          onPress={isConnected ? handleNextOnline : handleSaveOffline}
          className={`px-6 py-3 rounded-lg shadow-md flex-row items-center ${
            isFormValid && !isLoading ? 'bg-green-700' : 'bg-gray-400 opacity-60'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text className="text-white font-semibold mr-2">
                {isConnected ? 'Next' : 'Save Locally'}
              </Text>
              {isConnected ? (
                <ArrowRight width={18} height={18} color="white" />
              ) : (
                <Save width={18} height={18} color="white" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View className="absolute inset-0 bg-black/50 flex justify-center items-center z-50">
          <View className="bg-white p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="mt-4 text-gray-700 font-medium text-base">
              Memproses gambar...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default DepthAverageUpload;
