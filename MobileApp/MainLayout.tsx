import React, {ReactNode} from 'react';
import {SafeAreaView, View} from 'react-native';
import HeaderLayout from './HeaderLayout';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
const MainLayout: React.FC<{
  children: ReactNode;
  navigation: NativeStackNavigationProp<any>;
}> = ({children, navigation}) => {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#D9D9D9'}}>
      <HeaderLayout
        onBackPress={() => navigation.goBack()}
        icon1Source={require('./public/assets/bdm.png')}
        icon2Source={require('./public/assets/kpp.png')}
      />
      <View style={{flex: 1}} className="bg-[#D9D9D9]">
        {children}
      </View>
    </SafeAreaView>
  );
};

export default MainLayout;
