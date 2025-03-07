import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { ChevronDown, ChevronUp, MapPin, Calendar, Camera, Grid, Plus } from 'react-native-feather';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// Types for our data
type FragmentationData = {
  id: string;
  title: string;
  location: string;
  date: string;
  scale: string;
  image?: string;
  graphData: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  summaryData: {
    size: string;
    percent: string;
  }[];
};

// Sample data
const sampleData: FragmentationData = {
  id: '1',
  title: 'Fragmentasi Batuan 1',
  location: 'Site A-123',
  date: '2024-03-07',
  scale: '1:100',
  graphData: {
    labels: ["0", "20", "40", "60", "80", "100"],
    datasets: [{
      data: [0, 20, 35, 50, 75, 95]
    }]
  },
  summaryData: [
    { size: "4750.00", percent: "100.00" },
    { size: "2000.00", percent: "94.24" },
    { size: "1000.00", percent: "85.71" },
    // Add more data as needed
  ]
};

const FragmentationCard = ({ data }: { data: FragmentationData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth * 0.4;

  return (
    <View className=" rounded-xl overflow-hidden shadow-sm border border-rose-100 mb-4 bg-[#FAF2F2]">
    
      <Text className="text-lg font-bold text-gray-800 p-4">
        {data.title}
      </Text>

      <View className="px-4 pb-4">
     
        <View className="flex-row">
          {/* Left Column - Images and Graph */}
          <View className="flex-1 gap-4">
            {/* Rock Image */}
            <View className="bg-white rounded-lg overflow-hidden border border-gray-200">
              {data.image ? (
                <Image
                  source={{ uri: data.image }}
                  className="w-full h-40"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-40 items-center justify-center bg-gray-50">
                  <Camera width={24} height={24} color="#9ca3af" />
                  <Text className="text-sm text-gray-400 mt-2">No image</Text>
                </View>
              )}
            </View>

            {/* Graph */}
            <View className="bg-white rounded-lg p-2 border border-gray-200">
              <Text className="text-sm font-medium text-gray-700 mb-2">Grafik</Text>
              <LineChart
                data={data.graphData}
                width={chartWidth}
                height={100}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(72, 187, 120, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 8,
                  },
                  propsForDots: {
                    r: '1',
                    strokeWidth: '1',
                    stroke: '#48bb78',
                  },
                }}
                bezier
                style={{
                  borderRadius: 8,
                }}
                withVerticalLabels={false}
                withHorizontalLabels={false}
              />
            </View>
          </View>

          {/* Right Column - Details */}
          <View className="flex-1 pl-4 gap-3">
            <View className="gap-2">
              <View className="flex-row items-center">
                <MapPin width={16} height={16} color="#6b7280" className="mr-2" />
                <Text className="text-gray-600">
                  Lokasi: <Text className="font-medium">{data.location}</Text>
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Calendar width={16} height={16} color="#6b7280" className="mr-2" />
                <Text className="text-gray-600">
                  Tanggal: <Text className="font-medium">{data.date}</Text>
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Grid width={16} height={16} color="#6b7280" className="mr-2" />
                <Text className="text-gray-600">
                  Skala: <Text className="font-medium">{data.scale}</Text>
                </Text>
              </View>
            </View>

            {/* Summary Toggle Button */}
            <TouchableOpacity
              className="bg-white/80 rounded-lg px-4 py-2 flex-row items-center justify-between"
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text className="font-medium text-gray-700">Lihat Ringkasan</Text>
              {isExpanded ? (
                <ChevronUp width={20} height={20} color="#4b5563" />
              ) : (
                <ChevronDown width={20} height={20} color="#4b5563" />
              )}
            </TouchableOpacity>

            {/* Add Photo Button */}
            <TouchableOpacity
              className="bg-emerald-100 rounded-lg px-4 py-2 flex-row items-center justify-center"
              onPress={() => console.log('Add photo')}
            >
              <Plus width={18} height={18} color="#047857" />
              <Text className="ml-2 font-medium text-emerald-700">Tambah Foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Collapsible Summary Section */}
        {isExpanded && (
          <View className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
            <Text className="font-medium text-gray-800 mb-2">Ringkasan</Text>
            <View className="gap-1">
              {data.summaryData.map((item, index) => (
                <View key={index} className="flex-row justify-between py-1">
                  <Text className="text-gray-600">{item.size} μm</Text>
                  <Text className="text-gray-800">{item.percent}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// Main component to display list of cards
const FragmentationHistory = () => {
  // In a real app, you would fetch this data
  const fragmentationData = [sampleData];

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 p-4">
        {fragmentationData.map((data) => (
          <FragmentationCard key={data.id} data={data} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FragmentationHistory;