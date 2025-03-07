import React, {createContext, useState, ReactNode, useEffect} from 'react';
import SQLiteService from '../database/services/SQLiteService';

const sqliteService = new SQLiteService();
sqliteService.init();

type DepthAverageData = {
  id: string;
  location: string;
  date: string;
  average: string;
  image?: string;
};

type FormDataType = {
  imageUri: string | null;
  jumlahLubang: string;
  lokasi: string;
  tanggal: string;
  kedalaman: Record<string, string>;
  average: string;
};

type DepthAverageContextType = {
  formData: FormDataType;
  setFormData: (data: Partial<FormDataType>) => void;
  saveToDatabase: () => void;
  loadData: () => Promise<DepthAverageData[]>;
};

const defaultFormData: FormDataType = {
  imageUri: null,
  jumlahLubang: '',
  lokasi: '',
  tanggal: '',
  kedalaman: {},
  average: '',
};

export const DepthAverageContext = createContext<DepthAverageContextType>({
  formData: defaultFormData,
  setFormData: () => {},
  saveToDatabase: () => {},
  loadData: async () => Promise.resolve([]),
});

export const DepthAverageProvider = ({children}: {children: ReactNode}) => {
  const [formData, setFormDataState] = useState<FormDataType>(defaultFormData);

  useEffect(() => {
    loadData();
  }, []);

  const setFormData = (data: Partial<FormDataType>) => {
    setFormDataState(prev => ({...prev, ...data}));
  };

  const saveToDatabase = async () => {
    try {
      await sqliteService.saveData(formData);
      console.log('Data saved locally');
      await sqliteService.debugGetAllData();
      console.log('tes');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const loadData = async (): Promise<DepthAverageData[]> => {
    try {
      const allData = await sqliteService.getAllData();
      console.log('Loaded Data:', allData);

      return allData.map((item: any) => ({
        id: item.id.toString(),
        location: item.lokasi,
        date: item.tanggal,
        average: `${item.average} cm`,
        image: item.imageUri,
      }));
    } catch (error) {
      console.error('Failed to load depth average data:', error);
      return [];
    }
  };

  return (
    <DepthAverageContext.Provider
      value={{formData, setFormData, saveToDatabase, loadData}}>
      {children}
    </DepthAverageContext.Provider>
  );
};
