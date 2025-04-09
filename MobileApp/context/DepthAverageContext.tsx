import React, {createContext, useState, ReactNode, useEffect} from 'react';
import SQLiteService from '../database/services/SQLiteService';
import NetInfo from '@react-native-community/netinfo';

const sqliteService = new SQLiteService();
sqliteService.init();

export type DepthAverageData = {
  id: number;
  location: string;
  date: string;
  average: string;
  image?: string;
};

type FormDataType = {
  id: number | null,
  imageUri: string | null;
  jumlahLubang: string;
  lokasi: string;
  tanggal: string;
  kedalaman: Record<string, string>;
  average: string;
  prioritas: number;
};

type DepthAverageContextType = {
  formData: FormDataType;
  setFormData: (data: Partial<FormDataType>) => void;
  saveToDatabase: () => void;
  loadData: () => Promise<DepthAverageData[]>;
  resetForm: () => void;
};

const defaultFormData: FormDataType = {
  id: NaN,
  imageUri: null,
  jumlahLubang: '',
  lokasi: '',
  tanggal: '',
  kedalaman: {},
  average: '',
  prioritas: 0,
};

export const DepthAverageContext = createContext<DepthAverageContextType>({
  formData: defaultFormData,
  setFormData: () => {},
  saveToDatabase: () => {},
  loadData: async () => Promise.resolve([]),
  resetForm: () => {},
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
      const state = await NetInfo.fetch();
  
      if (state.isConnected) {
        const response = await fetch('http://10.0.2.2:5180/api/DepthAverage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            imageUri: formData.imageUri,
            jumlahLubang: formData.jumlahLubang,
            prioritas: formData.prioritas,
            lokasi: formData.lokasi,
            kedalaman: JSON.stringify(formData.kedalaman),
            average: formData.average,
            tanggal: formData.tanggal,
            synced: 1, // already synced if online
          }]),
        });
  
        if (!response.ok) {
          throw new Error('Failed to upload to server');
        }
  
        console.log('Data sent to API');
      } else {
        // OFFLINE ❌ Save locally
        await sqliteService.saveData('DepthAverage', formData);
        console.log('Saved locally (offline)');
      }
  
      await sqliteService.debugGetAllData();
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };
  

  const loadData = async (): Promise<DepthAverageData[]> => {
    const netInfo = await NetInfo.fetch();
  
    if (netInfo.isConnected) {
      console.log("fetch history from real api")
      try {
        const response = await fetch('http://10.0.2.2:5180/api/DepthAverage');
        const json = await response.json();
  
        return json.map((item: any) => ({
          id: item.id,
          location: item.lokasi,
          date: item.tanggal.split('T')[0],
          average: `${item.average} cm`,
          image: item.imageUri,
          prioritas: item.prioritas
        }));
      } catch (error) {
        console.error('Failed to fetch data from API:', error);
      }
    }
  
    try {
      console.log("fetch history from sqlite")
      const allData = await sqliteService.getAllData();
      return allData.map((item: any) => ({
        id: item.id,
        location: item.lokasi,
        date: item.tanggal,
        average: `${item.average} cm`,
        image: item.imageUri,
        prioritas: item.prioritas
      }));
    } catch (error) {
      console.error('Failed to fetch data from SQLite:', error);
      return [];
    }
  };

  // Reset the form to its default state.
  const resetForm = () => {
    setFormDataState(defaultFormData);
  };

  return (
    <DepthAverageContext.Provider
      value={{formData, setFormData, saveToDatabase, loadData, resetForm}}>
      {children}
    </DepthAverageContext.Provider>
  );
};
