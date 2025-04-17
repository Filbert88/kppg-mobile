import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {Save, Percent} from 'react-native-feather';
import {DepthAverageContext} from '../../context/DepthAverageContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FormDA3'>;

const FormDA3 = () => {
  const {formData, setFormData, saveToDatabase, resetForm} =
    useContext(DepthAverageContext);
  const navigation = useNavigation<NavigationProp>();
  const [calculatedAverage, setCalculatedAverage] = useState<string>('N/A');

  const depthValues = Object.values(formData.kedalaman)
    .map(value => parseFloat(value))
    .filter(value => !isNaN(value));

  const averageValue = depthValues.length
    ? (
        depthValues.reduce((sum, val) => sum + val, 0) / depthValues.length
      ).toFixed(2)
    : 'N/A';

  useEffect(() => {
    if (averageValue !== 'N/A') {
      setFormData({average: averageValue});
      setCalculatedAverage(averageValue);
    }
  }, [averageValue]);

  const handleSaveAndNavigate = async () => {
    try {
      const success = await saveToDatabase();
      if (success) {
        navigation.navigate('DAHistory');
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    if (formData.origin === 'DAHistoryIncomplete') {
      navigation.navigate('DAHistoryIncomplete'); // Navigate back to DAHistoryIncomplete
    } else {
      navigation.navigate('DAHistory'); // Navigate back to DAHistory
    }
  };

  // UPDATE handler
  const handleUpdateAndNavigate = async () => {
    console.log("hit")
    try {
      const response = await fetch(
        `http://10.0.2.2:5180/api/DepthAverage/${formData.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lokasi: formData.lokasi,
            tanggal: formData.tanggal,
            average: formData.average,
            prioritas: formData.prioritas,
            kedalaman: JSON.stringify(formData.kedalaman),
            jumlahLubang: formData.jumlahLubang,
            imageUri: formData.imageUri,
          }),
        }
      );
      if (!response.ok) throw new Error('Update failed');
      navigation.navigate('DAHistory');
    } catch (error) {
      console.error('Failed to update data:', error);
    }
  };
  const isEdit = formData.isEdit;
  const isFormValid =
    calculatedAverage !== 'N/A' &&
    calculatedAverage !== '' &&
    !isNaN(Number(calculatedAverage));

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      <View className="flex-1 px-6 pt-8">
        <View className="gap-2.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-bold text-black">Average</Text>
            <Percent width={20} height={20} color="#6b7280" />
          </View>

          <View className="bg-rose-50 rounded-2xl p-4">
            <Text className="text-2xl font-semibold text-gray-800 text-left">
              {calculatedAverage}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between p-6 mb-4">
        {isEdit && (
          <TouchableOpacity
            className="px-4 py-2 bg-red-200 rounded-lg"
            onPress={handleCancelEdit}
          >
            <Text className="text-red-800 font-medium">Cancel Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={!isFormValid}
          className={`px-6 py-3 rounded-lg flex-row items-center ${isFormValid ? 'bg-green-700' : 'bg-gray-400 opacity-60'}`}
          onPress={isEdit ? handleUpdateAndNavigate : handleSaveAndNavigate}
        >
          <Text className="text-white font-bold mr-2">{isEdit ? 'Update' : 'Simpan'}</Text>
          <Save width={20} height={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FormDA3;
