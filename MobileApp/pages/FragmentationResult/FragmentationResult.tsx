import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {Save} from 'react-native-feather';
import {Dimensions} from 'react-native';

const graphData = {
  labels: ['0', '10', '20', '30', '40', '50', '60', '70'],
  datasets: [
    {
      data: [0, 20, 35, 45, 60, 75, 85, 95],
      color: (opacity = 1) => `rgba(72, 187, 120, ${opacity})`, 
      strokeWidth: 2,
    },
  ],
};

const summaryData = [
  {size: '4750.00', percent: '100.00'},
  {size: '4000.00', percent: '100.00'},
  {size: '2000.00', percent: '100.00'},
  {size: '1000.00', percent: '94.24'},
  {size: '750.00', percent: '85.71'},
  {size: '500.00', percent: '70.71'},
  {size: '250.00', percent: '50.49'},
  {size: '125.00', percent: '22.94'},
  {size: '63.00', percent: '17.07'},
  {size: '45.00', percent: '10.24'},
  {size: '31.00', percent: '8.85'},
  {size: '23.00', percent: '6.98'},
  {size: '16.00', percent: '4.69'},
  {size: '11.00', percent: '3.26'},
  {size: '7.800', percent: '2.14'},
  {size: '5.500', percent: '1.65'},
  {size: '4.000', percent: '1.21'},
];

const sizeMetrics = [
  {label: 'P20 Size (μm)', value: '75.24'},
  {label: 'P50 Size (μm)', value: '244.53'},
  {label: 'P80 Size (μm)', value: '480.26'},
  {label: 'Top Size (μm)', value: '771.90'},
];

const FragmentationResult = () => {
  const screenWidth = Dimensions.get('window').width;

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Grafik</Text>
            <LineChart
              data={graphData}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(72, 187, 120, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '2',
                  strokeWidth: '1',
                  stroke: '#48bb78',
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              yAxisLabel=""
              yAxisSuffix=""
            />
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-gray-600">Particle Size (μm)</Text>
              <Text className="text-xs text-gray-600">Percent Finer</Text>
            </View>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Ringkasan
            </Text>
            <View className="border border-gray-200 rounded-lg overflow-hidden">
              <View className="flex-row bg-gray-50 border-b border-gray-200">
                <Text className="flex-1 px-4 py-2 font-medium text-gray-700">
                  Size (μm)
                </Text>
                <Text className="flex-1 px-4 py-2 font-medium text-gray-700">
                  Percent (%)
                </Text>
              </View>
              {summaryData.map((item, index) => (
                <View
                  key={index}
                  className={`flex-row ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}>
                  <Text className="flex-1 px-4 py-2 text-gray-600">
                    {item.size}
                  </Text>
                  <Text className="flex-1 px-4 py-2 text-gray-600">
                    {item.percent}
                  </Text>
                </View>
              ))}
            </View>
            <View className="mt-4 space-y-2">
              {sizeMetrics.map((metric, index) => (
                <View
                  key={index}
                  className="flex-row justify-between bg-gray-50 px-4 py-2 rounded-lg">
                  <Text className="text-gray-600">{metric.label}</Text>
                  <Text className="font-medium text-gray-800">
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="p-4 mb-4">
        <TouchableOpacity
          className="bg-green-700 py-3 rounded-lg shadow-sm flex-row items-center justify-center"
          onPress={() => console.log('Save pressed')}>
          <Save width={20} height={20} color="white" className="mr-4" />
          <Text className="text-white font-bold text-lg ml-2">Simpan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FragmentationResult;
