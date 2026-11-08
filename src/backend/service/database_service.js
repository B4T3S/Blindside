import sqlite3 from 'sqlite3'

export class DatabaseService {
  constructor() {
    // Open database file
    this.db = new sqlite3.Database('./database.sqlite', {
      'open': true
    });

    // Create tables
    this.db.exec('CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, splash_art_url TEXT);');
    this.db.exec('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, media_id INTEGER NOT NULL, FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE CASCADE)');
    this.db.exec('CREATE TABLE IF NOT EXISTS options (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon_url TEXT, category_id INTEGER NOT NULL, FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE)');
    this.db.exec('CREATE TABLE IF NOT EXISTS user_roles (identifier TEXT NOT NULL, role TEXT NOT NULL, PRIMARY KEY(identifier,role))');
    this.db.run('PRAGMA foreign_keys = ON');
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
    return new Promise((resolve) => {
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

  get_all_media() {
    return new Promise((resolve) => {
      const sql = 'SELECT * FROM media';

      this.db.all(sql, (err, rows) => {
        if (err) {
          console.error(err);
          return [];
        }

        resolve(rows);
      });
    });
  }

  add_media(name, splash_art_url) {
    return new Promise((resolve) => {
      const insert = this.db.prepare('INSERT INTO media (name, splash_art_url) VALUES(?, ?);');

      insert.run(name, splash_art_url, function (err) {
        if(err) {
          console.log(err);
          return;
        }

        const id = this.lastID;

        insert.finalize();
        resolve(id);
      });
    });
  }

  delete_media(id) {
    const del = this.db.prepare('DELETE FROM media WHERE id = ?');

    del.run(id);
    del.finalize();
  }

  get_all_categories(mediaId) {
    return new Promise((resolve) => {
      const sql = this.db.prepare('SELECT * FROM categories WHERE media_id = ?');

      sql.all(mediaId, (err, rows) => {
        if (err) {
          console.error(err);
          return [];
        }

        resolve(rows);
      });
    });
  }

  add_category(mediaId, name) {
    return new Promise((resolve) => {
      const insert = this.db.prepare("INSERT INTO categories (name, media_id) VALUES(?, ?);");

      insert.run(name, mediaId, function (err) {
        if(err) {
          console.log(err);
          return;
        }

        const id = this.lastID;

        insert.finalize();
        resolve(id);
      });

    });

  }

  delete_category(id) {
    const del = this.db.prepare("DELETE FROM category WHERE id = ?");

    del.run(id);
    del.finalize();
  }

  get_all_options(categoryId) {
    return new Promise((resolve) => {
      const sql = this.db.prepare('SELECT * FROM options WHERE category_id = ?');

      sql.all(categoryId, (err, rows) => {
        if (err) {
          console.error(err);
          return [];
        }

        resolve(rows);
      });
    })
  }

  add_option(categoryId, name, iconUrl) {
    return new Promise((resolve) => {
      const insert = this.db.prepare("INSERT INTO options (name, category_id, icon_url) VALUES(?, ?, ?);");

      insert.run(name, categoryId, iconUrl, function(err) {
        if(err) {
          console.log(err);
          return;
        }

        const id = this.lastID;

        insert.finalize();
        resolve(id);
      });
    });
  }

  delete_option(id) {
    const del = this.db.prepare("DELETE FROM options WHERE id = ?");

    del.run(id);
    del.finalize();
  }
}
