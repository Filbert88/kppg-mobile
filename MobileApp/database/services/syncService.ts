import SQLiteService from './SQLiteService';
import NetInfo from '@react-native-community/netinfo';

const sqliteService = new SQLiteService();

const API_ENDPOINTS: {[key: string]: string} = {
  DepthAverage: 'http://10.0.2.2:5180/api/DepthAverage',
  FragmentationData: 'http://10.0.2.2:5180/api/FragmentationData',
};

const MODELS = ['DepthAverage', 'FragmentationData'];

export const syncLocalDataWithBackend = async () => {
  await sqliteService.init();

  NetInfo.fetch().then(async state => {
    if (state.isConnected) {
      for (const model of MODELS) {
        const unsyncedData = await sqliteService.getUnsyncedData(model);
        console.log(`Syncing ${model} data:`, unsyncedData);

        if (unsyncedData.length > 0) {
          const idsToSync = unsyncedData.map(data => data.id);
          const endpoint = API_ENDPOINTS[model];

          const formattedData = unsyncedData.map(data => ({
            imageUri: data.imageUri ?? 'default_uri', 
            jumlahLubang: data.jumlahLubang || 'N/A',
            lokasi: data.lokasi || 'Unknown',
            tanggal: data.tanggal
              ? new Date(data.tanggal).toISOString()
              : new Date().toISOString(),
            kedalaman: data.kedalaman ?? '{}', 
            average: data.average ?? '0', 
            synced: data.synced ?? 0, 
          }));

          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formattedData),
            });

            if (response.ok) {
              await sqliteService.markDataAsSynced(model, idsToSync);
              console.log(`${model} data synced successfully`);
            } else {
              const errorText = await response.text();
              console.error(
                `Failed to sync ${model} data, server error: ${errorText}`,
              );
            }
          } catch (error: any) {
            console.error(
              `Failed to sync ${model} data:`,
              error.message ?? error,
            );
          }
        }
      }
    } else {
      console.log('No internet connection, sync postponed');
    }
  });
};
