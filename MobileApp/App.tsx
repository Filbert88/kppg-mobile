import React, {useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types/navigation';
import ScreenWrapper from './components/ScreenWrapper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Homepage from './pages/homepage/homepage';
import AddOrHistory from './pages/AddOrHistory/AddOrHistory';
import DepthAverageUpload from './pages/DepthAverageUpload/DepthAverageUpload';
import FormDA1 from './pages/FormDA1/FormDA1';
import FormDA2 from './pages/FormDA2/FormDA2';
import FormDA3 from './pages/FormDA3/FormDA3';
import DAHistory from './pages/DAHistory/DAHistory';
import FragmentationHistory from './pages/FragmentationHistory/FragmentationHistory';
import FragmentationForm1 from './pages/fragmentation-form/fragmentation-form1';
import FragmentationForm2 from './pages/fragmentation-form/fragmentation-form2';
import FragmentationForm3 from './pages/fragmentation-form/fragmentation-form3';
import FragmentationForm4 from './pages/fragmentation-form/fragmentation-form4';
import FragmentationForm5 from './pages/fragmentation-form/fragmentation-form5';
import FragmentationResult from './pages/FragmentationResult/FragmentationResult';
import {DepthAverageProvider} from './context/DepthAverageContext';
import NetInfo from '@react-native-community/netinfo';
import {syncLocalDataWithBackend} from './database/services/syncService';
import './global.css';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  const triggerSync = () => {
    
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(() => {
      syncLocalDataWithBackend();
    }, 3000);
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Connection type:', state.type);
      console.log('Is connected?', state.isConnected);
      if (state.isConnected) {
        console.log('Device is online. Initiating sync...');
        triggerSync();
      } else {
        console.log('Device is offline.');
      }
    });

    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
      unsubscribe();
    };
  }, []);
  return (
    <NavigationContainer>
      <DepthAverageProvider>
        <Stack.Navigator
          initialRouteName="Homepage"
          screenOptions={{headerShown: false}}>
          <Stack.Screen name="Homepage" component={Homepage} />

          <Stack.Screen name="AddOrHistory">
            {(
              props: NativeStackScreenProps<RootStackParamList, 'AddOrHistory'>,
            ) => <ScreenWrapper component={AddOrHistory} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="DepthAverageUpload">
            {(
              props: NativeStackScreenProps<
                RootStackParamList,
                'DepthAverageUpload'
              >,
            ) => <ScreenWrapper component={DepthAverageUpload} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="FormDA1">
            {(props: NativeStackScreenProps<RootStackParamList, 'FormDA1'>) => (
              <ScreenWrapper component={FormDA1} {...props} />
            )}
          </Stack.Screen>

          <Stack.Screen name="FormDA2">
            {(props: NativeStackScreenProps<RootStackParamList, 'FormDA2'>) => (
              <ScreenWrapper component={FormDA2} {...props} />
            )}
          </Stack.Screen>

          <Stack.Screen name="FormDA3">
            {(props: NativeStackScreenProps<RootStackParamList, 'FormDA3'>) => (
              <ScreenWrapper component={FormDA3} {...props} />
            )}
          </Stack.Screen>

          <Stack.Screen name="DAHistory">
            {(
              props: NativeStackScreenProps<RootStackParamList, 'DAHistory'>,
            ) => <ScreenWrapper component={DAHistory} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="FragmentationForm1">
            {(
              props: NativeStackScreenProps<
                RootStackParamList,
                'FragmentationForm1'
              >,
            ) => <ScreenWrapper component={FragmentationForm1} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="FragmentationForm2">
            {(
              props: NativeStackScreenProps<
                RootStackParamList,
                'FragmentationForm2'
              >,
            ) => <ScreenWrapper component={FragmentationForm2} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="FragmentationForm3">
            {(
              props: NativeStackScreenProps<
                RootStackParamList,
                'FragmentationForm3'
              >,
            ) => <ScreenWrapper component={FragmentationForm3} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="FragmentationForm4">
            {(
              props: NativeStackScreenProps<
                RootStackParamList,
                'FragmentationForm4'
              >,
            ) => <ScreenWrapper component={FragmentationForm4} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="FragmentationForm5">
            {(
              props: NativeStackScreenProps<
                RootStackParamList,
                'FragmentationForm5'
              >,
            ) => <ScreenWrapper component={FragmentationForm5} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="FragmentationResult">
            {(
              props: NativeStackScreenProps<
                RootStackParamList,
                'FragmentationResult'
              >,
            ) => <ScreenWrapper component={FragmentationResult} {...props} />}
          </Stack.Screen>

          <Stack.Screen name="FragmentationHistory">
            {(
              props: NativeStackScreenProps<
                RootStackParamList,
                'FragmentationHistory'
              >,
            ) => <ScreenWrapper component={FragmentationHistory} {...props} />}
          </Stack.Screen>
        </Stack.Navigator>
      </DepthAverageProvider>
    </NavigationContainer>
  );
}
