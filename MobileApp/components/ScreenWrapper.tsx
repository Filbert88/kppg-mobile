import React, { ComponentType } from 'react';
import MainLayout from '../MainLayout';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type ScreenWrapperProps<T extends keyof RootStackParamList> = {
  component: ComponentType<NativeStackScreenProps<RootStackParamList, T>>;
  customBackAction?: () => void;
} & NativeStackScreenProps<RootStackParamList, T>;

const ScreenWrapper = <T extends keyof RootStackParamList>({
  component: Component,
  navigation,
  customBackAction,
  ...props
}: ScreenWrapperProps<T>) => {
   const onBackPress = customBackAction || (() => navigation.goBack());
  return (
    <MainLayout navigation={navigation} onBackPress={onBackPress}>
      <Component navigation={navigation} {...props} />
    </MainLayout>
  );
};
  

export default ScreenWrapper;
