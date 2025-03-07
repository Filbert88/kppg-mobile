import React, { useState } from 'react';
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

type DepthsType = {
  depth1: string;
  depth2: string;
  depth3: string;
  depth4: string;
  depth5: string;
  depth6: string;
  depth7: string;
  depth8: string;
  depth9: string;
};

const FormDA2 = () => {
  const [depths, setDepths] = useState<DepthsType>({
    depth1: '',
    depth2: '',
    depth3: '',
    depth4: '',
    depth5: '',
    depth6: '',
    depth7: '',
    depth8: '',
    depth9: '',
  });

  const [focusedField, setFocusedField] = useState<keyof DepthsType | null>(null);

  const handleChange = (field: keyof DepthsType, value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setDepths(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFocus = (field: keyof DepthsType) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const getInputStyle = (field: keyof DepthsType) => {
    return `bg-white rounded-xl py-3.5 pl-11 pr-12 text-gray-800 shadow-sm ${
      focusedField === field 
        ? 'border-2 border-green-600' 
        : 'border border-gray-200'
    }`;
  };

  const renderDepthInput = (number: number, field: keyof DepthsType) => (
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
          value={depths[field]}
          onChangeText={(text) => handleChange(field, text)}
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
          }}
        >
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
          {renderDepthInput(1, 'depth1')}
          {renderDepthInput(2, 'depth2')}
          {renderDepthInput(3, 'depth3')}
          {renderDepthInput(4, 'depth4')}
          {renderDepthInput(5, 'depth5')}
          {renderDepthInput(6, 'depth6')}
          {renderDepthInput(7, 'depth7')}
          {renderDepthInput(8, 'depth8')}
          {renderDepthInput(9, 'depth9')}
        </View>
        <View className="h-20" />
      </ScrollView>
      
      <View className="p-6 mb-4">
        <TouchableOpacity 
          className="bg-green-700 px-6 py-3 rounded-lg shadow-md active:bg-green-800 ml-auto"
          onPress={() => console.log('Next pressed', depths)}
        >
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
