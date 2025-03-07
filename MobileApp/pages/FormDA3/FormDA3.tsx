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

const FormDA3 = () => {
  const {formData, setFormData, saveToDatabase} = useContext(DepthAverageContext);
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
    if (averageValue !== formData.average) {
      setFormData({average: averageValue});
      setCalculatedAverage(averageValue);
    }
  }, [averageValue, formData.average, setFormData]);

  return (
    <SafeAreaView className="flex-1 ">
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

      <View className="p-6 mb-4">
        <TouchableOpacity
          className="bg-green-700 px-6 py-3 rounded-lg shadow-md active:bg-green-800 ml-auto"
          onPress={saveToDatabase}>
          <View className="flex-row items-center">
            <Text className="text-white font-bold mr-2">Simpan</Text>
            <Save width={20} height={20} color="white" className="mr-4" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FormDA3;
