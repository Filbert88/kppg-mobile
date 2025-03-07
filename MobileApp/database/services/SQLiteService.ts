import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DATABASE_NAME = 'DepthAverage.db';

export default class SQLiteService {
  private db: SQLiteDatabase | null = null;

  async init() {
    if (!this.db) {
      try {
        this.db = await SQLite.openDatabase({ name: DATABASE_NAME, location: 'default' });
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

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS DepthAverage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imageUri TEXT,
        jumlahLubang TEXT,
        lokasi TEXT,
        tanggal TEXT,
        kedalaman TEXT,
        average TEXT,
        synced INTEGER DEFAULT 0
      );
    `;

    try {
      await this.db.executeSql(createTableQuery);
      console.log('Table created or exists already');
    } catch (error) {
      console.error('Failed to create table:', error);
    }
  }

  async saveData(formData: any) {
    if (!this.db) return;

    const { imageUri, jumlahLubang, lokasi, tanggal, kedalaman, average } = formData;
    const kedalamanString = JSON.stringify(kedalaman);

    try {
      await this.db.executeSql(
        `INSERT INTO DepthAverage (imageUri, jumlahLubang, lokasi, tanggal, kedalaman, average, synced)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [imageUri, jumlahLubang, lokasi, tanggal, kedalamanString, average]
      );
      console.log('Data saved locally');
    } catch (error) {
      console.error('Failed to save data:', error);
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

  async getUnsyncedData() {
    if (!this.db) return [];
    try {
      const results = await this.db.executeSql(`SELECT * FROM DepthAverage WHERE synced = 0`);
      return results[0].rows.raw();
    } catch (error) {
      console.error('Failed to fetch unsynced data:', error);
      return [];
    }
  }

  async markDataAsSynced(ids: number[]) {
    if (!this.db) return;
    try {
      await this.db.executeSql(`UPDATE DepthAverage SET synced = 1 WHERE id IN (${ids.join(',')})`);
      console.log('Data marked as synced');
    } catch (error) {
      console.error('Failed to mark data as synced:', error);
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
