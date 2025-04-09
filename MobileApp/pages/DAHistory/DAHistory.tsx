import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import {MapPin, Calendar, BarChart} from 'react-native-feather';
import {DepthAverageContext, DepthAverageData} from '../../context/DepthAverageContext';

const EnhancedDepthAverageCard = ({
  data,
  index,
}: {
  data: DepthAverageData;
  index: number;
}) => (
  <View className="bg-rose-50 rounded-xl overflow-hidden shadow-sm border border-rose-100 mb-4">
    <View className="p-4">
      <Text className="text-xl font-bold text-black mb-3">
        Depth Average {index + 1}
      </Text>
      <View className="flex-row">
        <View className="w-32 h-32 bg-white rounded-lg overflow-hidden mr-4 border border-gray-200">
          {data.image ? (
            <Image
              source={{uri: data.image}}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-gray-50">
              <Image
                source={require('../../public/assets/Image.png')}
                className="w-24 h-24"
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        <View className="flex-1 justify-center">
          <View className="space-y-2">
            <View className="rounded-lg px-3 py-2">
              <View className="flex-row items-center">
                <MapPin width={16} height={16} color="#6b7280" />
                <Text className="text-gray-600 ml-2">
                  Lokasi:{' '}
                  <Text className="font-medium text-gray-800">
                    {data.location}
                  </Text>
                </Text>
              </View>
            </View>

            <View className="rounded-lg px-3 py-2">
              <View className="flex-row items-center">
                <Calendar width={16} height={16} color="#6b7280" />
                <Text className="text-gray-600 ml-2">
                  Tanggal:{' '}
                  <Text className="font-medium text-gray-800">{data.date}</Text>
                </Text>
              </View>
            </View>

            <View className="rounded-lg px-3 py-2">
              <View className="flex-row items-center">
                <BarChart width={16} height={16} color="#6b7280" />
                <Text className="text-gray-600 ml-2">
                  Average:{' '}
                  <Text className="font-medium text-gray-800">
                    {data.average}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  </View>
);

const DAHistory = () => {
  const {loadData} = useContext(DepthAverageContext);
  const [data, setData] = useState<DepthAverageData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loadedData = await loadData();
        console.log('Loaded Data from SQLite:', loadedData);
        setData(loadedData);
      } catch (error) {
        console.error('Failed to load depth average data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <ScrollView className="flex-1 px-4 pt-6">
        {data.length > 0 ? (
          data.map((item, index) => (
            <EnhancedDepthAverageCard
              key={`depth-${item.id}`}
              data={item}
              index={index}
            />
          ))
        ) : (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-500 text-lg">No history available</Text>
          </View>
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DAHistory;
