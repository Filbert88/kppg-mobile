import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';
import {FragmentationData} from '../../context/FragmentationContext';

SQLite.enablePromise(true);

const DATABASE_NAME = 'DepthAverage.db';

export default class SQLiteService {
  private db: SQLiteDatabase | null = null;

  async init() {
    if (!this.db) {
      try {
        this.db = await SQLite.openDatabase({
          name: DATABASE_NAME,
          location: 'default',
        });
        console.log('Database opened');
        //         await this.dropFragmentationDataTable();
        await this.createTables();
      } catch (error) {
        console.error('Failed to open database:', error);
      }
    }
  }

  async dropFragmentationDataTable() {
    if (!this.db) return;
    try {
      await this.db.executeSql('DROP TABLE IF EXISTS FragmentationData;');
      console.log('FragmentationData table dropped successfully.');
    } catch (error) {

      console.error('Failed to drop FragmentationData table:', error);
    }
  }

  async dropDepthAverageDataTable() {
    if (!this.db) return;
    try {
      await this.db.executeSql('DROP TABLE IF EXISTS DepthAverage;');
      console.log('FragmentationData table dropped successfully.');
    } catch (error) {
      console.error('Failed to drop FragmentationData table:', error);
    }
  }

  async debugGetAllData() {
    if (!this.db) return;
    try {
      const results = await this.db.executeSql(`SELECT * FROM DepthAverage`);
      console.log('Debug - All Data in DB:', results[0].rows.raw());
    } catch (error) {
      console.error('Failed to fetch data for debugging:', error);
    }
  }

  async createTables() {
    if (!this.db) return;

    const tables = [
      `CREATE TABLE IF NOT EXISTS DepthAverage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imageUri TEXT,
      jumlahLubang TEXT,
      prioritas INTEGER,
      lokasi TEXT,
      tanggal TEXT,
      kedalaman TEXT,
      average TEXT,
      synced INTEGER DEFAULT 0
    )`,
      `CREATE TABLE IF NOT EXISTS FragmentationData (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          skala TEXT,
          pilihan TEXT,
          ukuran TEXT,
          prioritas INTEGER,
          lokasi TEXT,
          tanggal TEXT,
          litologi TEXT,
          ammoniumNitrate TEXT,
          volumeBlasting TEXT,
          powderFactor TEXT,
          synced INTEGER DEFAULT 0
       )`,
      // Stores each image in the fragmentation record.
      `CREATE TABLE IF NOT EXISTS FragmentationImages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fragmentationId INTEGER,
          imageUri TEXT,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (fragmentationId) REFERENCES FragmentationData(id) ON DELETE CASCADE
       )`,
      // Stores the result data for each fragmentation image.
      `CREATE TABLE IF NOT EXISTS FragmentationImageResults (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fragmentationImageId INTEGER,
          result1 TEXT,
          result2 TEXT,
          measurement TEXT,  -- JSON string
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (fragmentationImageId) REFERENCES FragmentationImages(id) ON DELETE CASCADE
       )`,
    ];

    try {
      for (const query of tables) {
        await this.db.executeSql(query);
      }
      console.log('Tables created or verified');
    } catch (error) {
      console.error('Failed to create tables:', error);
    }
  }

  async getAllData() {
    if (!this.db) return [];
    try {
      const results = await this.db.executeSql(`SELECT * FROM DepthAverage`);
      return results[0].rows.raw();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return [];
    }
  }

  async saveOrUpdateFragmentationData(data: FragmentationData) {
    if (!this.db) return;
    try {
      // Check if record exists by testing if data.id is defined and a number.
      if (data.id && !isNaN(data.id)) {
        // 1. Update the main fragmentation record.
        await this.db.executeSql(
          `UPDATE FragmentationData 
           SET skala = ?,
               pilihan = ?,
               ukuran = ?,
               prioritas = ?,
               lokasi = ?,
               tanggal = ?,
               litologi = ?,
               ammoniumNitrate = ?,
               volumeBlasting = ?,
               powderFactor = ?
           WHERE id = ?`,
          [
            data.skala,
            data.pilihan,
            data.ukuran,
            data.prioritas,
            data.lokasi,
            data.tanggal,
            data.litologi,
            data.ammoniumNitrate,
            data.volumeBlasting,
            data.powderFactor,
            data.id,
          ],
        );
        console.log('FragmentationData updated with id:', data.id);
        // 2. Delete existing images for this record.
        await this.db.executeSql(
          `DELETE FROM FragmentationImages WHERE fragmentationId = ?`,
          [data.id],
        );
        // 3. Reinsert the images from data.imageUris.
        for (const image of data.rawImageUris) {
          await this.db.executeSql(
            `INSERT INTO FragmentationImages (fragmentationId, imageUri, synced)
             VALUES (?, ?, 0)`,
            [data.id, image],
          );
        }
      } else {
        // New record: Insert the main fragmentation record.
        const insertMain = await this.db.executeSql(
          `INSERT INTO FragmentationData (
             skala,
             pilihan,
             ukuran,
             prioritas,
             lokasi,
             tanggal,
             litologi,
             ammoniumNitrate,
             volumeBlasting,
             powderFactor,
             synced
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            data.skala,
            data.pilihan,
            data.ukuran,
            data.prioritas,
            data.lokasi,
            data.tanggal,
            data.litologi,
            data.ammoniumNitrate,
            data.volumeBlasting,
            data.powderFactor,
          ],
        );
        const mainId = insertMain[0].insertId;
        console.log('FragmentationData saved with id:', mainId);
        // Insert each image.
        for (const image of data.rawImageUris) {
          await this.db.executeSql(
            `INSERT INTO FragmentationImages (fragmentationId, imageUri, synced)
             VALUES (?, ?, 0)`,
            [mainId, image],
          );
        }
      }
    } catch (error) {
      console.error('Failed to save/update FragmentationData:', error);
    }
  }

  async getFragmentationData(): Promise<any[]> {
    if (!this.db) return [];

    try {
      // Step 1: Retrieve all records from FragmentationData.
      const mainResults = await this.db.executeSql(
        `SELECT * FROM FragmentationData`,
      );
      const mainRecords = mainResults[0].rows.raw();

      // Step 2: For each main record, retrieve the related images.
      for (const record of mainRecords) {
        const imageResults = await this.db.executeSql(
          `SELECT * FROM FragmentationImages WHERE fragmentationId = ?`,
          [record.id],
        );
        const images = imageResults[0].rows.raw();

        // Step 3: For each image, retrieve the associated results.
        for (const image of images) {
          const resultResults = await this.db.executeSql(
            `SELECT * FROM FragmentationImageResults WHERE fragmentationImageId = ?`,
            [image.id],
          );
          if (resultResults[0].rows.length > 0) {
            image.resultData = resultResults[0].rows.raw()[0];
          } else {
            image.resultData = null;
          }
        }

        // Attach the images array to the main record.
        record.images = images;
      }

      return mainRecords;
    } catch (error) {
      console.error('Failed to get fragmentation data:', error);
      return [];
    }
  }

  async saveData(model: string, data: any) {
    if (!this.db) return;

    let query = '';
    let params: any[] = [];

    switch (model) {
      case 'DepthAverage':
        query = `INSERT INTO DepthAverage (imageUri, jumlahLubang, lokasi, tanggal, kedalaman, average, prioritas, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`;
        params = [
          data.imageUri || null,
          data.jumlahLubang || null,
          data.lokasi || null,
          data.tanggal || null,
          data.kedalaman ? JSON.stringify(data.kedalaman) : null,
          data.average || null,
          data.prioritas || 0,
        ];
        break;

      case 'FragmentationData':
        query = `INSERT INTO FragmentationData (imageUri, measurement, location, date, result, synced)
                 VALUES (?, ?, ?, ?, ?, 0)`;
        params = [
          data.imageUri,
          data.measurement,
          data.location,
          data.date,
          data.result,
        ];
        break;

      default:
        console.error('Unsupported model type');
        return;
    }

    try {
      await this.db.executeSql(query, params);
      console.log(`${model} data saved locally`);
    } catch (error) {
      console.error(`Failed to save data for ${model}:`, error);
    }
  }

  async getUnsyncedData(model: string) {
    if (!this.db) return [];
    try {
      const results = await this.db.executeSql(
        `SELECT * FROM ${model} WHERE synced = 0`,
      );
      return results[0].rows.raw();
    } catch (error) {
      console.error(`Failed to fetch unsynced data for ${model}:`, error);
      return [];
    }
  }

  async markDataAsSynced(model: string, ids: number[]) {
    if (!this.db) return;
    try {
      await this.db.executeSql(
        `UPDATE ${model} SET synced = 1 WHERE id IN (${ids.join(',')})`,
      );
      console.log(`${model} data marked as synced`);
    } catch (error) {
      console.error(`Failed to mark data as synced for ${model}:`, error);
    }
  }

  async deleteData(id: number) {
    if (!this.db) return;
    try {
      await this.db.executeSql(`DELETE FROM DepthAverage WHERE id = ?`, [id]);
      console.log('Data deleted');
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
  }

  async clearAllData() {
    if (!this.db) return;
    try {
      await this.db.executeSql(`DELETE FROM DepthAverage`);
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
}
