import React, {useContext, useEffect, useRef} from 'react';
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
import DatePriority from './pages/DatePriority/DatePriority';
import Help from './pages/Help/Help';
import {
  DepthAverageContext,
  DepthAverageProvider,
} from './context/DepthAverageContext';
import {FormProvider} from './context/FragmentationContext';
import NetInfo from '@react-native-community/netinfo';
import {syncLocalDataWithBackend} from './database/services/syncService';
import './global.css';
import FragmentationForm6 from './pages/fragmentation-form/fragmentation-form6';
import {dbService} from './database/services/dbService';
import DiggingTimePage from './pages/DiggingTime/DiggingTime';

import FragmentationHistToDepth from './pages/FragmentationHistToDepth/FragmentationHistToDepth';
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      await dbService.init();
    })();
  }, []);

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
        <FormProvider>
          <Stack.Navigator
            initialRouteName="Homepage"
            screenOptions={{headerShown: false}}>
            <Stack.Screen name="Homepage" component={Homepage} />

            <Stack.Screen name="AddOrHistory">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'AddOrHistory'
                >,
              ) => (
                <ScreenWrapper
                  component={AddOrHistory}
                  customBackAction={() => props.navigation.navigate('Homepage')}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FragmentionDepthAverage">
              {(props: NativeStackScreenProps<RootStackParamList, 'FragmentionDepthAverage'>) => (
                <ScreenWrapper
                  component={FragmentationHistToDepth}
                  customBackAction={() => props.navigation.navigate('FragmentationHistory')}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Help">
              {(props: NativeStackScreenProps<RootStackParamList, 'Help'>) => (
                <ScreenWrapper component={Help} {...props} />
              )}
            </Stack.Screen>

            <Stack.Screen name="DepthAverageUpload">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'DepthAverageUpload'
                >,
              ) => {
                // grab isEdit from context here
                const {formData} = useContext(DepthAverageContext);
                // only provide a back‐handler when NOT editing
                const backHandler = formData.isEdit
                  ? undefined
                  : () =>
                      props.navigation.navigate('DatePriority', {
                        type: 'DepthAverage',
                      });

                return (
                  <ScreenWrapper
                    component={DepthAverageUpload}
                    customBackAction={backHandler}
                    {...props}
                  />
                );
              }}
            </Stack.Screen>
            <Stack.Screen name="DatePriority">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'DatePriority'
                >,
              ) => (
                <ScreenWrapper
                  component={DatePriority}
                  customBackAction={() =>
                    props.navigation.navigate('AddOrHistory', {
                      type: props.route.params.type,
                    })
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FormDA1">
              {(
                props: NativeStackScreenProps<RootStackParamList, 'FormDA1'>,
              ) => (
                <ScreenWrapper
                  component={FormDA1}
                  customBackAction={() =>
                    props.navigation.navigate('DepthAverageUpload')
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FormDA2">
              {(
                props: NativeStackScreenProps<RootStackParamList, 'FormDA2'>,
              ) => (
                <ScreenWrapper
                  component={FormDA2}
                  customBackAction={() => props.navigation.navigate('FormDA1')}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FormDA3">
              {(
                props: NativeStackScreenProps<RootStackParamList, 'FormDA3'>,
              ) => (
                <ScreenWrapper
                  component={FormDA3}
                  customBackAction={() => props.navigation.navigate('FormDA2')}
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="DAHistory">
              {(
                props: NativeStackScreenProps<RootStackParamList, 'DAHistory'>,
              ) => (
                <ScreenWrapper
                  component={DAHistory}
                  customBackAction={() =>
                    props.navigation.navigate('AddOrHistory', {
                      type: 'DepthAverage',
                    })
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FragmentationForm1">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'FragmentationForm1'
                >,
              ) => (
                <ScreenWrapper
                  component={FragmentationForm1}
                  customBackAction={() =>
                    props.navigation.navigate('AddOrHistory', {
                      type: 'FragmentasiForm1',
                    })
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FragmentationForm2">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'FragmentationForm2'
                >,
              ) => (
                <ScreenWrapper
                  component={FragmentationForm2}
                  customBackAction={() =>
                    props.navigation.navigate('FragmentationForm1')
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FragmentationForm3">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'FragmentationForm3'
                >,
              ) => (
                <ScreenWrapper
                  component={FragmentationForm3}
                  customBackAction={() =>
                    props.navigation.navigate('FragmentationForm2')
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FragmentationForm4">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'FragmentationForm4'
                >,
              ) => (
                <ScreenWrapper
                  component={FragmentationForm4}
                  customBackAction={() =>
                    props.navigation.navigate('FragmentationForm3')
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FragmentationForm5">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'FragmentationForm5'
                >,
              ) => (
                <ScreenWrapper
                  component={FragmentationForm5}
                  customBackAction={() =>
                    props.navigation.navigate('FragmentationForm4')
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FragmentationForm6">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'FragmentationForm6'
                >,
              ) => (
                <ScreenWrapper
                  component={FragmentationForm6}
                  customBackAction={() =>
                    props.navigation.navigate('FragmentationForm5')
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="FragmentationResult">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'FragmentationResult'
                >,
              ) => (
                <ScreenWrapper
                  component={FragmentationResult}
                  customBackAction={() =>
                    props.navigation.navigate('FragmentationForm6')
                  }
                  {...props}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="DiggingTimePage">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'DiggingTimePage'
                >,
              ) => (
                <ScreenWrapper
                  component={DiggingTimePage}
                  customBackAction={() =>
                    props.navigation.navigate('FragmentationResult')
                  }
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="FragmentationHistory">
              {(
                props: NativeStackScreenProps<
                  RootStackParamList,
                  'FragmentationHistory'
                >,
              ) => (
                <ScreenWrapper
                  component={FragmentationHistory}
                  customBackAction={() =>
                    props.navigation.navigate('AddOrHistory', {
                      type: 'FragmentasiForm1',
                    })
                  }
                  {...props}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </FormProvider>
      </DepthAverageProvider>
    </NavigationContainer>
  );
}
