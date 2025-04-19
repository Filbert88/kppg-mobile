import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Homepage: undefined;
  Help: undefined;
  AddOrHistory: {type: 'FragmentasiForm1' | 'DepthAverage'};
  DatePriorityF : undefined;
  DatePriorityD : undefined;
  FragmentationForm1: undefined;
  FragmentationForm2: undefined;
  FragmentationForm3: undefined;
  FragmentationForm4: undefined;
  FragmentationForm5: undefined;
  FragmentationForm6: undefined;
  FragmentationResult: undefined;
  FragmentationHistory: undefined;
  FragmentationHistoryIncomplete: undefined;
  FormDA1: undefined;
  FormDA2: undefined;
  FormDA3: undefined;
  DAHistory: undefined;
  DepthAverageUpload: undefined;
  FragmentionDepthAverage: {priority: number; tanggal: string};
  DiggingTimePage: undefined;
  DAHistoryIncomplete: undefined; 
  FragmentationHistoryDone: undefined;
  DepthAverageFragmention1 : {priority: number; tanggal: string};
};
