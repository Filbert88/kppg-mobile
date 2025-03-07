import React, {useContext, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import {ArrowRight, Edit2, Hash} from 'react-native-feather';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import {DepthAverageContext} from '../../context/DepthAverageContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FormDA2'>;

const FormDA2 = () => {
  const navigation = useNavigation<NavigationProp>();
  const {formData, setFormData} = useContext(DepthAverageContext);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData({
        kedalaman: {
          ...formData.kedalaman,
          [field]: value,
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

  const jumlahLubang = parseInt(formData.jumlahLubang, 10) || 0;

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

  return (
    <SafeAreaView className="flex-1 ">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="gap-6">
          {Array.from({length: jumlahLubang}, (_, i) =>
            renderDepthInput(i + 1, `kedalaman${i + 1}`),
          )}
        </View>
        <View className="h-20" />
      </ScrollView>

      <View className="p-6 mb-4">
        <TouchableOpacity
          className="bg-green-700 px-6 py-3 rounded-lg shadow-md active:bg-green-800 ml-auto"
          onPress={() => navigation.navigate('FormDA3')}>
          <View className="flex-row items-center">
            <Text className="text-white font-bold mr-2">Next</Text>
            <ArrowRight width={18} height={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FormDA2;
