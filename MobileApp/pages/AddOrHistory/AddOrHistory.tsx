import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { ArrowLeft, ArrowRight, Plus, Clock } from 'react-native-feather';

const AddOrHistory = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header with Back button and Logo */}
      <View className="flex-row justify-between items-center px-5 py-4">
        <TouchableOpacity
          className="bg-green-700 px-4 py-2.5 rounded-lg shadow-sm"
          onPress={() => console.log('Back pressed')}
        >
          <View className="flex-row items-center">
            <ArrowLeft width={18} height={18} color="white" />
            <Text className="text-white font-semibold ml-1.5">Back</Text>
          </View>
        </TouchableOpacity>

        <View className="bg-white px-5 py-2.5 rounded-full shadow-md flex-row items-center border border-gray-100">
          <Image
            source={{ uri: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.png' }}
            className="w-8 h-8 mr-2"
            resizeMode="contain"
          />
          <Image
            source={{ uri: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.png' }}
            className="w-8 h-8"
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-full max-w-xs space-y-5">
          {/* Tambah Button */}
          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={() => console.log('Tambah pressed')}
          >
            <Plus width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="text-center text-emerald-800 font-bold text-lg">Tambah</Text>
          </TouchableOpacity>

          {/* Riwayat Button */}
          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={() => console.log('Riwayat pressed')}
          >
            <Clock width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="text-center text-emerald-800 font-bold text-lg">Riwayat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer with Next button */}
      <View className="p-5 items-end">
        <TouchableOpacity
          className="bg-green-700 px-5 py-2.5 rounded-lg shadow-md"
          onPress={() => console.log('Next pressed')}
        >
          <View className="flex-row items-center">
            <Text className="text-white font-semibold mr-1.5">Next</Text>
            <ArrowRight width={18} height={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddOrHistory;