import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import {launchImageLibrary} from 'react-native-image-picker';
import {FormContext} from '../../context/FragmentationContext';
import {API_BASE_URL} from '@env';
import {useToast} from '../../context/ToastContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';

// Navigation prop type
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DiggingTimePage'
>;

const {width} = Dimensions.get('window');

export default function DiggingTimePage() {
  const navigation = useNavigation<NavigationProp>();
  const {saveToDatabase} = useContext(FormContext);
  const {showToast} = useToast();

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

  // Stopwatch ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Format elapsedTime
  useEffect(() => {
    const h = Math.floor(elapsedTime / 3600);
    const m = Math.floor((elapsedTime % 3600) / 60);
    const s = elapsedTime % 60;
    setTime(
      `${h.toString().padStart(2, '0')}:` +
        `${m.toString().padStart(2, '0')}:` +
        `${s.toString().padStart(2, '0')}`,
    );
  }, [elapsedTime]);

  // Pick video
  function handleVideoUpload() {
    launchImageLibrary({mediaType: 'video'}, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Unknown error');
        return;
      }
      if (response.assets && response.assets[0]) {
        setVideoFile(response.assets[0]);
      }
    });
  }

  // Remove video
  function handleRemoveVideo() {
    setVideoFile(null);
  }

  // Save stopwatch time
  function saveStopwatchTime() {
    setSavedTime(time);
    setIsStopwatchOpen(false);
  }

  const resetStopwatch = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  // Save manual time
  function saveManualTime() {
    const hh = hours.padStart(2, '0') || '00';
    const mm = minutes.padStart(2, '0') || '00';
    const ss = seconds.padStart(2, '0') || '00';
    setSavedTime(`${hh}:${mm}:${ss}`);
    setIsManualInputOpen(false);
  }

  // Delete recorded time
  function handleDeleteSavedTime() {
    setSavedTime(null);
  }

  // Validate inputs
  function validateTimeInput(
    text: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) {
    const num = text.replace(/[^0-9]/g, '');
    if (num.length <= 2) setter(num);
  }

  // Final save
  const handleSave = async () => {
    if (!savedTime) {
      showToast('No time recorded', 'error');
      return;
    }
    let uploadedVideoUrl = videoFile?.uploadedUrl ?? null;
    if (videoFile?.uri && !videoFile.uploadedUrl) {
      const fd = new FormData();
      fd.append('file', {
        uri: videoFile.uri.startsWith('content://')
          ? 'file://' + videoFile.uri
          : videoFile.uri,
        type: videoFile.type || 'video/mp4',
        name: videoFile.fileName || 'video.mp4',
      } as any);
      const res = await fetch(`${API_BASE_URL}/api/upload/upload-video`, {
        method: 'POST',
        headers: {'Content-Type': 'multipart/form-data'},
        body: fd,
      });
      const json = await res.json();
      uploadedVideoUrl = json.url;
      setVideoFile({...videoFile, uploadedUrl: uploadedVideoUrl});
    }

    const ok = await saveToDatabase({
      diggingTime: savedTime,
      videoUri: uploadedVideoUrl,
    });
    if (ok) {
      showToast(`Saved digging time: ${savedTime}`, 'success');
      navigation.navigate('FragmentationHistoryDone');
    } else {
      showToast('Failed to save data', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e5e7eb" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Video Upload */}
        <TouchableOpacity style={styles.uploadBox} onPress={handleVideoUpload}>
          {videoFile ? (
            <View style={styles.videoWrapper}>
              <Video
                source={{
                  uri: videoFile.uri.startsWith('content://')
                    ? `file://${videoFile.uri}`
                    : videoFile.uri,
                }}
                style={styles.video}
                resizeMode="cover"
                controls
              />
              <TouchableOpacity
                style={styles.btnTextOnly}
                onPress={handleRemoveVideo}>
                <Text style={styles.textOnly}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Upload video...</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Digging Time Section */}
        <View style={styles.section}>
          <Text style={styles.heading}>Digging Time</Text>

          {savedTime && (
            <View style={styles.recorded}>
              <Text style={styles.textOnly}>{savedTime}</Text>
              <TouchableOpacity
                onPress={handleDeleteSavedTime}
                style={styles.btnTextOnly}>
                <Text style={styles.textOnly}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => setIsStopwatchOpen(true)}>
            <Text style={styles.btnPrimaryText}>Start Stopwatch</Text>
          </TouchableOpacity>

          <Text style={styles.or}>atau</Text>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => setIsManualInputOpen(true)}>
            <Text style={styles.btnSecondaryText}>Add Manual</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btnSave, !savedTime && styles.btnDisabled]}
          disabled={!savedTime}
          onPress={handleSave}>
          <Text style={styles.btnSaveText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Stopwatch Modal */}
      <Modal visible={isStopwatchOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stopwatch</Text>
              <TouchableOpacity
                style={styles.btnTextOnly}
                onPress={() => setIsStopwatchOpen(false)}>
                <Text style={styles.textOnly}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stopwatchTime}>{time}</Text>
            {/* <<< Updated control row >>> */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.btnControl}
                onPress={() => {
                  resetStopwatch();
                }}>
                <Text style={styles.btnControlText}>Reset</Text>
              </TouchableOpacity>

              {!isRunning ? (
                <TouchableOpacity
                  style={styles.btnControl}
                  onPress={() => setIsRunning(true)}>
                  <Text style={styles.btnControlText}>Start</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.btnControl}
                  onPress={() => setIsRunning(false)}>
                  <Text style={styles.btnControlText}>Pause</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={saveStopwatchTime}>
              <Text style={styles.btnPrimaryText}>Save Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Input Modal */}
      <Modal visible={isManualInputOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Input Time</Text>
              <TouchableOpacity
                style={styles.btnTextOnly}
                onPress={() => setIsManualInputOpen(false)}>
                <Text style={styles.textOnly}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.manualRow}>
              {[
                {val: hours, set: setHours, lbl: 'Hrs'},
                {val: minutes, set: setMinutes, lbl: 'Min'},
                {val: seconds, set: setSeconds, lbl: 'Sec'},
              ].map(({val, set, lbl}, i) => (
                <View key={i} style={styles.inputGroup}>
                  <TextInput
                    value={val}
                    onChangeText={t => validateTimeInput(t, set)}
                    placeholder="00"
                    keyboardType="numeric"
                    maxLength={2}
                    style={styles.input}
                    onBlur={() => {
                      if (!val) set('00');
                      else if (val.length === 1) set('0' + val);
                    }}
                  />
                  <Text style={styles.inputLabel}>{lbl}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={saveManualTime}>
              <Text style={styles.btnPrimaryText}>Save Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f3f4f6'},
  scroll: {padding: 16},
  uploadBox: {
    height: 300,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 24,
    overflow: 'hidden',
  },
  placeholder: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  placeholderText: {color: '#9ca3af'},
  videoWrapper: {flex: 1},
  video: {width: '100%', height: '100%'},
  btnTextOnly: {position: 'absolute', top: 8, right: 8, padding: 8},
  textOnly: {fontSize: 14, color: '#dc2626'},

  section: {marginBottom: 24},
  heading: {fontSize: 20, fontWeight: '700', marginBottom: 12},
  recorded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recordedText: {fontSize: 16, fontWeight: '600', marginRight: 12},
  deleteText: {color: '#dc2626', fontSize: 14},

  btnPrimary: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {color: '#10b981', fontSize: 16, fontWeight: '600'},

  or: {textAlign: 'center', color: '#6b7280', marginVertical: 12},

  btnSave: {
    backgroundColor: '#047857',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSaveText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  btnDisabled: {opacity: 0.5},

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {fontSize: 18, fontWeight: '600'},

  stopwatchTime: {fontSize: 48, textAlign: 'center', marginVertical: 16},
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },

  manualRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  inputGroup: {alignItems: 'center'},
  input: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 4,
  },
  inputLabel: {fontSize: 12, color: '#6b7280'},
  btnControl: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  btnControlText: {
    color: '#fff',
    fontWeight: '600',
  },
  btnClose: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
