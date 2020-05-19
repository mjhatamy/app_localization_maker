const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const thisFile = path.basename(__filename);

class SQLiteWrapper {
    constructor(src_dir) {
        if (typeof src_dir === 'undefined' || src_dir == null) {
            throw "Instantiation of class SQLiteWrapper require to specify src root directory of the main app";
        }
        this.src_dir = src_dir;
        this.dbIsOpen = false
    }

    async openDb() {
        if (this.dbIsOpen) {
            return;
        }
        try {
            this.db = this.db = await new sqlite3.Database(`${this.src_dir}/localizations.sqlite3`, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
            this.dbIsOpen = true;
        } catch (e) {
            throw e;
        }
    }

    closeDb() {
        if (this.db !== undefined) {
            this.db.close();
            this.dbIsOpen = false;
        }
    }

    async getAsFlattedJson(languageCode) {
        const weak_this = this;
        return new Promise(async (resolve, reject) => {
            try {
                await this.openDb();
                await this.createTableIfNotExist(languageCode);
                weak_this.db.all(`SELECT * FROM "main"."${languageCode}" ORDER BY key;`, [], (err, rows) => {
                    if (err) {
                        console.error(err);
                        throw err;
                    }
                    let results = [];
                    rows.forEach(row => {
                        ///console.log(row);
                        results.push(row);
                    });
                    resolve(results);
                });
            } catch (e) {
                reject(e);
                throw e;
            }
        });
    }

    async updateLanguage(flatLocalizableJson, languageCode) {
        try {
            await this.createTableIfNotExist(languageCode);
            //await this.clearTable( process.env.BASE_LANG);
            //await this.write(flatLocalizableJson, process.env.BASE_LANG);
            //console.log("DONE")
        } catch (e) {
            console.error("Failed to getFlatJson");
            throw e;
        }
    }

    /*
    async updateBaseLanguage(flatLocalizableJson){
        try{
            await this.createBaseTableIfNotExist(process.env.BASE_LANG);
            await this.clearTable( process.env.BASE_LANG);
            for(const [key, value] of Object.entries( flatLocalizableJson ) ) {
                //console.log(`Key:${key}--->value:${value}`);
                await this.write( process.env.BASE_LANG, key, value, null);
            }
            //resolve(true);
            return true
        }catch (e) {
            console.error("Failed to getFlatJson");
            throw e;
        }
    }
    */

    clearTable(languageCode) {
        const weak_this = this;
        return new Promise(async (resolve, reject) => {
            try {
                await weak_this.db.run(`DELETE FROM "main"."${languageCode}" ;`);
                resolve(true);
            } catch (e) {
                console.log(e);
                reject(e)
            }
        });
    }

    write(languageCode, key, value, originalValue, staticValue, static_status, checksum) {
        const weak_this = this;
        return new Promise(async (resolve, reject) => {
            await this.openDb();
            let selectVal = await weak_this.select(languageCode, key);
            //console.log(`selectVal item :${JSON.stringify(selectVal)}`);

            weak_this.db
                .run(`REPLACE INTO "main"."${languageCode}"( key, value, originalValue, static, static_status, checksum, modifiedAt) VALUES( ?, ?, ?, ?, ?, ?, ?);`,
                    [key, value, originalValue, staticValue, static_status, checksum, Math.floor(new Date() / 1000)], function(err) {
                        if (err) {
                            console.trace(`Provided parameters. JSON Write to SQLite error. ${err}\n
                                                    languageCode:${languageCode}\nkey:${key}\nvalue:${value}\noriginalValue:${originalValue}\n
                                                    staticValue:${staticValue}\nstatic_status:${static_status}\nchecksum:${checksum}\n`);
                            reject(err);
                        } else {
                            //console.log(`Rows inserted`);
                            //weak_this.db.commit();
                            resolve(true);
                        }
                    });
        });
    }

    select(languageCode, key) {
        const weak_this = this;
        return new Promise(async (resolve, reject) => {
            try {
                await this.openDb();
                await this.createTableIfNotExist(languageCode);
                weak_this.db.all(`SELECT * FROM "main"."${languageCode}" WHERE key = ? ORDER BY key;`, [key], (err, rows) => {
                    if (err) {
                        console.error(err);
                        throw err;
                    }
                    let results = [];
                    rows.forEach(row => {
                        ///console.log(row);
                        results.push(row);
                    });
                    resolve(results);
                });
            } catch (e) {
                reject(e);
                throw e;
            }
        });
    }


    delete(languageCode, key) {
        const weak_this = this;
        return new Promise(async (resolve, reject) => {
            weak_this.db
                .run(`DELETE FROM "main"."${languageCode}" WHERE key = ?;`, [key], (err) => {
                    if(err){
                        console.trace(`DELETE FAILED. Provided parameters. JSON Write to SQLite error. ${e}\n
                                                    languageCode:${languageCode}\nkey:${key}`);
                        reject(err);
                    }else{
                        resolve(true);
                    }
                });
        });
    }

    /*
    writeToBase(languageCode, key, value, checksum){
        const weak_this = this;
        return new Promise(async (resolve, reject) => {
            try {
                let result = await weak_this.db.run(`REPLACE INTO "main"."${languageCode}"( key, value, static, checksum) VALUES( ?, ?, ?, ?);`, [key, value, checksum, Math.floor(new Date() / 1000)]);
                resolve(result);
            }catch (e) {
                console.log(`JSON Write to SQLite error. ${e}`);
                reject(e)
            }
        });
    }
    */

    async getFlatJsonFor(languageCode) {
        try {
            await this.createTableIfNotExist(languageCode);
        } catch (e) {
            console.error("Failed to getFlatJson");
            throw e;
        }
    }

    createTableIfNotExist(languageCode) {
        const weak_this = this;
        return new Promise((resolve, reject) => {
            let dbSchema = `CREATE TABLE IF NOT EXISTS "main"."${languageCode}" (
                            "key" VARCHAR(300) NOT NULL UNIQUE,
                            "value" VARCHAR(32000) NOT NULL,
                            "originalValue" VARCHAR(32000) NOT NULL,
                            "static" TEXT,
                            "static_status" TEXT,
                            "checksum" TEXT NOT NULL,
                            "modifiedAt" real NOT NULL DEFAULT 0,
                            PRIMARY KEY ("key")
                        );
                        
                        CREATE UNIQUE INDEX "main"."indexOnKey"
                            ON "main"."${languageCode}" (
                                "key" ASC
                            );
                        `;

            weak_this.db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${languageCode}'`, function (error, row) {
                if (error != null) {
                    console.trace(error);
                    reject(error);
                    throw error;
                }

                if (row !== undefined) {
                    //console.log("Table Exist");
                    resolve(true);
                } else {
                    console.error(`Table does not exist. creating new table for language ${languageCode}`);
                    weak_this.db.run(dbSchema, function (error) {
                        if (error) {
                            if (error.message.indexOf("already exists") != -1) {
                                console.trace(error);
                                resolve(true);
                            }
                            console.trace(error.message.indexOf("already exists"));
                            throw error;
                            reject(error);
                        } else {
                            resolve(true);
                        }
                    });
                }
            });
        });
    }

    /*
        createBaseTableIfNotExist(languageCode) {
            const weak_this = this;
            return new Promise((resolve, reject) => {
                let dbSchema = `CREATE TABLE IF NOT EXISTS "main"."${languageCode}" (
                                "key" text NOT NULL,
                                "value" TEXT NOT NULL,
                                "base_checksum" TEXT NOT NULL,
                                "modifiedAt" real NOT NULL DEFAULT 0,
                                PRIMARY KEY ("key")
                            );
                            CREATE UNIQUE INDEX "main"."${languageCode}"
                                ON "sortByKey" (
                                    "key" ASC
                                );
                            `;

                weak_this.db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${languageCode}'`, function(error, row) {
                    if(error != null){
                        console.log(error);
                        reject(error);
                        throw error;
                    }

                    if(row !== undefined){
                        console.log("Table Exist");
                        resolve(true);
                    } else {
                        console.error("Table does not exist. creating new table")
                        weak_this.db.run(dbSchema, function(error) {
                            if(error){
                                if (error.message.indexOf("already exists") != -1) {
                                    console.log(error);
                                    resolve(true);
                                }
                                console.error(error.message.indexOf("already exists"));
                                //throw error;
                                reject(error);
                            } else {
                                resolve(true);
                            }
                        });
                    }
                });
            });
        }
    */
}

module.exports = SQLiteWrapper;