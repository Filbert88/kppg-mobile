import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image, Alert} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DepthAverageUpload'
>;

const DepthAverageUpload = () => {
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
    <View className="flex-1 justify-center items-center">
      <TouchableOpacity
        className="w-64 h-64 border border-gray-400 bg-white rounded-lg flex justify-center items-center"
        onPress={handleImagePicker}>
        {imageUri ? (
          <Image
            source={{uri: imageUri}}
            className="w-full h-full rounded-lg"
            resizeMode="contain"
          />
        ) : (
          <>
            <Image
              source={require('../../public/assets/Image.png')}
              className="w-12 h-12 mb-2"
              resizeMode="contain"
            />
            <Text className="text-gray-500 text-base">Masukkan gambar...</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Next Button */}
      <View className="absolute bottom-5 right-5">
        <TouchableOpacity
          className="bg-green-700 px-5 py-2.5 rounded-lg shadow-md"
          onPress={() => navigation.navigate('FormDA1')}>
          <Text className="text-white font-semibold">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DepthAverageUpload;
