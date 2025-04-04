import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { ChevronDown, Edit, ArrowRight } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { launchImageLibrary } from 'react-native-image-picker';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationForm1'
>;

export default function FragmentationForm1() {
  const navigation = useNavigation<NavigationProp>();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [skala, setSkala] = useState('');
  const [pilihan, setPilihan] = useState('');
  const [ukuran, setUkuran] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [tanggal, setTanggal] = useState('');

  const handleImagePicker = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });

    if (result.didCancel) {
      console.log('User cancelled image picker');
    } else if (result.errorCode) {
      console.error('ImagePicker Error: ', result.errorMessage);
      Alert.alert('Error', 'An error occurred while picking the image.');
    } else if (result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      setImageUri(selectedImage.uri || null);
    }
  };

  const isFormValid =
    imageUri &&
    skala.trim() !== '' &&
    pilihan.trim() !== '' &&
    ukuran.trim() !== '' &&
    lokasi.trim() !== '' &&
    tanggal.trim() !== '';

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center items-center px-6">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="w-full my-8"
        >
          {/* Image Upload */}
          <TouchableOpacity
            className="w-full aspect-[16/9] bg-white rounded-lg items-center justify-center border border-gray-300"
            onPress={handleImagePicker}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full rounded-lg"
                resizeMode="contain"
              />
            ) : (
              <View className="items-center">
                <Text className="text-4xl text-gray-300 mb-2">+</Text>
                <Text className="text-gray-400">Masukkan gambar...</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View className="flex-1 mt-4 gap-4">
            {/* Skala */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Skala</Text>
              <TextInput
                placeholder="Masukkan skala..."
                value={skala}
                onChangeText={setSkala}
                placeholderTextColor="#9CA3AF"
                className="w-full bg-rose-50 rounded-lg px-4 py-3 text-black"
              />
            </View>

            {/* Pilihan */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Pilihan</Text>
              <TextInput
                placeholder="Masukkan pilihan..."
                value={pilihan}
                onChangeText={setPilihan}
                placeholderTextColor="#9CA3AF"
                className="w-full bg-rose-50 rounded-lg px-4 py-3 text-black"
              />
            </View>

            {/* Ukuran */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Ukuran</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan ukuran..."
                  value={ukuran}
                  onChangeText={setUkuran}
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-black"
                  keyboardType="numeric"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>

            {/* Lokasi */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Lokasi</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan lokasi..."
                  value={lokasi}
                  onChangeText={setLokasi}
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-black"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>

            {/* Tanggal */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Tanggal</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan tanggal..."
                  value={tanggal}
                  onChangeText={setTanggal}
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-black"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            disabled={!isFormValid}
            onPress={() => navigation.navigate('FragmentationForm2')}
            className={`w-full rounded-lg px-4 py-3 items-center mt-6 mb-4 ${
              isFormValid ? 'bg-green-700' : 'bg-gray-400 opacity-60'
            }`}
          >
            <Text className="text-white font-medium">Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
