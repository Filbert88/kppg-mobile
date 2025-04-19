import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {MapPin, Calendar, BarChart, Edit2} from 'react-native-feather';
import {
  DepthAverageContext,
  DepthAverageData,
} from '../../context/DepthAverageContext';
import DepthAverageDetailPopup from '../DAHistory/DepthAverageDetailPopup';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import { API_BASE_URL } from '@env';
import { useToast } from '../../context/ToastContext';

// Reusing the same card component from DAHistory
const EnhancedDepthAverageCard = ({
  data,
  index,
  onEdit,
  onPress,
}: {
  data: DepthAverageData;
  index: number;
  onEdit: (id: number) => void;
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
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentionDepthAverage'
>;

type NavigationProps = RouteProp<RootStackParamList, 'FragmentionDepthAverage'>;

const FragmentationDepthAverage = () => {
  const route = useRoute<NavigationProps>();
  const {priority, tanggal} = route.params;
  const {loadData, setFormData} = useContext(DepthAverageContext);
  const navigation = useNavigation<NavigationProp>();
  const [data, setData] = useState<DepthAverageData[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DepthAverageData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const {showToast} = useToast()
  console.log(tanggal);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // You can dynamically set this based on your state or logic
        const formattedTanggalValue = formatDate(tanggal);
        console.log('Formatted Tanggal:', formattedTanggalValue); // YYYY-MM-DD format
        const res = await fetch(
          `${API_BASE_URL}/api/DepthAverage/today?priority=${priority}&tanggal=${formattedTanggalValue}`,
        );
        console.log(res);
        if (!res.ok) throw new Error('Failed to fetch depth average data');
        const data = await res.json();
        const dataArray = Array.isArray(data) ? data : [data];
        console.log('Fetched data:', data);
        const mappedData = dataArray.map((item: any) => ({
          id: item.id,
          location: item.lokasi,
          date: item.tanggal.split('T')[0], // Format to YYYY-MM-DD
          average: `${item.average} cm`,
          image: item.imageUri,
          prioritas: item.prioritas,
          kedalaman: item.kedalaman,
          jumlahLubang: item.jumlahLubang,
        }));
        setData(mappedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [priority]);

  const formatDate = (tanggal: string) => {
    if (!tanggal) return '';

    // Parse the date and set the time to 00:00:00 (avoid time zone conversion)
    const date = new Date(tanggal);
    date.setHours(0, 0, 0, 0); // Set time to 00:00:00

    // Get the formatted date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

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
      isEdit: true
    });

    // go to the DepthAverageUpload (or directly FormDA1 if you prefer)
    navigation.navigate('DepthAverageUpload');
  };

  const handleCardPress = (item: DepthAverageData) => {
    setSelectedRecord(item);
    setPopupVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
    setSelectedRecord(null);
  };

  // Render the loading spinner when data is being fetched
  if (loading) {
    return (
      <SafeAreaView>
        <ActivityIndicator
          size="large"
          color="#00613B"
          style={{marginTop: 100}}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <ScrollView className="flex-1 px-4 pt-6">
        {/* Title at the top of the page */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 text-center">
            Fragmentation-form 1
          </Text>
        </View>

        {data.length > 0 ? (
          data.map((item, index) => (
            <EnhancedDepthAverageCard
              key={`depth-${item.id}`}
              data={item}
              index={index}
              onEdit={handleEdit}
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

      <DepthAverageDetailPopup
        visible={popupVisible}
        data={selectedRecord}
        onClose={handleClosePopup}
      />
    </SafeAreaView>
  );
};

export default FragmentationDepthAverage;
