import NetInfo from '@react-native-community/netinfo';
import {dbService} from '../../database/services/dbService';

const API_ENDPOINTS: {[key: string]: string} = {
  DepthAverage: 'http://10.0.2.2:5180/api/DepthAverage',
  FragmentationData: 'http://10.0.2.2:5180/api/FragmentationData',
};

const MODELS = ['DepthAverage', 'FragmentationData'];

let isSyncing = false;

const getNextPriorityDepthAverage = async (
  tanggal: string,
): Promise<number> => {
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

    if (!state.isConnected) {
      console.log('No internet connection, sync postponed');
      return;
    }

    for (const model of MODELS) {
      const unsyncedData = await dbService.getUnsyncedData(model);
      console.log(
        `Fetched ${unsyncedData.length} unsynced entries for ${model}`,
      );

      // Filter out incomplete DepthAverage records
      const filteredData =
        model === 'DepthAverage'
          ? unsyncedData.filter(
              data =>
                data.imageUri &&
                data.tanggal &&
                data.prioritas &&
                data.lokasi &&
                data.jumlahLubang &&
                data.kedalaman &&
                data.average,
            )
          : unsyncedData;

      if (model === 'DepthAverage') {
        console.log(
          `${
            unsyncedData.length - filteredData.length
          } partial DepthAverage records skipped from sync`,
        );
      }

      if (filteredData.length === 0) continue;

      const idsToSync = filteredData.map(data => data.id);
      const endpoint = API_ENDPOINTS[model];

      const formattedData = await Promise.all(
        filteredData.map(async data => {
          const adjustedPriority =
            model === 'DepthAverage'
              ? await getNextPriorityDepthAverage(data.tanggal)
              : data.prioritas;

          return {
            imageUri: data.imageUri ?? 'default_uri',
            jumlahLubang: data.jumlahLubang || 'N/A',
            lokasi: data.lokasi || 'Unknown',
            prioritas: adjustedPriority,
            tanggal: data.tanggal
              ? new Date(data.tanggal).toISOString()
              : new Date().toISOString(),
            kedalaman: data.kedalaman || '{}',
            average: data.average || '0',
            synced: 1,
          };
        }),
      );

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(formattedData),
        });

        if (response.ok) {
          await dbService.markDataAsSynced(model, idsToSync);
          console.log(`${model} data synced successfully`);
        } else {
          const errorText = await response.text();
          console.error(
            `Failed to sync ${model} data, server error: ${errorText}`,
          );
        }
      } catch (error: any) {
        console.error(`Failed to sync ${model} data:`, error.message ?? error);
      }
    }
  } finally {
    isSyncing = false;
  }
};
