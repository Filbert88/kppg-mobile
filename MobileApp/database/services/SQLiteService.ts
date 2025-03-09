import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';

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
        await this.createTables();
      } catch (error) {
        console.error('Failed to open database:', error);
      }
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
      lokasi TEXT,
      tanggal TEXT,
      kedalaman TEXT,
      average TEXT,
      synced INTEGER DEFAULT 0
    )`,
      `CREATE TABLE IF NOT EXISTS FragmentationData (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imageUri TEXT,
      measurement TEXT,
      location TEXT,
      date TEXT,
      result TEXT,
      synced INTEGER DEFAULT 0
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

  async saveData(model: string, data: any) {
    if (!this.db) return;

    let query = '';
    let params: any[] = [];

    switch (model) {
      case 'DepthAverage':
        query = `INSERT INTO DepthAverage (imageUri, jumlahLubang, lokasi, tanggal, kedalaman, average, synced)
                 VALUES (?, ?, ?, ?, ?, ?, 0)`;
        params = [
          data.imageUri,
          data.jumlahLubang,
          data.lokasi,
          data.tanggal,
          JSON.stringify(data.kedalaman),
          data.average,
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
      const results = await this.db.executeSql(`SELECT * FROM ${model} WHERE synced = 0`);
      return results[0].rows.raw();
    } catch (error) {
      console.error(`Failed to fetch unsynced data for ${model}:`, error);
      return [];
    }
  }

  async markDataAsSynced(model: string, ids: number[]) {
    if (!this.db) return;
    try {
      await this.db.executeSql(`UPDATE ${model} SET synced = 1 WHERE id IN (${ids.join(',')})`);
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
