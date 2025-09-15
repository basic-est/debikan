import { openDatabase } from 'react-native-sqlite-storage';

const db = openDatabase({ name: 'debikan.db', location: 'default' });

export const initDB = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          account TEXT NOT NULL,
          default_day INTEGER
        );`,
        [],
        () => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS MonthlyAmounts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              item_id INTEGER,
              date TEXT NOT NULL,
              amount INTEGER NOT NULL,
              paid BOOLEAN DEFAULT 0,
              FOREIGN KEY (item_id) REFERENCES Items (id) ON DELETE CASCADE
            );`,
            [],
            () => resolve(),
            (_, err) => reject(err)
          );
        },
        (_, err) => reject(err)
      );
    });
  });
};

export const getItems = () => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM Items',
                [],
                (tx, results) => {
                    let items = [];
                    for (let i = 0; i < results.rows.length; ++i) {
                        items.push(results.rows.item(i));
                    }
                    resolve(items);
                },
                (tx, err) => {
                    reject(err);
                }
            );
        });
    });
};

export const addItem = (name, account, default_day) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'INSERT INTO Items (name, account, default_day) VALUES (?, ?, ?)',
                [name, account, default_day],
                (tx, results) => {
                    resolve(results.insertId);
                },
                (tx, err) => {
                    reject(err);
                }
            );
        });
    });
};

export const updateItem = (id, name, account, default_day) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'UPDATE Items SET name = ?, account = ?, default_day = ? WHERE id = ?',
                [name, account, default_day, id],
                (tx, results) => {
                    resolve(results.rowsAffected);
                },
                (tx, err) => {
                    reject(err);
                }
            );
        });
    });
};

export const deleteItem = (id) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'DELETE FROM Items WHERE id = ?',
                [id],
                (tx, results) => {
                    resolve(results.rowsAffected);
                },
                (tx, err) => {
                    reject(err);
                }
            );
        });
    });
};

export const getMonthlyAmountsByMonth = (month, year) => {
    return new Promise((resolve, reject) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM MonthlyAmounts WHERE date BETWEEN ? AND ?',
                [startDate, endDate],
                (tx, results) => {
                    let amounts = {};
                    for (let i = 0; i < results.rows.length; ++i) {
                        const item = results.rows.item(i);
                        amounts[item.item_id] = item;
                    }
                    resolve(amounts);
                },
                (tx, err) => {
                    reject(err);
                }
            );
        });
    });
};

export const saveMonthlyAmount = (itemId, date, amount, paid) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM MonthlyAmounts WHERE item_id = ? AND date = ?',
                [itemId, date],
                (tx, results) => {
                    if (results.rows.length > 0) {
                        // Update
                        tx.executeSql(
                            'UPDATE MonthlyAmounts SET amount = ?, paid = ? WHERE id = ?',
                            [amount, paid, results.rows.item(0).id],
                            (tx, results) => {
                                resolve(results.rowsAffected);
                            },
                            (tx, err) => {
                                reject(err);
                            }
                        );
                    } else {
                        // Insert
                        tx.executeSql(
                            'INSERT INTO MonthlyAmounts (item_id, date, amount, paid) VALUES (?, ?, ?, ?)',
                            [itemId, date, amount, paid],
                            (tx, results) => {
                                resolve(results.insertId);
                            },
                            (tx, err) => {
                                reject(err);
                            }
                        );
                    }
                },
                (tx, err) => {
                    reject(err);
                }
            );
        });
    });
};