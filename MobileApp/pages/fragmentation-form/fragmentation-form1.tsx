import React, {useState, useRef, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import {ChevronDown, Edit, ArrowRight} from 'react-native-feather';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {launchImageLibrary} from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Platform} from 'react-native';
import { FormContext} from '../../context/FragmentationContext';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationForm1'
>;

export default function FragmentationForm1() {
  const navigation = useNavigation<NavigationProp>();
  const { formData, updateForm } = useContext(FormContext);
//   const [imageUri, setImageUri] = useState<string | null>(null);
//
//   const [skala, setSkala] = useState('');
//   const [pilihan, setPilihan] = useState('');
//   const [ukuran, setUkuran] = useState('');
//   const [lokasi, setLokasi] = useState('');
//   const [tanggal, setTanggal] = useState('');

  const [skalaDropdownOpen, setSkalaDropdownOpen] = useState(false);
  const [pilihanDropdownOpen, setPilihanDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animation values
  const skalaDropdownHeight = useRef(new Animated.Value(0)).current;
  const pilihanDropdownHeight = useRef(new Animated.Value(0)).current;

  const skalaOptions = ['Skala Helm', 'Skala Bola', 'Skala Manual'];
  const pilihanOptions = ['Centimeter (cm)', 'Meter (m)', 'Decimeter (dm)'];

  // Animation functions
  useEffect(() => {
    Animated.timing(skalaDropdownHeight, {
      toValue: skalaDropdownOpen ? skalaOptions.length * 44 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [skalaDropdownOpen]);

  useEffect(() => {
    Animated.timing(pilihanDropdownHeight, {
      toValue: pilihanDropdownOpen ? pilihanOptions.length * 44 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [pilihanDropdownOpen]);

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
      updateForm({
            rawImageUris: [
              ...formData.imageUris,
              selectedImage.uri || '',
            ],
          });

      console.log('Updated imageUris:', [
        ...formData.imageUris,
        selectedImage.uri || '',
      ]);
    }
  };
  const { rawImageUris, skala, pilihan, ukuran, lokasi } = formData;

  console.log("Form data ", formData)

  const isFormValid =
    rawImageUris.length >= 1 &&
    skala.trim() !== '' &&
    pilihan.trim() !== '' &&
    ukuran.trim() !== '' &&
    lokasi.trim() !== ''

  // Close other dropdown when one is opened
  const toggleSkalaDropdown = () => {
    setPilihanDropdownOpen(false);
    setSkalaDropdownOpen(!skalaDropdownOpen);
  };

  const togglePilihanDropdown = () => {
    setSkalaDropdownOpen(false);
    setPilihanDropdownOpen(!pilihanDropdownOpen);
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center items-center px-6">
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}
          className="w-full my-8">
          {/* Image Upload */}
          <TouchableOpacity
            className="w-full aspect-[16/9] bg-white rounded-lg items-center justify-center border border-gray-300"
            onPress={handleImagePicker}>
            {rawImageUris.length != 0 ? (
              <Image
                source={{uri: rawImageUris[0]}}
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
            <View className="gap-1 z-20">
              <Text className="text-black font-black mb-1">Skala</Text>
              <TouchableOpacity
                className={`w-full bg-rose-50 rounded-lg px-4 py-3 flex-row justify-between items-center ${
                  skalaDropdownOpen ? 'rounded-b-none' : ''
                }`}
                onPress={toggleSkalaDropdown}>
                <Text className={`text-black ${!skala ? 'text-gray-400' : ''}`}>
                  {skala || 'Masukkan skala...'}
                </Text>
                <ChevronDown
                  stroke="#666"
                  width={24}
                  height={24}
                  style={{
                    transform: [
                      {rotate: skalaDropdownOpen ? '180deg' : '0deg'},
                    ],
                  }}
                />
              </TouchableOpacity>

              {/* Dropdown for Skala */}
              <Animated.View
                style={{
                  height: skalaDropdownHeight,
                  overflow: 'hidden',
                }}
                className="w-full bg-white border-x border-b border-gray-300 rounded-b-lg shadow-md z-10">
                {skalaOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    className={`py-3 px-4 border-b border-gray-100 ${
                      index === skalaOptions.length - 1 ? 'border-b-0' : ''
                    }`}
                    onPress={() => {
                      console.log("press")
                      updateForm({ skala: option });
                      setSkalaDropdownOpen(false);
                    }}>
                    <Text className="text-black">{option}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>

            {/* Pilihan */}
            <View className="gap-1 z-10">
              <Text className="text-black font-black mb-1">Pilihan</Text>
              <TouchableOpacity
                className={`w-full bg-rose-50 rounded-lg px-4 py-3 flex-row justify-between items-center ${
                  pilihanDropdownOpen ? 'rounded-b-none' : ''
                }`}
                onPress={togglePilihanDropdown}>
                <Text
                  className={`text-black ${!pilihan ? 'text-gray-400' : ''}`}>
                  {pilihan || 'Masukkan pilihan...'}
                </Text>
                <ChevronDown
                  stroke="#666"
                  width={24}
                  height={24}
                  style={{
                    transform: [
                      {rotate: pilihanDropdownOpen ? '180deg' : '0deg'},
                    ],
                  }}
                />
              </TouchableOpacity>

              {/* Dropdown for Pilihan */}
              <Animated.View
                style={{
                  height: pilihanDropdownHeight,
                  overflow: 'hidden',
                }}
                className="w-full bg-white border-x border-b border-gray-300 rounded-b-lg shadow-md">
                {pilihanOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    className={`py-3 px-4 border-b border-gray-100 ${
                      index === pilihanOptions.length - 1 ? 'border-b-0' : ''
                    }`}
                    onPress={() => {
                      updateForm({ pilihan: option });
                      setPilihanDropdownOpen(false);
                    }}>
                    <Text className="text-black">{option}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>

            {/* Ukuran */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Ukuran</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan ukuran..."
                  value={ukuran}
                  onChangeText={text => updateForm({ ukuran: text })}
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
                  onChangeText={text => updateForm({ lokasi: text })}
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
            }`}>
            <Text className="text-white font-medium">Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
