// App.tsx
import React from 'react';
import { View } from 'react-native';
import Homepage from './pages/homepage/homepage';
import './global.css'
export default function App() {
  return (
    <View className="flex-1">
      <Homepage />
    </View>
  );
}
