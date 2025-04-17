import React, {useContext, useState, useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
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
import {ArrowRight, Calendar, ChevronDown} from 'react-native-feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {DepthAverageContext} from '../../context/DepthAverageContext';
import {FormContext} from '../../context/FragmentationContext';
import { dbService } from '../../database/services/dbService';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DatePriority'
>;
type RouteProps = RouteProp<RootStackParamList, 'DatePriority'>;

const DatePriority = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {type} = route.params;

  const {
    formData,
    setFormData,
    resetForm: resetDepthForm,
  } = useContext(DepthAverageContext);
  const {resetForm: resetFragmentationForm} = useContext(FormContext);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  useEffect(() => {
    // Reset the form based on the selected type
    if (type === 'FragmentasiForm1') {
      resetFragmentationForm();
    } else if (type === 'DepthAverage') {
      resetDepthForm();
    }
  }, [type]);

  const handleChange = (field: string, value: any) => {
    setFormData({...formData, [field]: value});
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        setFormData({ tanggal: formattedDate });
        fetchNextPriority(formattedDate); 
      }      
  };

  const fetchNextPriority = async (date: string) => {
    const isOnline = (await NetInfo.fetch()).isConnected;
  
    if (isOnline) {
      const endpoint =
        type === 'DepthAverage'
          ? `http://10.0.2.2:5180/api/DepthAverage/next-priority?tanggal=${date}`
          : `http://10.0.2.2:5180/api/Fragmentation/next-priority?tanggal=${date}`;
  
      try {
        const response = await fetch(endpoint);
        const nextPriority = await response.json();
        console.log(nextPriority)

        setFormData({ prioritas: nextPriority });
      } catch (error) {
        console.error('Failed to fetch next priority from API:', error);
      }
    } else {
      const localData =
        type === 'DepthAverage'
          ? await dbService.getAllData()
          : await dbService.getFragmentationData();
  
      const maxPriority = localData
        .filter((d: any) => d.tanggal === date)
        .reduce((max: number, curr: any) => Math.max(max, curr.prioritas ?? 0), 0);
  
      setFormData({ prioritas: maxPriority + 1 });
    }
  };
  
  const isFormValid = formData.tanggal?.trim() !== '' && formData.prioritas > 0;

  return (
    <SafeAreaView className="flex-1 ">
      <StatusBar barStyle="dark-content" backgroundColor="#e5e7eb" />

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="gap-6">
          {/* Tanggal */}
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
                {formData.prioritas
                  ? formData.prioritas
                  : 'Masukkan prioritas...'}
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
      {/* Next Button */}
      <View className="p-5 items-end">
        <TouchableOpacity
          disabled={!isFormValid}
          className={`px-6 py-3 rounded-none shadow-md flex-row items-center justify-center ${
            isFormValid ? 'bg-green-800' : 'bg-gray-400 opacity-60'
          }`}
          onPress={() => {
            if (isFormValid) {
              if (type === 'FragmentasiForm1') {
                navigation.navigate('FragmentationForm1');
              } else if (type === 'DepthAverage') {
                navigation.navigate('DepthAverageUpload');
              }
            }
          }}>
          <Text className="text-white font-semibold">Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DatePriority;