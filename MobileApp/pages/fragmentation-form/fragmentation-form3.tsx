import React, {useContext, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {FormContext} from '../../context/FragmentationContext';
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationForm3'
>;

export default function FragmentationForm3() {
  const navigation = useNavigation<NavigationProp>();
  const {formData, updateForm, resetForm} = useContext(FormContext);
  const {powderFactor} = formData;

  //   const [powderFactor, setPowderFactor] = useState('25');

  const isFormValid = powderFactor.trim() !== '';

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
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Powder Factor</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan jumlah..."
                  placeholderTextColor="#9CA3AF"
                  value={powderFactor}
                  onChangeText={text => updateForm({powderFactor: text})}
                  keyboardType="numeric"
                  className="flex-1 text-black"
                />
              </View>
            </View>
          </View>

          {formData.isEdit && (
            <TouchableOpacity
              className="px-4 py-3 bg-red-200 rounded-lg"
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
                navigation.navigate('FragmentationForm4');
              }
            }}>
            <Text className="text-white font-medium">Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
