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