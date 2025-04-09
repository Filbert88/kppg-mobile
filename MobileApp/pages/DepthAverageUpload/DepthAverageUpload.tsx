import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { ArrowRight } from 'react-native-feather';
import { requestPhotoPermission } from '../../components/requestPhotoPermission';
import { DepthAverageContext } from '../../context/DepthAverageContext';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DepthAverageUpload'
>;

const DepthAverageUpload = () => {
  const navigation = useNavigation<NavigationProp>();
  const { setFormData } = useContext(DepthAverageContext);
  const [imageUri, setImageUri] = useState<string | null>(null);

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

  const handleNext = async () => {
    if (!imageUri) return;

    try {
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
    }
  };

  const isFormValid = imageUri !== null;

  return (
    <View className="flex-1 justify-center items-center px-4">
      <TouchableOpacity
        className="w-full max-w-md h-[400px] border border-gray-400 bg-white rounded-lg flex justify-center items-center"
        onPress={handleImagePicker}
        style={{ width: '90%' }}
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

      <View className="absolute bottom-5 right-5 mb-4">
        <TouchableOpacity
          disabled={!isFormValid}
          className={`px-6 py-3 rounded-lg shadow-md flex-row items-center ${
            isFormValid ? 'bg-green-700' : 'bg-gray-400 opacity-60'
          }`}
          onPress={handleNext}
        >
          <Text className="text-white font-semibold mr-2">Next</Text>
          <ArrowRight width={18} height={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DepthAverageUpload;
