import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { ChevronDown, Edit } from 'react-native-feather';

export default function FormScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-200">
      <View className="flex-1 justify-center items-center px-6">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="w-full my-20"
        >
          {/* Image Upload Area */}
          <TouchableOpacity
            className="w-full aspect-[16/9] bg-white rounded-lg mt-4 items-center justify-center border border-gray-300"
            onPress={() => console.log('Upload image')}
          >
            <View className="items-center">
              <Text className="text-4xl text-gray-300 mb-2">+</Text>
              <Text className="text-gray-400">Masukkan gambar...</Text>
            </View>
          </TouchableOpacity>

          {/* Form Fields with Larger Gaps */}
          <View className="flex-1 mt-4 gap-4">
            {/* Skala Dropdown */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Skala</Text>
              <TouchableOpacity className="w-full bg-rose-50 rounded-lg px-4 py-3 flex-row justify-between items-center">
                <Text className="text-gray-400">Masukkan skala...</Text>
                <ChevronDown stroke="#666" width={24} height={24} />
              </TouchableOpacity>
            </View>

            {/* Pilihan Dropdown */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Pilihan</Text>
              <TouchableOpacity className="w-full bg-rose-50 rounded-lg px-4 py-3 flex-row justify-between items-center">
                <Text className="text-gray-400">Masukkan pilihan...</Text>
                <ChevronDown stroke="#666" width={24} height={24} />
              </TouchableOpacity>
            </View>

            {/* Ukuran Input */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Ukuran</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan ukuran..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>

            {/* Lokasi Input */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Lokasi</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan lokasi..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>

            {/* Tanggal Input */}
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Tanggal</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan tanggal..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1"
                />
                <Edit stroke="#666" width={20} height={20} />
              </View>
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            className="w-full bg-green-700 rounded-lg px-4 py-3 items-center mt-6 mb-4"
            onPress={() => console.log('Next pressed')}
          >
            <Text className="text-white font-medium">Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
