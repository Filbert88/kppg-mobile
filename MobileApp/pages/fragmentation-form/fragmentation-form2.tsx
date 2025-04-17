import React, {useContext, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import {ChevronDown} from 'react-native-feather';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {FormContext} from '../../context/FragmentationContext';
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationForm2'
>;

export default function FragmentationForm2() {
  const navigation = useNavigation<NavigationProp>();
  const {formData, updateForm, resetForm} = useContext(FormContext);
  const {litologi, ammoniumNitrate, volumeBlasting} = formData;
  //   const [litologi, setLitologi] = useState('');
  //   const [ammoniumNitrate, setAmmoniumNitrate] = useState('');
  //   const [volumeBlasting, setVolumeBlasting] = useState('');

  const isFormValid =
    litologi.trim() !== '' &&
    ammoniumNitrate.trim() !== '' &&
    volumeBlasting.trim() !== '';

  const handleCancelEdit = () => {
    resetForm();
    if (formData.origin === 'FragmentationHistoryIncomplete') {
      navigation.navigate('FragmentationHistoryIncomplete'); // Go back to FragmentationHistoryIncomplete
    } else {
      navigation.navigate('FragmentationHistory'); // Go back to FragmentationHistory
    }
  };
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center items-center px-6">
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}
          className="w-full my-20">
          <View className="flex-1 mt-4 gap-4">
            {/* Litologi Dropdown (input simulation for now) */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">
                Litologi Batuan
              </Text>
              <TextInput
                placeholder="Masukkan jenis..."
                value={litologi}
                onChangeText={text => updateForm({litologi: text})}
                placeholderTextColor="#9CA3AF"
                className="w-full bg-rose-50 rounded-lg px-4 py-3 text-black"
              />
            </View>

            {/* Amonium Nitrat */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Amonium Nitrat</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan jumlah..."
                  value={ammoniumNitrate}
                  onChangeText={text => updateForm({ammoniumNitrate: text})}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 text-black"
                />
              </View>
            </View>

            {/* Volume Blasting */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">
                Volume Blasting
              </Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan volume..."
                  value={volumeBlasting}
                  onChangeText={text => updateForm({volumeBlasting: text})}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 text-black"
                />
              </View>
            </View>
          </View>

          {formData.isEdit && (
            <TouchableOpacity
              className="px-4 py-5 bg-red-200 rounded-lg mb-2"
              onPress={handleCancelEdit}>
              <Text className="text-red-800 font-medium text-lg text-center">
                Cancel Edit
              </Text>
            </TouchableOpacity>
          )}
          {/* Next Button */}
          <TouchableOpacity
            disabled={!isFormValid}
            className={`w-full rounded-lg px-4 py-3 items-center mt-6 ${
              isFormValid ? 'bg-green-700' : 'bg-gray-400 opacity-60'
            }`}
            onPress={() => {
              if (isFormValid) {
                navigation.navigate('FragmentationForm3');
              }
            }}>
            <Text className="text-white font-medium">Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
