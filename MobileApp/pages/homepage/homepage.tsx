import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Homepage'>;

const icon1Source = require('../../public/assets/bdm.png');
const icon2Source = require('../../public/assets/kpp.png');

export default function Homepage() {
  const navigation = useNavigation<NavigationProp>();

  const screenWidth = Dimensions.get('window').width;
  const buttonWidth = screenWidth * 0.7;

  return (
    <SafeAreaView
      className="flex-1 bg-gray-200"
      style={{paddingTop: StatusBar.currentHeight}}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      
      {/* Header Container with Padding */}
      <View
        className="flex-row justify-end items-center bg-gray-200 px-4"
        style={{marginTop: 20}}>
        <View
          className="flex-row items-center bg-white rounded-full py-1 px-3"
          style={{minWidth: 150}}>
          <Image
            source={icon1Source}
            style={{width: 60, height: 42}}
            resizeMode="contain"
            resizeMethod="resize"
          />
          <Image
            source={icon2Source}
            style={{width: 62, height: 42}}
            resizeMode="contain"
            resizeMethod="resize"
          />
        </View>
      </View>

      <View className="flex-1 items-center justify-center gap-4">
        <TouchableOpacity
          style={{width: buttonWidth}}
          className="bg-green-500 py-3 rounded-md mb-6 items-center"
          onPress={() =>
            navigation.navigate('AddOrHistory', {type: 'FragmentasiForm1'})
          }>
          <Text className="text-white font-medium text-lg">Fragmentasi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{width: buttonWidth}}
          className="bg-green-500 py-3 rounded-md mb-6 items-center"
          onPress={() =>
            navigation.navigate('AddOrHistory', {type: 'DepthAverage'})
          }>
          <Text className="text-white font-medium text-lg">Depth Average</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{width: buttonWidth}}
          className="bg-green-500 py-3 rounded-md mb-6 items-center"
          onPress={() => console.log('Bantuan pressed')}>
          <Text className="text-white font-medium text-lg">Bantuan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
