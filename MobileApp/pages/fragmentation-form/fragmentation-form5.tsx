// FragmentationForm5.tsx
import React, {useContext, useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import {FormContext} from '../../context/FragmentationContext';
import EditingApp from './EditingApp';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/navigation';
import { useToast } from '../../context/ToastContext';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FragmentationForm5'
>;

export default function FragmentationForm5() {
  const { showToast } = useToast();
  const navigation = useNavigation<NavigationProp>();
  const {formData, updateForm, resetForm} = useContext(FormContext);

  // formData.fragmentedResults: Array<{ imageData: string; conversionFactor: number }>
  const images = formData.fragmentedResults;

  // track which index is open for editing
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // Animation values
  const spinValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(1);
  const progressAnim = new Animated.Value(0);

  // Start spinning animation
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 700,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Update progress animation
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      spinValue.setValue(0);
      scaleValue.setValue(1);
      progressAnim.setValue(0);
    }
  }, [isLoading, spinValue, scaleValue, progress, progressAnim]);

  // Create the spin interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Progress width interpolation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const isEditing = editingIndex >= 0;
  const isFormValid = images.length > 0;

  // When user finishes editing an image
  const handleSaveEdited = (newBase64: string) => {
    if (editingIndex < 0) return;
    // update just that one imageData, keep its conversionFactor
    const updated = images.map((item, idx) =>
      idx === editingIndex ? {...item, imageData: newBase64} : item,
    );
    updateForm({fragmentedResults: updated});
    setEditingIndex(-1);
  };

  // Called when user taps Next
  const handleNext = async () => {
    if (!isFormValid) return;

    // Start loading state
    setIsLoading(true);
    setProgress(0);
    setLoadingStep('Preparing images...');

    try {
      // 1) Upload all edited images and collect URLs
      const uploadUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setLoadingStep(`Uploading image ${i + 1} of ${images.length}...`);
        setProgress(Math.floor((i / images.length) * 50)); // First 50% for uploads

        const {imageData} = images[i];
        const file = {
          uri: imageData,
          name: `frag_${i}.png`,
          type: 'image/png',
        } as any;

        const upForm = new FormData();
        upForm.append('file', file);

        const upRes = await fetch('http://10.0.2.2:5180/api/Upload/upload', {
          method: 'POST',
          body: upForm,
        });
        if (!upRes.ok) throw new Error(`Upload failed: ${upRes.status}`);
        const upBody = await upRes.json();
        uploadUrls.push(upBody.url);
      }

      setLoadingStep('Processing uploaded images...');
      setProgress(50);

      // store them if you need later
      const withRemote = images.map((item, i) => ({
        ...item,
        imageData: uploadUrls[i], // ← now points at your hosted image
      }));
      updateForm({fragmentedResults: withRemote});

      // 2) Call fragmentation-analysis with all files + params
      setLoadingStep('Running fragmentation analysis...');
      setProgress(75);

      const faForm = new FormData();
      uploadUrls.forEach((url, i) => {
        faForm.append('files', {
          uri: url,
          name: `final_${i}.png`,
          type: 'image/png',
        } as any);
      });

      // compute K = Q/V
      const Q = parseFloat(formData.ammoniumNitrate) || 0;
      const V = parseFloat(formData.volumeBlasting) || 1;
      const K = Q / V;

      faForm.append('A', '5.955');
      faForm.append('K', K.toString());
      faForm.append('Q', formData.ammoniumNitrate);
      faForm.append('E', '100');
      faForm.append('n', '1.851');

      // pick any one conversionFactor (or extend your API to accept an array)
      const conversion = images[0].conversionFactor;
      faForm.append('conversion', conversion.toString());

      const faRes = await fetch(
        'http://10.0.2.2:5180/api/Fragmentation/fragmentation-analysis',
        {
          method: 'POST',
          body: faForm,
        },
      );
      if (!faRes.ok) throw new Error(`Analysis failed: ${faRes.status}`);
      const faJson = await faRes.json();

      // 3) save analysis results into context
      setLoadingStep('Finalizing results...');
      setProgress(95);

      updateForm({finalAnalysisResults: faJson});

      // Small delay to show completion
      setTimeout(() => {
        setProgress(100);
        setLoadingStep('Complete!');

        // Reset loading state
        setIsLoading(false);
        showToast('Fragmentation completed successfully!', 'success');
        // 4) navigate forward
        navigation.navigate('FragmentationResult');
      }, 500);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      showToast(
        err instanceof Error ? err.message : 'Something went wrong during processing.',
        'error'
      );
    }
  };

  const handleCancelEdit = () => {
    resetForm(); 
    if (formData.origin === 'FragmentationHistoryIncomplete') {
      navigation.navigate('FragmentationHistoryIncomplete'); // Go back to FragmentationHistoryIncomplete
    } else {
      navigation.navigate('FragmentationHistoryDone'); // Go back to FragmentationHistory
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {images.map((item, idx) => (
          <View key={idx} style={styles.imageWrapper}>
            <Image
              source={{uri: item.imageData}}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.caption}>
              Conversion: {item.conversionFactor.toFixed(3)}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingIndex(idx)}>
              <Text style={{color: '#fff'}}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        {formData.isEdit && (
          <TouchableOpacity
            className="px-4 py-5 bg-red-200 rounded-lg mb-2"
            onPress={handleCancelEdit}>
            <Text className="text-red-800 font-medium text-lg text-center">Cancel Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={!isFormValid || isLoading}
          onPress={handleNext}
          style={[
            styles.nextButton,
            (!isFormValid || isLoading) && {
              backgroundColor: 'gray',
              opacity: 0.6,
            },
          ]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Animated.View
                style={[
                  styles.loadingIconContainer,
                  {
                    transform: [{rotate: spin}, {scale: scaleValue}],
                  },
                ]}>
                <ActivityIndicator size="small" color="#fff" />
              </Animated.View>
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={isEditing} animationType="slide">
        {isEditing && (
          <EditingApp
            initialImage={images[editingIndex].imageData}
            onClose={(resultUri: string | null) => {
              if (resultUri) handleSaveEdited(resultUri);
              else setEditingIndex(-1);
            }}
          />
        )}
      </Modal>

      {/* Full screen loading overlay with progress */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Animated.View
              style={{
                transform: [{rotate: spin}, {scale: scaleValue}],
              }}>
              <ActivityIndicator size="large" color="green" />
            </Animated.View>
            <Text style={styles.loadingCardTitle}>Analyzing Fragmentation</Text>
            <Text style={styles.loadingCardStep}>{loadingStep}</Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <Animated.View
                style={[styles.progressBar, {width: progressWidth}]}
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#fff'},
  scrollContent: {padding: 16},
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginBottom: 20,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  caption: {
    marginTop: 4,
    fontSize: 14,
    color: '#333',
  },
  editButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: 'green',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    marginRight: 8,
  },
  loadingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  loadingCardStep: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'green',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
});
