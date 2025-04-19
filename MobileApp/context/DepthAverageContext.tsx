import React, {createContext, useState, ReactNode, useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {dbService} from '../database/services/dbService';
import {Alert} from 'react-native';
import { API_BASE_URL } from '@env';

export type DepthAverageData = {
  id: number;
  location: string;
  date: string;
  average: string;
  kedalaman: Record<string, string>;
  jumlahLubang: string;
  image?: string;
  prioritas: number;
};

type FormDataType = {
  id: number | null;
  imageUri: string | null;
  jumlahLubang: string;
  lokasi: string;
  tanggal: string;
  kedalaman: Record<string, string>;
  average: string;
  prioritas: number;
  isEdit: boolean;
  origin: string;
};

type DepthAverageContextType = {
  formData: FormDataType;
  setFormData: (data: Partial<FormDataType>) => void;
  saveToDatabase: (overrideData?: Partial<FormDataType>) => Promise<boolean>;
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
  prioritas: NaN,
  isEdit: false,
  origin: '',
};

export const DepthAverageContext = createContext<DepthAverageContextType>({
  formData: defaultFormData,
  setFormData: () => {},
  saveToDatabase: async () => false,
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

  const saveToDatabase = async (
    overrideData?: Partial<FormDataType>,
  ): Promise<boolean> => {
    const data = overrideData ? {...formData, ...overrideData} : formData;
    try {
      const state = await NetInfo.fetch();

      if (state.isConnected) {
        const response = await fetch(`${API_BASE_URL}/api/DepthAverage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify([
            {
              imageUri: formData.imageUri,
              jumlahLubang: formData.jumlahLubang,
              prioritas: formData.prioritas,
              lokasi: formData.lokasi,
              kedalaman: JSON.stringify(formData.kedalaman),
              average: formData.average,
              tanggal: formData.tanggal,
              synced: 1,
            },
          ]),
        });

        if (!response.ok) {
          if (response.status === 409) {
            const errorData = await response.json();
            const nextPriority = Math.max(...errorData.existingPriorities) + 1;

            return new Promise(resolve => {
              Alert.alert(
                'Priority Conflict',
                `Priority ${formData.prioritas} is already used on ${formData.tanggal}.\nWe’ll update it to the next available: ${nextPriority}`,
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      const updatedFormData = {
                        ...formData,
                        prioritas: nextPriority,
                        kedalaman: JSON.stringify(formData.kedalaman),
                        synced: 1,
                      };

                      const {id, ...dataWithoutId} = updatedFormData;
                      const cleanData = isNaN(id as number)
                        ? dataWithoutId
                        : updatedFormData;

                      try {
                        const retry = await fetch(
                          `${API_BASE_URL}/api/DepthAverage`,
                          {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify([cleanData]),
                          },
                        );

                        if (retry.ok) {
                          setFormData({prioritas: nextPriority});
                          resolve(true); // ✅ Success
                        } else {
                          console.error('Retry failed');
                          resolve(false);
                        }
                      } catch (err) {
                        console.error('Retry error:', err);
                        resolve(false);
                      }
                    },
                  },
                ],
              );
            });
          }

          throw new Error('Failed to upload to server');
        }

        console.log('Data sent to API');
      } else {
        await dbService.saveData('DepthAverage', {
          imageUri: data.imageUri,
          tanggal: data.tanggal,
          prioritas: data.prioritas,
        });
        console.log('Saved locally (offline)');
      }

      await dbService.debugGetAllData();
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  };

  const loadData = async (): Promise<DepthAverageData[]> => {
    const netInfo = await NetInfo.fetch();

    if (netInfo.isConnected) {
      console.log('fetch history from real api');
      try {
        const response = await fetch(`${API_BASE_URL}/api/DepthAverage`);
        const json = await response.json();

        return json.map((item: any) => ({
          id: item.id,
          location: item.lokasi,
          date: item.tanggal.split('T')[0],
          average: `${item.average} cm`,
          image: item.imageUri,
          prioritas: item.prioritas,
          kedalaman: item.kedalaman,
          jumlahLubang: item.jumlahLubang,
        }));
      } catch (error) {
        console.error('Failed to fetch data from API:', error);
      }
    }

    try {
      console.log('fetch history from sqlite');
      const allData = await dbService.getAllData();
      return allData.map((item: any) => ({
        id: item.id,
        location: item.lokasi,
        date: item.tanggal,
        average: `${item.average} cm`,
        image: item.imageUri,
        prioritas: item.prioritas,
        kedalaman: item.kedalaman,
        jumlahLubang: item.jumlahLubang,
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
