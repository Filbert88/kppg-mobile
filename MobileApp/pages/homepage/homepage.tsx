import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Homepage'>;

export default function Homepage() {
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation<NavigationProp>();

  const screenWidth = Dimensions.get('window').width;
  const buttonWidth = screenWidth * 0.7;

  return (
    <SafeAreaView className="flex-1 bg-gray-200">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      <View className="flex-1 items-center justify-center gap-4">
        <TouchableOpacity
          style={{ width: buttonWidth }}
          className="bg-green-500 py-3 rounded-md mb-6 items-center"
          onPress={() => navigation.navigate('AddOrHistory', { type: 'FragmentasiForm1' })}
        >
          <Text className="text-white font-medium text-lg">Fragmentasi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ width: buttonWidth }}
          className="bg-green-500 py-3 rounded-md mb-6 items-center"
          onPress={() => navigation.navigate('AddOrHistory', { type: 'DepthAverage' })}
        >
          <Text className="text-white font-medium text-lg">Depth Average</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: buttonWidth }}
          className="bg-green-500 py-3 rounded-md mb-6 items-center"
          onPress={() => console.log('Bantuan pressed')}
        >
          <Text className="text-white font-medium text-lg">Bantuan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
