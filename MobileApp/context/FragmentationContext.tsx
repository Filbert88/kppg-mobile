import React, { createContext, useState, ReactNode } from 'react';


type FragmentationFormDataType = {
  imageUri: string | null;
  skala: string;
  pilihan: string;
  ukuran: string;
  lokasi: string;
  tanggal: string;
  litologiBantuan: string;
  amoniumNitrat: string;
  volumeBlasting: string;
  powderFactor: string;
  additionalImages: string[];
};

type FragmentationContextType = {
  fragmentationData: FragmentationFormDataType;
  setFragmentationData: (data: Partial<FragmentationFormDataType>) => void;
  saveFragmentationData: () => void;
};

const defaultFragmentationData: FragmentationFormDataType = {
  imageUri: null,
  skala: '',
  pilihan: '',
  ukuran: '',
  lokasi: '',
  tanggal: '',
  litologiBantuan: '',
  amoniumNitrat: '',
  volumeBlasting: '',
  powderFactor: '',
  additionalImages: [],
};

export const FragmentationContext = createContext<FragmentationContextType>({
  fragmentationData: defaultFragmentationData,
  setFragmentationData: () => {},
  saveFragmentationData: () => {},
});

// FragmentationDataProvider component to wrap around app or specific screens
export const FragmentationDataProvider = ({ children }: { children: ReactNode }) => {
  const [fragmentationData, setFragmentationDataState] = useState<FragmentationFormDataType>(defaultFragmentationData);

  // Function to update form data
  const setFragmentationData = (data: Partial<FragmentationFormDataType>) => {
    setFragmentationDataState((prev) => ({ ...prev, ...data }));
  };

  // Function to simulate saving data to a database
  const saveFragmentationData = async () => {
    try {
      console.log('Fragmentation Data to be saved:', JSON.stringify(fragmentationData, null, 2));
      // You can replace this with actual save logic, e.g., API call
      console.log('Fragmentation data saved successfully');
    } catch (error) {
      console.error('Failed to save fragmentation data:', error);
    }
  };

  return (
    <FragmentationContext.Provider
      value={{ fragmentationData, setFragmentationData, saveFragmentationData }}
    >
      {children}
    </FragmentationContext.Provider>
  );
};
