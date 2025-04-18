import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import {MapPin, Calendar, BarChart, Edit2} from 'react-native-feather';
import {
  DepthAverageContext,
  DepthAverageData,
} from '../../context/DepthAverageContext';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../types/navigation';
import DepthAverageDetailPopup from './DepthAverageDetailPopup';
import { useToast } from '../../context/ToastContext';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DAHistory'
>;

const EnhancedDepthAverageCard = ({
  data,
  index,
  onEdit,
  onViewFragmentation,
  onPress,
}: {
  data: DepthAverageData;
  index: number;
  onEdit: (id: number) => void;
  onViewFragmentation: (id: number) => void;
  onPress: (data: DepthAverageData) => void;
}) => (
  <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(data)}>
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

          <View className="flex-1 justify-between">
            <View className="space-y-1">
              <View className="px-1">
                <Text className="text-gray-500">
                  Priority:{' '}
                  <Text className="text-gray-700">
                    {data.prioritas || '...........'}
                  </Text>
                </Text>
              </View>

              <View className="px-1">
                <Text className="text-gray-500">
                  Lokasi:{' '}
                  <Text className="text-gray-700">
                    {data.location || '...........'}
                  </Text>
                </Text>
              </View>

              <View className="px-1">
                <Text className="text-gray-500">
                  Tanggal:{' '}
                  <Text className="text-gray-700">
                    {data.date || '...........'}
                  </Text>
                </Text>
              </View>

              <View className="px-1">
                <Text className="text-gray-500">
                  Average:{' '}
                  <Text className="text-gray-700">
                    {data.average || '...........'}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row justify-end mt-3 space-x-2">
          <TouchableOpacity
            className="bg-green-200 px-4 py-2 rounded-full flex-row items-center"
            onPress={e => {
              e.stopPropagation(); // Prevent card click
              onEdit(data.id);
            }}>
            <Edit2 width={16} height={16} color="#047857" />
            <Text className="text-green-800 ml-1 font-medium">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-200 px-4 py-2 rounded-full ml-2"
            onPress={e => {
              e.stopPropagation(); // Prevent card click
              onViewFragmentation(data.id);
            }}>
            <Text className="text-green-800 font-medium">
              Lihat Fragmentasi
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const DAHistory = () => {
  const {loadData, setFormData} = useContext(DepthAverageContext);
  const navigation = useNavigation<NavigationProp>();
  const [data, setData] = useState<DepthAverageData[]>([]);
  const [selectedData, setSelectedData] = useState<DepthAverageData | null>(
    null,
  );
  const [detailVisible, setDetailVisible] = useState(false);
  const {showToast} = useToast();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const loadedData = await loadData();
        setData(loadedData);
      } catch (error) {
        showToast("Failed to fetch data", "error");
        console.error('Failed to load depth average data:', error);
      }
    };

    fetchData();
  }, []);

  // Handle edit button press
  const handleEdit = (id: number) => {
    // find the item in state
    const item = data.find(d => d.id === id);
    if (!item) return;

    // seed the form context with selected record
    setFormData({
      id: item.id,
      imageUri: item.image ?? null,
      jumlahLubang: item.jumlahLubang ?? '',
      lokasi: item.location,
      tanggal: item.date,
      kedalaman: item.kedalaman ?? {},
      average: item.average.replace(' cm', ''), // strip unit
      prioritas: item.prioritas,
      isEdit: true,
      origin: 'DAHistory',
    });

    // go to the DepthAverageUpload (or directly FormDA1 if you prefer)
    navigation.navigate('DepthAverageUpload');
  };

  // Handle view fragmentation button press
  const handleViewFragmentation = (id: number) => {
    const item = data.find(d => d.id === id);
    if (!item) return;

    // Pass priority and tanggal as params
    navigation.navigate('DepthAverageFragmention1', {
      priority: item.prioritas,
      tanggal: item.date, // assuming date is already formatted as "YYYY-MM-DD"
    });
  };

  const handleCardPress = (data: DepthAverageData) => {
    setSelectedData(data);
    setDetailVisible(true);
  };

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
              onEdit={handleEdit}
              onViewFragmentation={handleViewFragmentation}
              onPress={handleCardPress}
            />
          ))
        ) : (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-500 text-lg">No history available</Text>
          </View>
        )}
        <View className="h-6" />
      </ScrollView>

      {/* Detail Popup */}
      <DepthAverageDetailPopup
        visible={detailVisible}
        data={selectedData}
        onClose={() => setDetailVisible(false)}
      />
    </SafeAreaView>
  );
};

export default DAHistory;
