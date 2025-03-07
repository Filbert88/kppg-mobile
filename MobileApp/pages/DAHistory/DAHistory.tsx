import React from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native';
import { MapPin, Calendar, BarChart } from 'react-native-feather';

// Type for our depth average data
type DepthAverageData = {
  id: string;
  location: string;
  date: string;
  average: string;
  image?: string;
};

// Sample data - replace with your actual data
const sampleData: DepthAverageData[] = [
  {
    id: '1',
    location: 'Location A',
    date: '2024-03-06',
    average: '22.5 cm',
  },
  {
    id: '2',
    location: 'Location B',
    date: '2024-03-06',
    average: '24.0 cm',
  },
];

const EnhancedDepthAverageCard = ({ data, index }: { data: DepthAverageData; index: number }) => {
  return (
    <View className="bg-rose-50 rounded-xl overflow-hidden shadow-sm border border-rose-100 mb-4">
      <View className="p-4">
        <Text className="text-xl font-bold text-black mb-3">
          Depth Average {index + 1}
        </Text>
        
        <View className="flex-row">
          {/* Image Section */}
          <View className="w-32 h-32 bg-white rounded-lg overflow-hidden mr-4 border border-gray-200">
            {data.image ? (
              <Image
                source={{ uri: data.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-50">
                <MapPin width={24} height={24} color="#9ca3af" />
              </View>
            )}
          </View>

          {/* Content Section */}
          <View className="flex-1 justify-center">
            <View className="space-y-2">
              <View className=" rounded-lg px-3 py-2">
                <View className="flex-row items-center">
                  <MapPin width={16} height={16} color="#6b7280" className="mr-2" />
                  <Text className="text-gray-600">
                    Lokasi: <Text className="font-medium text-gray-800">{data.location}</Text>
                  </Text>
                </View>
              </View>
              
              <View className=" rounded-lg px-3 py-2">
                <View className="flex-row items-center">
                  <Calendar width={16} height={16} color="#6b7280" className="mr-2" />
                  <Text className="text-gray-600">
                    Tanggal: <Text className="font-medium text-gray-800">{data.date}</Text>
                  </Text>
                </View>
              </View>
              
              <View className=" rounded-lg px-3 py-2">
                <View className="flex-row items-center">
                  <BarChart width={16} height={16} color="#6b7280" className="mr-2" />
                  <Text className="text-gray-600">
                    Average: <Text className="font-medium text-gray-800">{data.average}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const DAHistory = () => {
  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      
      <ScrollView className="flex-1 px-4 pt-6">
        {sampleData.map((item, index) => (
          <EnhancedDepthAverageCard 
            key={item.id} 
            data={item} 
            index={index} 
          />
        ))}
        
        {/* Add some padding at the bottom for better scrolling */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DAHistory;