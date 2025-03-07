import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {ArrowLeft, ArrowRight, Plus, Clock} from 'react-native-feather';

const AddOrHistory = () => {
  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-full max-w-xs gap-4">
          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={() => console.log('Tambah pressed')}>
            <Plus width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="text-center text-emerald-800 font-bold text-lg">
              Tambah
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={() => console.log('Riwayat pressed')}>
            <Clock width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="text-center text-emerald-800 font-bold text-lg">
              Riwayat
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="p-5 items-end mb-4">
        <TouchableOpacity
          className="bg-green-700 px-5 py-2.5 rounded-lg shadow-md"
          onPress={() => console.log('Next pressed')}>
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