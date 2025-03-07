import React, {createContext, useState, ReactNode} from 'react';

type FormDataType = {
  imageUri: string | null;
  jumlahLubang: string;
  lokasi: string;
  tanggal: string;
  kedalaman: Record<string, string>;
  average: string;
};

type DepthAverageType = {
  formData: FormDataType;
  setFormData: (data: Partial<FormDataType>) => void;
  saveToDatabase: () => void;
};

const defaultFormData: FormDataType = {
  imageUri: null,
  jumlahLubang: '',
  lokasi: '',
  tanggal: '',
  kedalaman: {},
  average: '',
};

export const DepthAverageContext = createContext<DepthAverageType>({
  formData: defaultFormData,
  setFormData: () => {},
  saveToDatabase: () => {},
});

export const DepthAverageProvider = ({children}: {children: ReactNode}) => {
  const [formData, setFormDataState] = useState<FormDataType>(defaultFormData);

  const setFormData = (data: Partial<FormDataType>) => {
    setFormDataState(prev => {
      const updatedData = {...prev, ...data};

      if (data.jumlahLubang) {
        const jumlahLubang = parseInt(data.jumlahLubang, 10) || 0;
        const kedalaman: Record<string, string> = {};

        for (let i = 1; i <= jumlahLubang; i++) {
          kedalaman[`kedalaman${i}`] = prev.kedalaman[`kedalaman${i}`] || '';
        }

        updatedData.kedalaman = kedalaman;
      }

      return updatedData;
    });
  };

  const saveToDatabase = async () => {
    try {
      console.log('Data to be saved:', JSON.stringify(formData, null, 2));
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  return (
    <DepthAverageContext.Provider value={{formData, setFormData, saveToDatabase}}>
      {children}
    </DepthAverageContext.Provider>
  );
};
