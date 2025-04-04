import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image, Alert} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {ArrowRight} from 'react-native-feather';
import {requestPhotoPermission} from '../../components/requestPhotoPermission';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DepthAverageUpload'
>;

const DepthAverageUpload = () => {
  const navigation = useNavigation<NavigationProp>();
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

  const isFormValid = imageUri !== null;

  return (
    <View className="flex-1 justify-center items-center px-4">
      <TouchableOpacity
        className="w-full max-w-md h-[400px] border border-gray-400 bg-white rounded-lg flex justify-center items-center"
        onPress={handleImagePicker}
        style={{width: '90%'}}>
        {imageUri ? (
          <View className="w-full h-full">
            <Image
              source={{uri: imageUri}}
              style={{width: '100%', height: '100%', borderRadius: 12}}
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
          onPress={() => {
            if (isFormValid) {
              navigation.navigate('FormDA1');
            }
          }}>
          <Text className="text-white font-semibold mr-2">Next</Text>
          <ArrowRight width={18} height={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DepthAverageUpload;
