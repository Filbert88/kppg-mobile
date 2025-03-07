import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  ZoomIn,
  ZoomOut,
  Link,
  Crop,
  Tool,
  Edit2,
  Paperclip
} from 'react-native-feather';

import EraseIcon from '../../assets/erase.svg';
import SquareIcon from '../../assets/square.svg';
import PaintIcon from '../../assets/paint.svg';
import LineIcon from '../../assets/line.svg';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FragmentationForm5'>;

export default function FragmentationForm5() {
  const navigation = useNavigation<NavigationProp>();
  return (
    <SafeAreaView className="flex-1 bg-gray-200 py-20 gap-10 px-4">
      {/* Toolbar */}
      <View className="mx-4 mt-4 bg-rose-50 rounded-lg p-2 flex-row justify-between items-center">
        <TouchableOpacity className="p-2">
          <ZoomIn stroke="#666" width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <ZoomOut stroke="#666" width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <EraseIcon width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <SquareIcon width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <Crop stroke="#666" width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <PaintIcon width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <LineIcon width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <Edit2 stroke="#666" width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* Main Image Area */}
      <View className="mx-4 mt-4 aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <Image
          source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-L99RO9116NbNEWRl9eqjjqxXetA8Up.png' }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Next Button - Positioned at bottom */}
      <View className="flex-1 justify-end px-4 pb-4">
        <TouchableOpacity
          className="w-full bg-green-700 rounded-lg px-4 py-3 items-center"
          onPress={() => navigation.navigate('FragmentationResult')}
        >
          <Text className="text-white font-medium">Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}