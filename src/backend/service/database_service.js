import sqlite3 from 'sqlite3'

export class DatabaseService {
  constructor() {
    // Open database file
    this.db = new sqlite3.Database('./src/backend/database.sqlite', {
      'open': true
    });

    // Create tables
    this.db.exec('CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, splash_art_url TEXT);');
    this.db.exec('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, media_id INTEGER NOT NULL, FOREIGN KEY(media_id) REFERENCES media(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS options (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon_url TEXT, category_id INTEGER NOT NULL, FOREIGN KEY(category_id) REFERENCES categories(id))');
    this.db.exec('CREATE TABLE IF NOT EXISTS user_roles (identifier TEXT NOT NULL, role TEXT NOT NULL, PRIMARY KEY(identifier,role))');
  }

  add_user_role(identifier, role) {
    const insert = this.db.prepare('INSERT INTO user_roles (identifier, role) VALUES (?, ?)');
    insert.run(identifier, role);
    insert.finalize();
  }

  remove_user_role(identifier, role) {
    const del = this.db.prepare('DELETE FROM user_roles WHERE identifier=? AND role=?');
    del.run(identifier, role);
    del.finalize();
  }

  get_user_roles(identifier) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT role FROM user_roles WHERE identifier = ?';

      this.db.all(sql, [identifier], (err, rows) => {
        if (err) {
          console.error(err);
          return [];
        }

        resolve(rows.map(row => row.role));
      });
    });
  }
}
