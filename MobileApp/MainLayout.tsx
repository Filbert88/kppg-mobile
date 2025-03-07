// MainLayout.tsx
import React, { ReactNode } from 'react';
import { SafeAreaView, View } from 'react-native';
import HeaderLayout from './HeaderLayout'; 

const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#D9D9D9' }}>
      <HeaderLayout
        onBackPress={() => console.log('Back pressed')}
        icon1Source={require('./public/assets/bdm.png')}
        icon2Source={require('./public/assets/kpp.png')}
      />
      <View style={{ flex: 1 }} className='bg-[#D9D9D9]'>
        {children}
      </View>
    </SafeAreaView>
  );
};

export default MainLayout;
