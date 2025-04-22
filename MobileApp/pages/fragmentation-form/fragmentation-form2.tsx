import React, {useContext, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Animated,
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

  const currentPowderFactor = formData.powderFactor;

  const [litologiOpen, setLitologiOpen] = useState(false);
  const litologiOptions = ['Claystone', 'Sandstone', 'Siltstone', 'Others'];
  const litologiHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(litologiHeight, {
      toValue: litologiOpen ? litologiOptions.length * 44 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [litologiOpen]);

  useEffect(() => {
    if (ammoniumNitrate && volumeBlasting) {
      const q = parseFloat(ammoniumNitrate);
      const v = parseFloat(volumeBlasting);
      if (!isNaN(q) && !isNaN(v) && v !== 0) {
        const powderFactor = (q / v).toFixed(2);
        if (currentPowderFactor !== powderFactor) {
          updateForm({powderFactor});
        }
      } else {
        if (currentPowderFactor !== '') {
          updateForm({powderFactor: ''});
        }
      }
    } else {
      if (currentPowderFactor !== '') {
        updateForm({powderFactor: ''});
      }
    }
  }, [ammoniumNitrate, volumeBlasting, currentPowderFactor, updateForm]);

  const isFormValid =
    litologi.trim() !== '' &&
    ammoniumNitrate.trim() !== '' &&
    volumeBlasting.trim() !== '';

  const handleCancelEdit = () => {
    resetForm();
    if (formData.origin === 'FragmentationHistoryIncomplete') {
      navigation.navigate('FragmentationHistoryIncomplete'); // Go back to FragmentationHistoryIncomplete
    } else {
      navigation.navigate('FragmentationHistoryDone'); // Go back to FragmentationHistory
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center items-center px-6">
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}
          className="w-full my-20">
          <View className="flex-1 mt-4 gap-4">
            {/* Litologi Dropdown */}
            <View className="mb-6 z-20">
              <Text className="text-black font-bold mb-2">Litologi Batuan</Text>
              <TouchableOpacity
                onPress={() => setLitologiOpen(o => !o)}
                className={`w-full bg-rose-50 rounded-lg px-4 py-3 flex-row justify-between items-center ${
                  litologiOpen ? 'rounded-b-none' : ''
                }`}>
                <Text
                  className={`${litologi ? 'text-black' : 'text-gray-400'}`}>
                  {litologi || 'Pilih Litologi...'}
                </Text>
                <ChevronDown
                  stroke="#666"
                  width={20}
                  height={20}
                  style={{
                    transform: [{rotate: litologiOpen ? '180deg' : '0deg'}],
                  }}
                />
              </TouchableOpacity>
              <Animated.View
                style={{height: litologiHeight, overflow: 'hidden'}}
                className="w-full bg-white border border-t-0 border-gray-300 rounded-b-lg">
                {litologiOptions.map((opt, idx) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      updateForm({litologi: opt});
                      setLitologiOpen(false);
                    }}
                    className={`px-4 py-3 border-b border-gray-100 ${
                      idx === litologiOptions.length - 1 ? 'border-b-0' : ''
                    }`}>
                    <Text className="text-black">{opt}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
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
              className="px-4 py-3 bg-red-200 rounded-lg mb-2"
              onPress={handleCancelEdit}>
              <Text className="text-red-800 font-medium text-md text-center">
                Cancel Edit
              </Text>
            </TouchableOpacity>
          )}

          {/* Next Button */}
          <TouchableOpacity
            disabled={!isFormValid}
            className={`w-full rounded-lg px-4 py-3 items-center mt-3 ${
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
