import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FragmentationForm3'>;

export default function FragmentationForm3() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center items-center px-6">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="w-full my-20"
        >
          <View className="flex-1 mt-4 gap-4">
            <View className="gap-1">
              <Text className="text-black font-black mb-1">Powder Factor</Text>
              <View className="w-full bg-rose-50 rounded-lg px-4 py-1 flex-row justify-between items-center">
                <TextInput
                  placeholder="Masukkan jumlah..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1"
                  value="25"
                />
              </View>
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            className="w-full bg-green-700 rounded-lg px-4 py-3 items-center mt-6"
            onPress={() => navigation.navigate('FragmentationForm4')}
          >
            <Text className="text-white font-medium">Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
