// FormContext.tsx
import React, {createContext, useState, FC, ReactNode, useEffect} from 'react';
import {dbService} from '../database/services/dbService';
import {Alert} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {API_BASE_URL} from '@env';
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
  localId?: number;
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
  origin?: string; // Track where we came from (FragmentationHistory or FragmentationHistoryIncomplete)
  isEdit?: boolean;
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
    localId: NaN,
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
    origin: '',
    isEdit: false,
  },
  updateForm: () => {},
  resetForm: () => {},
  saveToDatabase: async () => false,
});

export const FormProvider = ({children}: {children: ReactNode}) => {
  const [formData, setFormData] = useState<FragmentationData>({
    id: NaN,
    localId: NaN,
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
    origin: '', // added to track origin
    isEdit: false,
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
      localId: NaN,
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
      origin: '', // added to track origin
      isEdit: false,
    });
  };

  const saveToDatabase = async (
    overrideData?: Partial<FragmentationData>,
  ): Promise<boolean> => {
    const payload = overrideData
      ? {...formData, ...overrideData}
      : {...formData};

    try {
      const net = await NetInfo.fetch();

      if (net.isConnected) {
        // 1) Ensure we have a priority
        if (!payload.prioritas || isNaN(payload.prioritas)) {
          const dateParam = encodeURIComponent(payload.tanggal);
          const prioRes = await fetch(
            `${API_BASE_URL}/api/Fragmentation/next-priority?tanggal=${dateParam}`,
          );
          if (!prioRes.ok)
            throw new Error(`Couldn't get next‐priority: ${prioRes.status}`);
          payload.prioritas = await prioRes.json();
        }

        // 2) Build the DTO exactly as the server expects
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
            a.plot_image_base64.replace('localhost:5180', API_BASE_URL.replace(/^https?:\/\//, '')),
          ),
          analysisJsonList: payload.finalAnalysisResults,
        };

        console.log("dto: ", dto);
        let res: Response;

        if (payload.id != null && !isNaN(payload.id)) {
          // —— UPDATE existing record ——
          res = await fetch(`${API_BASE_URL}/api/Fragmentation/${payload.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dto),
          });
          if (!res.ok) {
            const err = await res.text();
            throw new Error(`Update failed (${res.status}): ${err}`);
          }
          return true;
        } else {
          // —— CREATE new record ——
          res = await fetch(`${API_BASE_URL}/api/Fragmentation`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dto),
          });

          // conflict handling identical to DepthAverage
          if (res.status === 409) {
            const {existingPriorities} = await res.json();
            const sorted = existingPriorities.sort(
              (a: number, b: number) => a - b,
            );
            let newPrio = 1;
            for (const p of sorted) {
              if (p === newPrio) newPrio++;
              else if (p > newPrio) break;
            }

            return new Promise(resolve => {
              Alert.alert(
                'Priority Conflict',
                `Priority ${dto.prioritas} is taken on ${dto.tanggal}. Retrying as ${newPrio}.`,
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      dto.prioritas = newPrio;
                      const retry = await fetch(
                        `${API_BASE_URL}/api/Fragmentation`,
                        {
                          method: 'POST',
                          headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify(dto),
                        },
                      );
                      if (retry.ok) {
                        const created = await retry.json();
                        updateForm({id: created.id, prioritas: newPrio});
                        // delete local placeholder now that it's on server
                        if (payload.localId != null) {
                          await dbService.deleteData(
                            payload.localId,
                            'FragmentationData',
                          );
                        }
                        resolve(true);
                      } else {
                        console.error('Retry failed', retry.status);
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
            throw new Error(`Create failed (${res.status}): ${text}`);
          }

          // on success, grab the new server id & clean up local
          const created = await res.json();
          updateForm({id: created.id, prioritas: dto.prioritas});
          if (payload.localId != null) {
            await dbService.deleteData(payload.localId, 'FragmentationData');
          }
          return true;
        }
      } else {
        // —— OFFLINE: upsert to SQLite ——
        await dbService.init();
        await dbService.saveOrUpdateFragmentationData(payload as any);
        return true;
      }
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
