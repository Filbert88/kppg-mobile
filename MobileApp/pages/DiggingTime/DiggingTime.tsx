import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Video from 'react-native-video';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';

type RootStackParamList = {
  Home: undefined;
  DiggingTime: undefined;
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DiggingTime'
>;

const DiggingTimePage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [videoFile, setVideoFile] = useState<any>(null);
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [time, setTime] = useState('00:00:00');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [savedTime, setSavedTime] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    setTime(
      `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    );
  }, [elapsedTime]);

  const handleVideoUpload = () => {
    launchImageLibrary(
      {
        mediaType: 'video',
        includeBase64: false,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert(
            'Error',
            response.errorMessage || 'Unknown error occurred',
          );
          return;
        }
        if (response.assets && response.assets[0]) {
          setVideoFile(response.assets[0]);
        }
      },
    );
  };

  const handleRemoveVideo = () => setVideoFile(null);
  const startStopwatch = () => setIsRunning(true);
  const stopStopwatch = () => setIsRunning(false);
  const resetStopwatch = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };
  const resumeStopwatch = () => setIsRunning(true);
  const saveStopwatchTime = () => {
    setSavedTime(time);
    setIsStopwatchOpen(false);
  };

  const saveManualTime = () => {
    const h = hours.padStart(2, '0') || '00';
    const m = minutes.padStart(2, '0') || '00';
    const s = seconds.padStart(2, '0') || '00';
    setSavedTime(`${h}:${m}:${s}`);
    setIsManualInputOpen(false);
  };

  const handleDeleteSavedTime = () => setSavedTime(null);

  const handleSave = () => {
    if (savedTime) {
      Alert.alert('Success', `Saved digging time: ${savedTime}`);
    } else {
      Alert.alert('Error', 'No time recorded');
    }
  };

  const validateTimeInput = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 2) {
      setter(numericValue);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#e5e7eb" />
      <ScrollView className="flex-1 px-6 pt-6">
        <TouchableOpacity
          className="border-2 border-gray-300 border-dashed rounded-lg p-6 flex items-center justify-center bg-white mb-6 h-48"
          onPress={handleVideoUpload}>
          {videoFile ? (
            <View className="w-full h-full relative">
              <Video
                source={{uri: videoFile.uri}}
                className="w-full h-full rounded"
                resizeMode="cover"
                controls
              />
              <TouchableOpacity
                onPress={e => {
                  e.stopPropagation();
                  handleRemoveVideo();
                }}
                className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
                <Icon name="trash-2" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center">
              <View className="flex-row items-center mb-2">
                <Icon name="video" size={24} color="#9ca3af" />
                <Icon name="plus" size={20} color="#9ca3af" />
              </View>
              <Text className="text-gray-400 text-center">Upload video...</Text>
            </View>
          )}
        </TouchableOpacity>

        <View className="mb-6">
          <Text className="text-xl font-bold mb-4 text-black">
            Digging Time
          </Text>

          {savedTime && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Icon name="check-circle" size={20} color="#10b981" />
                <View className="ml-3">
                  <Text className="text-green-800 font-medium">
                    Time recorded
                  </Text>
                  <Text className="text-green-700 text-xl font-bold">
                    {savedTime}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleDeleteSavedTime}>
                <Icon name="trash-2" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            className="w-full bg-emerald-500 py-3 px-4 rounded-lg mb-2 flex-row items-center justify-center"
            onPress={() => setIsStopwatchOpen(true)}>
            <Icon name="clock" size={18} color="#ffffff" />
            <Text className="text-white font-medium ml-2">Mulai Stopwatch</Text>
          </TouchableOpacity>

          <View className="items-center my-2">
            <Text className="text-gray-500">atau</Text>
          </View>

          <TouchableOpacity
            className="w-full bg-white py-3 px-4 rounded-lg border border-gray-300 flex-row items-center justify-center"
            onPress={() => setIsManualInputOpen(true)}>
            <Icon name="plus" size={18} color="#374151" />
            <Text className="text-gray-700 font-medium ml-2">
              Tambah Manual
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mt-6 mb-6">
          <TouchableOpacity
            className={`bg-green-700 py-3 px-4 rounded-md ${
              !savedTime ? 'opacity-50' : ''
            }`}
            onPress={handleSave}
            disabled={!savedTime}>
            <Text className="text-white font-bold">Simpan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Stopwatch Modal */}
      <Modal
        visible={isStopwatchOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStopwatchOpen(false)}>
        <View className="flex-1 bg-black bg-opacity-50 items-center justify-center px-4">
          <View className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-black">Stopwatch</Text>
              <TouchableOpacity onPress={() => setIsStopwatchOpen(false)}>
                <Icon name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View className="p-6">
              <View className="items-center mb-6">
                <View className="bg-gray-100 py-6 rounded-lg w-full">
                  <Text className="text-5xl font-bold text-center text-black tracking-wider">
                    {time}
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap mb-6">
                <TouchableOpacity
                  className="bg-gray-100 py-3 px-4 rounded-lg flex-row items-center justify-center mr-3 flex-1"
                  onPress={resetStopwatch}>
                  <Icon name="rotate-ccw" size={16} color="#374151" />
                  <Text className="text-gray-700 font-medium ml-2">Reset</Text>
                </TouchableOpacity>
                {!isRunning ? (
                  <TouchableOpacity
                    className="bg-green-500 py-3 px-4 rounded-lg flex-row items-center justify-center flex-1"
                    onPress={startStopwatch}>
                    <Icon name="play" size={16} color="#ffffff" />
                    <Text className="text-white font-medium ml-2">Start</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    className="bg-red-500 py-3 px-4 rounded-lg flex-row items-center justify-center flex-1"
                    onPress={stopStopwatch}>
                    <Icon name="square" size={16} color="#ffffff" />
                    <Text className="text-white font-medium ml-2">Stop</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!isRunning && elapsedTime > 0 && (
                <TouchableOpacity
                  className="bg-green-500 py-3 px-4 rounded-lg flex-row items-center justify-center mb-6"
                  onPress={resumeStopwatch}>
                  <Icon name="play" size={16} color="#ffffff" />
                  <Text className="text-white font-medium ml-2">Resume</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="border border-gray-300 py-3 px-4 rounded-lg flex-row items-center justify-center"
                onPress={saveStopwatchTime}>
                <Icon name="plus" size={16} color="#374151" />
                <Text className="text-gray-700 font-medium ml-2">
                  Simpan Waktu
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Time Input Modal */}
      <Modal
        visible={isManualInputOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsManualInputOpen(false)}>
        <View className="flex-1 bg-black bg-opacity-50 items-center justify-center px-4">
          <View className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-black">Input waktu</Text>
              <TouchableOpacity onPress={() => setIsManualInputOpen(false)}>
                <Icon name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View className="p-6">
              <View className="flex-row justify-center items-center space-x-2 mb-8">
                {[
                  {value: hours, setter: setHours, label: 'Hours'},
                  {value: minutes, setter: setMinutes, label: 'Minutes'},
                  {value: seconds, setter: setSeconds, label: 'Seconds'},
                ].map(({value, setter, label}, i, arr) => (
                  <React.Fragment key={i}>
                    <View className="items-center">
                      <TextInput
                        value={value}
                        onChangeText={text => validateTimeInput(text, setter)}
                        placeholder="00"
                        keyboardType="numeric"
                        maxLength={2}
                        onBlur={() => {
                          if (value.length === 0) setter('00');
                          else if (value.length === 1) setter('0' + value);
                        }}
                        onFocus={e => {
                          if (Platform.OS === 'web') {
                            // @ts-ignore
                            e.target.select();
                          }
                        }}
                        className="w-16 h-16 text-center text-2xl border border-gray-300 rounded-lg"
                        style={{fontFamily: 'monospace'}}
                      />
                      <Text className="text-xs text-gray-500 mt-1 text-center">
                        {label}
                      </Text>
                    </View>
                    {i < arr.length - 1 && (
                      <Text className="text-3xl font-bold text-gray-400">
                        :
                      </Text>
                    )}
                  </React.Fragment>
                ))}
              </View>
              <TouchableOpacity
                className="border border-gray-300 py-3 px-4 rounded-lg flex-row items-center justify-center"
                onPress={saveManualTime}>
                <Icon name="plus" size={16} color="#374151" />
                <Text className="text-gray-700 font-medium ml-2">
                  Simpan Waktu
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DiggingTimePage;