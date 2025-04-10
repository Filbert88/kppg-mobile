import NetInfo from '@react-native-community/netinfo';
import { dbService } from '../../database/services/dbService';

const API_ENDPOINTS: {[key: string]: string} = {
  DepthAverage: 'http://10.0.2.2:5180/api/DepthAverage',
  FragmentationData: 'http://10.0.2.2:5180/api/FragmentationData',
};

const MODELS = ['DepthAverage', 'FragmentationData'];

let isSyncing = false;

const getNextPriorityDepthAverage = async (tanggal: string): Promise<number> => {
  const response = await fetch(
    `http://10.0.2.2:5180/api/DepthAverage/next-priority?tanggal=${tanggal}`,
  );
  const json = await response.json();
  return json;
};


export const syncLocalDataWithBackend = async () => {
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return;
  }
  isSyncing = true;
  try {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      for (const model of MODELS) {
        const unsyncedData = await dbService.getUnsyncedData(model);
        console.log(`Syncing ${model} data:`, unsyncedData);

        if (unsyncedData.length > 0) {
          const idsToSync = unsyncedData.map(data => data.id);
          const endpoint = API_ENDPOINTS[model];

          const formattedData = await Promise.all(
            unsyncedData.map(async data => {
              const adjustedPriority = await getNextPriorityDepthAverage(data.tanggal);
              console.log("priority dari db: ", adjustedPriority)
              return {
                imageUri: data.imageUri ?? 'default_uri',
                jumlahLubang: data.jumlahLubang || 'N/A',
                lokasi: data.lokasi || 'Unknown',
                prioritas: adjustedPriority,
                tanggal: data.tanggal ? new Date(data.tanggal).toISOString() : new Date().toISOString(),
                kedalaman: data.kedalaman || '{}',
                average: data.average || '0',
                synced: 1,
              };
            }),
          );          

          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formattedData),
            });

            if (response.ok) {
              await dbService.markDataAsSynced(model, idsToSync);
              console.log(`${model} data synced successfully`);
            } else {
              const errorText = await response.text();
              console.error(`Failed to sync ${model} data, server error: ${errorText}`);
            }
          } catch (error: any) {
            console.error(`Failed to sync ${model} data:`, error.message ?? error);
          }
        }
      }
    } else {
      console.log('No internet connection, sync postponed');
    }
  } finally {
    isSyncing = false;
  }
};