import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Plus, Clock } from 'react-native-feather';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AddOrHistoryRouteProp = RouteProp<RootStackParamList, 'AddOrHistory'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddOrHistory'>;

const AddOrHistory = () => {
  const route = useRoute<AddOrHistoryRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { type } = route.params;

  const handleTambahPress = () => {
    if(type === 'DepthAverage'){
      navigation.navigate('DatePriorityD')
    }else if( type === 'FragmentasiForm1'){
      navigation.navigate('DatePriorityF')
    }
  };

  const handleRiwayatPress = () => {
    if (type === 'FragmentasiForm1') {
      navigation.navigate('FragmentationHistoryDone');
    } else if (type === 'DepthAverage') {
      navigation.navigate('DAHistory');
    }
  };

  const handleHistoryBelumSelesaiPress = () => {
    if (type === 'FragmentasiForm1') {
      navigation.navigate('FragmentationHistoryIncomplete'); // Navigate to FragmentationHistoryIncomplete
    } else if (type === 'DepthAverage') {
      navigation.navigate('DAHistoryIncomplete'); // Navigate to DAHistoryIncomplete
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-full max-w-xs gap-4">
          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={handleTambahPress}>
            <Plus width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="text-center text-emerald-800 font-bold text-lg">
              Tambah
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={handleRiwayatPress}>
            <Clock width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="ml-2 text-center text-emerald-800 font-bold text-lg">
              Riwayat
            </Text>
          </TouchableOpacity>

          {/* Add a button for History Belum Selesai */}
          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={handleHistoryBelumSelesaiPress}>
            <Clock width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="ml-2 text-center text-emerald-800 font-bold text-lg">
              Riwayat Belum Selesai
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AddOrHistory;
