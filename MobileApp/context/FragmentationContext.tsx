// FormContext.tsx
import React, {createContext, useState, FC, ReactNode, useEffect} from 'react';
import {dbService} from '../database/services/dbService';
import {Alert} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface KuzramMetrics {
  P10: number;
  P20: number;
  P80: number;
  P90: number;
  X50: number;
  percentage_above_60: number;
  percentage_below_60: number;
}

export interface AnalysisResult {
  kuzram: KuzramMetrics;
  plot_image_base64: string;
  threshold_percentages: Record<string, number>;
}

export interface FragmentationData {
  id?: number;
  imageUris: string[];
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
  rawImageUris: string[]; // picked locally
  uploadedImageUrls: string[]; // after “upload” API
  fragmentedResults: Array<{
    imageData: string;
    conversionFactor: number;
  }>;
  finalAnalysisResults: AnalysisResult[];
  diggingTime?: string;
  videoUri?: string;
  isEdit: boolean;
}

interface FormContextProps {
  formData: FragmentationData;
  updateForm: (data: Partial<FragmentationData>) => void;
  resetForm: () => void;
  saveToDatabase: (
    overrideData?: Partial<FragmentationData>,
  ) => Promise<boolean>;
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
    rawImageUris: [],
    uploadedImageUrls: [],
    fragmentedResults: [],
    finalAnalysisResults: [],
    diggingTime: undefined,
    videoUri: undefined,
    isEdit: false
  },
  updateForm: () => {},
  resetForm: () => {},
  saveToDatabase: async () => false,
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
    rawImageUris: [],
    uploadedImageUrls: [],
    fragmentedResults: [],
    finalAnalysisResults: [],
    diggingTime: undefined,
    videoUri: undefined,
    isEdit: false
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
      rawImageUris: [],
      uploadedImageUrls: [],
      fragmentedResults: [],
      finalAnalysisResults: [],
      diggingTime: undefined,
      videoUri: undefined,
      isEdit: false
    });
  };

  const dummyPayload: Partial<FragmentationData> = {
    skala: 'Skala Dummyaaa',
    pilihan: 'Pilihan dazxczxcxzcdasdsaDummaaay',
    ukuran: 'Ukuran Dummy',
    prioritas: 1,
    lokasi: 'Lokasi Dummy',
    tanggal: new Date().toISOString(),
    litologi: 'Litologi Dusddsdsdmmy',
    ammoniumNitrate: '123',
    volumeBlasting: '456',
    powderFactor: '7.89',
    diggingTime: '45 minutes',
    videoUri: 'http://example.com/video.mp4',

    uploadedImageUrls: [
      'http://10.0.2.2:5180/Imagdsdasdes/image1.jpg',
      'http://10.0.2.2:5180/Images/image2.jpg',
    ],

    fragmentedResults: [
      {
        imageData: 'http://10.0.2.2:5180/Images/fragment1.jpg',
        conversionFactor: 0.123,
      },
      {
        imageData: 'http://10.0.2.2:5180/Images/fragment2.jpg',
        conversionFactor: 0.456,
      },
    ],

    finalAnalysisResults: [
      {
        plot_image_base64: 'http://10.0.2.2:5180/Images/plot1.png',
        kuzram: {
          P10: 5,
          P20: 10,
          P80: 60,
          P90: 75,
          X50: 45,
          percentage_above_60: 30.0,
          percentage_below_60: 70.0,
        },
        threshold_percentages: {
          '10': 8,
          '20': 15,
          '30': 20,
          '40': 30,
          '50': 10,
          '60': 17,
        },
      },
      {
        plot_image_base64: 'http://10.0.2.2:5180/Images/paat2.png',
        kuzram: {
          P10: 3,
          P20: 6,
          P80: 70,
          P90: 85,
          X50: 55,
          percentage_above_60: 25.0,
          percentage_below_60: 75.0,
        },
        threshold_percentages: {
          '10': 7,
          '20': 12,
          '30': 22,
          '40': 33,
          '50': 18,
          '60': 8,
        },
      },
    ],
  };

  // useEffect(() => {
  //   saveToDatabase(dummyPayload);
  // }, []);

  const saveToDatabase = async (
    overrideData?: Partial<FragmentationData>,
  ): Promise<boolean> => {
    // 1) merge overrideData if any
    let payload = overrideData ? {...formData, ...overrideData} : {...formData};

    try {
      const net = await NetInfo.fetch();

      if (net.isConnected) {
        // 2) make sure prioritas is a real integer
        if (!payload.prioritas || isNaN(payload.prioritas)) {
          const dateParam = encodeURIComponent(payload.tanggal);
          console.log(dateParam)
          const prioRes = await fetch(
            `http://10.0.2.2:5180/api/Fragmentation/next-priority?tanggal=${dateParam}`,
          );
          if (!prioRes.ok) {
            throw new Error(`Couldn't get next‐priority: ${prioRes.status}`);
          }
          const nextPrio = await prioRes.json();
          payload.prioritas = nextPrio;
        }

        // 3) build the exact DTO C# Create wants
        const dto = {
          skala: payload.skala,
          pilihan: payload.pilihan,
          ukuran: payload.ukuran,
          prioritas: payload.prioritas,
          lokasi: payload.lokasi,
          tanggal: payload.tanggal,
          litologi: payload.litologi,
          ammoniumNitrate: payload.ammoniumNitrate,
          volumeBlasting: payload.volumeBlasting,
          powderFactor: payload.powderFactor,
          diggingTime: payload.diggingTime ?? null,
          videoUri: payload.videoUri ?? null,
          uploadedImageUrls: payload.uploadedImageUrls,
          fragmentedImageUrls: payload.fragmentedResults.map(f => f.imageData),
          plotImageUrls: payload.finalAnalysisResults.map(a =>
            a.plot_image_base64.replace('localhost', '10.0.2.2'),
          ),
          analysisJsonList: payload.finalAnalysisResults,
        };

        // 4) POST to ASP.NET
        const res = await fetch('http://10.0.2.2:5180/api/Fragmentation', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(dto),
        });

        // 5) conflict handling
        if (res.status === 409) {
          const {existingPriorities} = await res.json();
          const newPrio = Math.max(...existingPriorities) + 1;
          return new Promise(resolve => {
            Alert.alert(
              'Priority Conflict',
              `Priority ${dto.prioritas} on ${dto.tanggal} is taken. I will retry as ${newPrio}.`,
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    dto.prioritas = newPrio;
                    const retry = await fetch(
                      'http://10.0.2.2:5180/api/Fragmentation',
                      {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(dto),
                      },
                    );
                    if (retry.ok) {
                      const created = await retry.json();
                      updateForm({id: created.id, prioritas: newPrio});
                      resolve(true);
                    } else {
                      console.error('Retry failed:', retry.status);
                      resolve(false);
                    }
                  },
                },
              ],
            );
          });
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server responded ${res.status}: ${text}`);
        }

        // 6) on success store the returned id
        const created = await res.json();
        updateForm({id: created.id, prioritas: dto.prioritas});
      } else {
        // 7) offline: save whole formData into SQLite
        await dbService.init();
        await dbService.saveOrUpdateFragmentationData(payload as any);
      }

      return true;
    } catch (err) {
      console.error('Save failed:', err);
      return false;
    }
  };

  return (
    <FormContext.Provider
      value={{formData, updateForm, resetForm, saveToDatabase}}>
      {children}
    </FormContext.Provider>
  );
};
