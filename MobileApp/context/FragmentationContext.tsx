// FormContext.tsx
import React, { createContext, useState, FC, ReactNode } from 'react';

export interface FragmentationData {
  id?: number;
  imageUris: string[]; // Sekarang merupakan array of string
  skala: string;
  pilihan: string;
  ukuran: string;
  prioritas: number;
  lokasi: string;
  tanggal: string;
  litologi: string;
  ammoniumNitrate: string;
  volumeBlasting: string;
  powderFactor: string;
}

interface FormContextProps {
  formData: FragmentationData;
  updateForm: (data: Partial<FragmentationData>) => void;
  resetForm: () => void;
}

export const FormContext = createContext<FormContextProps>({
  formData: {
      id: NaN,
    imageUris: [],
    skala: '',
    pilihan: '',
    ukuran: '',
    prioritas: NaN,
    lokasi: '',
    tanggal: '',
    litologi: '',
    ammoniumNitrate: '',
    volumeBlasting: '',
    powderFactor: '',
  },
  updateForm: () => {},
  resetForm: () => {},
});

export const FormProvider = ({children}: {children: ReactNode}) => {
  const [formData, setFormData] = useState<FragmentationData>({
      id: NaN,
    imageUris: [],
    skala: '',
    pilihan: '',
    ukuran: '',
    prioritas: NaN,
    lokasi: '',
    tanggal: '',
    litologi: '',
    ammoniumNitrate: '',
    volumeBlasting: '',
    powderFactor: '',
  });

  const updateForm = (data: Partial<FragmentationData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
    }));
  };

  const resetForm = () => {
    setFormData({
        id: NaN,
      imageUris: [],
      skala: '',
      pilihan: '',
      ukuran: '',
      prioritas: NaN,
      lokasi: '',
      tanggal: '',
      litologi: '',
      ammoniumNitrate: '',
      volumeBlasting: '',
      powderFactor: '',
    });
  };

  return (
    <FormContext.Provider value={{ formData, updateForm, resetForm }}>
      {children}
    </FormContext.Provider>
  );
};
