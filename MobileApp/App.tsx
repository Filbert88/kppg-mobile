// App.tsx
import React from 'react';
import {View} from 'react-native';
import Homepage from './pages/homepage/homepage';
import './global.css';
import AddOrHistory from './pages/AddOrHistory/AddOrHistory';
import MainLayout from './MainLayout';
import DepthAverageUpload from './pages/DepthAverageUpload/DepthAverageUpload';
import FormDA1 from './pages/FormDA1/FormDA1';
import FormDA2 from './pages/FormDA2/FormDA2';
import FormDA3 from './pages/FormDA3/FormDA3';
import DAHistory from './pages/DAHistory/DAHistory';
import FragmentationResult from './pages/FragmentationResult/FragmentationResult';
import FragmentationHistory from './pages/FragmentationHistory/FragmentationHistory';
export default function App() {
  return (
    <MainLayout>
      <View className="flex-1">
        {/* <AddOrHistory /> */}
        {/* <DepthAverageUpload /> */}
        {/* <FormDA1 /> */}
        {/* <FormDA2 /> */}
        {/* <FormDA3 /> */}
        {/* <DAHistory /> */}
        {/* <FragmentationResult /> */}
        <FragmentationHistory />
      </View>
    </MainLayout>
  );
}
