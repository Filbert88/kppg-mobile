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
    });
  };

  // ✅ Dummy payload to test without running full flow
  const dummyPayload: Partial<FragmentationData> = {
    skala: 'Skala Dummy',
    pilihan: 'Pilihan Dummy',
    ukuran: 'Ukuran Dummy',
    prioritas: 1,
    lokasi: 'Lokasi Dummy',
    tanggal: new Date().toISOString(),
    litologi: 'Litologi Dummy',
    ammoniumNitrate: '123',
    volumeBlasting: '456',
    powderFactor: '7.89',
    diggingTime: '30 minutes',
    videoUri: 'http://example.com/video.mp4',
    uploadedImageUrls: [
      'http://10.0.2.2:5180/Images/image1.jpg',
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
        plot_image_base64: 'http://10.0.2.2:5180/Images/plot.png',
        kuzram: {
          P10: 1,
          P20: 2,
          P80: 80,
          P90: 90,
          X50: 50,
          percentage_above_60: 12.5,
          percentage_below_60: 87.5,
        },
        threshold_percentages: {
          '10': 5,
          '20': 10,
          '30': 25,
          '40': 35,
          '50': 15,
          '60': 10,
        },
      },
    ],
  };

  useEffect(() => {
    saveToDatabase(dummyPayload);
  }, []);

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
          plotImageUrl:
            payload.finalAnalysisResults[0]?.plot_image_base64.replace(
              'localhost',
              '10.0.2.2',
            ),
          analysisJson: payload.finalAnalysisResults[0], // include entire analysis
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
