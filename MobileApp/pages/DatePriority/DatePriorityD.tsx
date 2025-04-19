import React, {useContext, useState, useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import {Calendar, ChevronDown} from 'react-native-feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {DepthAverageContext} from '../../context/DepthAverageContext';
import {dbService} from '../../database/services/dbService';
import {API_BASE_URL} from '@env';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatePriorityD'>;

const DatePriorityD = () => {
  const navigation = useNavigation<NavigationProp>();
  const {formData, resetForm, setFormData} = useContext(DepthAverageContext);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized) {
        console.log("reset")
      resetForm();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const handleChange = (field: string, value: any) => {
    setFormData({...formData, [field]: value});
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData({tanggal: formattedDate});
      fetchNextPriority(formattedDate);
    }
  };

  const fetchNextPriority = async (date: string) => {
    const isOnline = (await NetInfo.fetch()).isConnected;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/DepthAverage/next-priority?tanggal=${date}`);
        const nextPriority = await response.json();
        setFormData({prioritas: nextPriority});
      } catch (error) {
        console.error('Failed to fetch next priority from API:', error);
      }
    } else {
      const localData = await dbService.getAllData();
      const maxPriority = localData
        .filter((d: any) => d.tanggal === date)
        .reduce((max: number, curr: any) => Math.max(max, curr.prioritas ?? 0), 0);

      setFormData({prioritas: maxPriority + 1});
    }
  };

  const isFormValid = formData.tanggal?.trim() !== '' && formData.prioritas > 0;

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#e5e7eb" />
      <ScrollView className="flex-1 px-6 pt-6">
        <View className="gap-6">
          <View className="space-y-2">
            <Text className="text-xl font-bold text-black mb-1">Tanggal</Text>
            <TouchableOpacity
              className="bg-white rounded-lg py-3 px-4 flex-row items-center justify-between"
              onPress={() => setShowDatePicker(true)}>
              <Text className="text-gray-400">
                {formData.tanggal || 'Masukkan tanggal...'}
              </Text>
              <Calendar width={20} height={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="space-y-2">
            <Text className="text-xl font-bold text-black mb-1">Prioritas</Text>
            <TouchableOpacity
              className="bg-white rounded-full py-3 px-4 flex-row items-center justify-between"
              onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}>
              <Text className="text-gray-400">
                {formData.prioritas || 'Masukkan prioritas...'}
              </Text>
              <ChevronDown width={20} height={20} color="#6b7280" />
            </TouchableOpacity>

            {showPriorityDropdown && (
              <View className="bg-white rounded-lg mt-1 shadow-md max-h-60">
                <ScrollView>
                  {[...Array(10)].map((_, index) => {
                    const priority = index + 1;
                    return (
                      <TouchableOpacity
                        key={priority}
                        className="py-3 px-4 border-b border-gray-100"
                        onPress={() => {
                          handleChange('prioritas', priority);
                          setShowPriorityDropdown(false);
                        }}>
                        <Text>{priority}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={formData.tanggal ? new Date(formData.tanggal) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <View className="p-5 items-end">
        <TouchableOpacity
          disabled={!isFormValid}
          className={`px-6 py-3 rounded-none shadow-md flex-row items-center justify-center ${
            isFormValid ? 'bg-green-800' : 'bg-gray-400 opacity-60'
          }`}
          onPress={() => navigation.navigate('DepthAverageUpload')}>
          <Text className="text-white font-semibold">Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DatePriorityD;
