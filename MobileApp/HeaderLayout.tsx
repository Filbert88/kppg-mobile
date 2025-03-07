import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {ArrowLeft} from 'react-native-feather';

interface HeaderLayoutProps {
  onBackPress?: () => void;
  icon1Source?: any;
  icon2Source?: any;
}

const HeaderLayout: React.FC<HeaderLayoutProps> = ({
  onBackPress,
  icon1Source = require('./public/assets/bdm.png'),
  icon2Source = require('./public/assets/kpp.png'),
}) => {
  return (
    <SafeAreaView style={{paddingTop: StatusBar.currentHeight}}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#D1D5DB"
        translucent
      />
      <View className="flex-row justify-between items-center px-6 py-4">
        {onBackPress && (
          <TouchableOpacity
            className="bg-green-700 rounded-lg shadow-sm flex-row items-center px-3 py-3"
            onPress={onBackPress}>
            <ArrowLeft width={24} height={24} color="white" />
            <Text className="text-white font-semibold ml-2 text-lg">Back</Text>
          </TouchableOpacity>
        )}

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
    </SafeAreaView>
  );
};

export default HeaderLayout;
