import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';

export default function App() {
  // You can use this for dark mode support if needed
  const { colorScheme } = useColorScheme();

  // Get screen dimensions for responsive sizing
  const screenWidth = Dimensions.get('window').width;
  const buttonWidth = screenWidth * 0.7; // 70% of screen width

  return (
    <SafeAreaView className="flex-1 bg-gray-200">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />


      {/* Main Menu Buttons - Centered in the screen */}
      <View className="flex-1 items-center justify-center gap-4">
        {/* Fragmentasi Button */}
        <TouchableOpacity
          style={{ width: buttonWidth }}
          className="bg-green-500 py-3 rounded-md mb-6 items-center"
          onPress={() => console.log('Fragmentasi pressed')}
        >
          <Text className="text-white font-medium text-lg">Fragmentasi</Text>
        </TouchableOpacity>

        {/* Depth Average Button */}
        <TouchableOpacity
          style={{ width: buttonWidth }}
          className="bg-green-500 py-3 rounded-md mb-6 items-center"
          onPress={() => console.log('Depth Average pressed')}
        >
          <Text className="text-white font-medium text-lg">Depth Average</Text>
        </TouchableOpacity>

        {/* Bantuan Button */}
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