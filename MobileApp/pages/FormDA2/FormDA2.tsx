import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { ArrowRight, Edit2, Hash } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { DepthAverageContext } from '../../context/DepthAverageContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FormDA2'>;

const FormDA2 = () => {
  const navigation = useNavigation<NavigationProp>();
  const { formData, setFormData, resetForm } = useContext(DepthAverageContext);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const jumlahLubang = parseInt(formData.jumlahLubang, 10) || 0;

  const handleChange = (field: string, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (/^\d*\.?\d*$/.test(cleaned)) {
      setFormData({
        kedalaman: {
          ...formData.kedalaman,
          [field]: cleaned,
        },
      });
    }
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const getInputStyle = (field: string) => {
    return `bg-white rounded-xl py-3.5 pl-11 pr-12 text-gray-800 shadow-sm ${
      focusedField === field
        ? 'border-2 border-green-600'
        : 'border border-gray-200'
    }`;
  };

  const handleCancelEdit = () => {
    resetForm();
    if (formData.origin === 'DAHistoryIncomplete') {
      navigation.navigate('DAHistoryIncomplete'); // Navigate back to DAHistoryIncomplete
    } else {
      navigation.navigate('DAHistory'); // Navigate back to DAHistory
    }
  };

  const renderDepthInput = (number: number, field: string) => (
    <View className="space-y-2.5" key={field}>
      <Text className="text-2xl font-bold text-black px-1 mb-1">
        Kedalaman Lubang ke-{number}
      </Text>
      <View className="relative">
        <View className="absolute top-3.5 left-3.5 z-10">
          <Hash
            width={20}
            height={20}
            color={focusedField === field ? '#047857' : '#6b7280'}
          />
        </View>
        <TextInput
          className={getInputStyle(field)}
          placeholder="Masukkan ukuran..."
          placeholderTextColor="#9ca3af"
          value={formData.kedalaman[field] || ''}
          onChangeText={text => handleChange(field, text)}
          onFocus={() => handleFocus(field)}
          onBlur={handleBlur}
          keyboardType="numeric"
        />
        <TouchableOpacity
          className={`absolute right-3.5 top-3.5 p-0.5 rounded-full ${
            focusedField === field ? 'bg-green-100' : ''
          }`}
          onPress={() => {
            console.log(`Edit depth ${number}`);
            handleFocus(field);
          }}>
          <Edit2
            width={18}
            height={18}
            color={focusedField === field ? '#047857' : '#4b5563'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const isFormValid = Array.from({ length: jumlahLubang }).every((_, i) => {
    const field = `kedalaman${i + 1}`;
    const value = formData.kedalaman?.[field];
    return value && value.trim() !== '';
  });

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="gap-6">
          {Array.from({ length: jumlahLubang }, (_, i) =>
            renderDepthInput(i + 1, `kedalaman${i + 1}`),
          )}
        </View>
        <View className="h-20" />
      </ScrollView>

      <View className="flex-row justify-between p-6 mb-4"> 
        {formData.isEdit && (
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
          onPress={() => navigation.navigate('FormDA3')}
        >
          <Text className="text-white font-bold mr-2">Next</Text>
          <ArrowRight width={18} height={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FormDA2;
