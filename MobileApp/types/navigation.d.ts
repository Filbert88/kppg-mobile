import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Homepage: undefined;
  Help: undefined;
  AddOrHistory: { type: 'FragmentasiForm1' | 'DepthAverage' };
  FragmentationForm1: undefined;
  FragmentationForm2: undefined;
  FragmentationForm3: undefined;
  FragmentationForm4: undefined;
  FragmentationForm5: undefined;
  FragmentationResult: undefined;
  FragmentationHistory: undefined;
  FormDA1: undefined;
  FormDA2: undefined;
  FormDA3: undefined;
  DAHistory: undefined;
  DepthAverageUpload: undefined;
};
