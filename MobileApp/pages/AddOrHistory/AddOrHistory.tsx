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
    if (type === 'FragmentasiForm1') {
      navigation.navigate('FragmentationForm1');
    } else if (type === 'DepthAverage') {
      navigation.navigate('DepthAverageUpload');
    }
  };

  const handleRiwayatPress = () => {
    if (type === 'FragmentasiForm1') {
      navigation.navigate('FragmentationHistory');
    } else if (type === 'DepthAverage') {
      navigation.navigate('DAHistory');
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-full max-w-xs gap-4">
          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={handleTambahPress}
          >
            <Plus width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="text-center text-emerald-800 font-bold text-lg">Tambah</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-emerald-200 py-4 px-6 rounded-xl shadow-md active:bg-emerald-300 flex-row justify-center items-center"
            onPress={handleRiwayatPress}
          >
            <Clock width={20} height={20} color="#065f46" className="mr-2" />
            <Text className="text-center text-emerald-800 font-bold text-lg">Riwayat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AddOrHistory;
