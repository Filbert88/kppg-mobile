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
import { ChevronDown, Edit } from 'react-native-feather';
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

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center items-center px-6">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="w-full my-8"
        >
          {/* Image Upload Area */}
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

          {/* Form Fields with Larger Gaps */}
          <View className="flex-1 mt-4 gap-4">
            {/* Skala Dropdown */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Skala</Text>
              <TouchableOpacity className="w-full bg-rose-50 rounded-lg px-4 py-3 flex-row justify-between items-center">
                <Text className="text-gray-400">Masukkan skala...</Text>
                <ChevronDown stroke="#666" width={24} height={24} />
              </TouchableOpacity>
            </View>

            {/* Pilihan Dropdown */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Pilihan</Text>
              <TouchableOpacity className="w-full bg-rose-50 rounded-lg px-4 py-3 flex-row justify-between items-center">
                <Text className="text-gray-400">Masukkan pilihan...</Text>
                <ChevronDown stroke="#666" width={24} height={24} />
              </TouchableOpacity>
            </View>

            {/* Ukuran Input */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Ukuran</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan ukuran..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>

            {/* Lokasi Input */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Lokasi</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan lokasi..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>

            {/* Tanggal Input */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Tanggal</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan tanggal..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            className="w-full bg-green-700 rounded-lg px-4 py-3 items-center mt-6 mb-4"
            onPress={() => navigation.navigate('FragmentationForm2')}
          >
            <Text className="text-white font-medium">Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
