import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image, Alert} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {ArrowRight} from 'react-native-feather';

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
    <View className="flex-1 justify-center items-center px-4">
      <TouchableOpacity
        className="w-full max-w-md h-[400px] border border-gray-400 bg-white rounded-lg flex justify-center items-center"
        onPress={handleImagePicker}
        style={{ width: '90%' }}>
        
        {imageUri ? (
          <View className="flex-row items-center">
            <Image
              source={{uri: imageUri}}
              className="w-56 h-56 rounded-lg"
              resizeMode="contain"
            />
            <Image
              source={require('../../public/assets/Plus.png')}
              className="w-12 h-12 ml-4"
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
          className="bg-green-700 px-6 py-3 rounded-lg shadow-md"
          onPress={() => navigation.navigate('FormDA1')}>
          <View className="flex-row items-center">
            <Text className="text-white font-semibold mr-2">Next</Text>
            <ArrowRight width={18} height={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DepthAverageUpload;
