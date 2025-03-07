import React, { ComponentType } from 'react';
import MainLayout from '../MainLayout';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type ScreenWrapperProps<T extends keyof RootStackParamList> = {
  component: ComponentType<NativeStackScreenProps<RootStackParamList, T>>;
} & NativeStackScreenProps<RootStackParamList, T>;

const ScreenWrapper = <T extends keyof RootStackParamList>({
    component: Component,
    navigation,
    ...props
  }: ScreenWrapperProps<T>) => {
    return (
      <MainLayout navigation={navigation}>
        <Component navigation={navigation} {...props} />
      </MainLayout>
    );
  };
  

export default ScreenWrapper;
