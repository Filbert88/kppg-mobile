import React, {useContext, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import {ArrowRight, Edit2, Calendar, MapPin, Hash} from 'react-native-feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {DepthAverageContext} from '../../context/DepthAverageContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FormDA1'>;

const FormDA1 = () => {
  const navigation = useNavigation<NavigationProp>();
  const {formData, setFormData} = useContext(DepthAverageContext);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData({[field]: value});
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData({tanggal: formattedDate});
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="gap-8">
          <View className="space-y-2">
            <Text className="text-2xl font-bold text-black mb-1">
              Jumlah Lubang
            </Text>
            <View className="relative">
              <View className="absolute top-3 left-3 z-10">
                <Hash width={20} height={20} color="#6b7280" />
              </View>
              <TextInput
                className="bg-white rounded-lg py-3 pl-10 pr-12 text-gray-700 shadow-sm border border-gray-200"
                placeholder="Masukkan jumlah lubang..."
                placeholderTextColor="#9ca3af"
                value={formData.jumlahLubang}
                onChangeText={text => handleChange('jumlahLubang', text)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                className="absolute right-3 top-3"
                onPress={() => console.log('Edit jumlah lubang')}>
                <Edit2 width={18} height={18} color="#4b5563" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="space-y-2">
            <Text className="text-2xl font-bold text-black mb-1">Lokasi</Text>
            <View className="relative">
              <View className="absolute top-3 left-3 z-10">
                <MapPin width={20} height={20} color="#6b7280" />
              </View>
              <TextInput
                className="bg-white rounded-lg py-3 pl-10 pr-12 text-gray-700 shadow-sm border border-gray-200"
                placeholder="Masukkan lokasi..."
                placeholderTextColor="#9ca3af"
                value={formData.lokasi}
                onChangeText={text => handleChange('lokasi', text)}
              />
              <TouchableOpacity
                className="absolute right-3 top-3"
                onPress={() => console.log('Edit lokasi')}>
                <Edit2 width={18} height={18} color="#4b5563" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="space-y-2">
            <Text className="text-2xl font-bold text-black mb-1">Tanggal</Text>
            <View className="relative">
              <View className="absolute top-3 left-3 z-10">
                <Calendar width={20} height={20} color="#6b7280" />
              </View>
              <TouchableOpacity
                className="bg-white rounded-lg py-3 pl-10 pr-12 text-gray-700 shadow-sm border border-gray-200 flex-row items-center"
                onPress={() => setShowDatePicker(true)}>
                <Text className="text-gray-700 flex-1">
                  {formData.tanggal || 'Masukkan tanggal...'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="absolute right-3 top-3"
                onPress={() => setShowDatePicker(true)}>
                <Edit2 width={18} height={18} color="#4b5563" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={
                    formData.tanggal ? new Date(formData.tanggal) : new Date()
                  }
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="p-5 items-end mb-4">
        <TouchableOpacity
          className="bg-green-700 px-6 py-3 rounded-lg shadow-md"
          onPress={() => navigation.navigate('FormDA2')}>
          <View className="flex-row items-center">
            <Text className="text-white font-semibold mr-2">Next</Text>
            <ArrowRight width={18} height={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FormDA1;
