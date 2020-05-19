const SQLiteWrapper = require('./SqliteWrapper');
const GoogleTranslate = require('./GoogleTranslate');
const path = require('path');
const thisFile = path.basename(__filename);

class LocalizablesUtils {
    constructor(){
        this.googleTranslate = new GoogleTranslate();
    }
    async checkAndUpdateIfRequired(sqliteWrapper, baseFlatJsonLang, languageCode){
        //console.log(baseFlatJsonLang)
        let localizedLangDbFlatJson = await sqliteWrapper.getAsFlattedJson(languageCode);

        /**
         * Find Items which does not exist in base language any more.
         * 1. If they exist in Language Database, and have static value, then set 'static_status' = 'DELETED_FROM_BASE'
         *      else, DELETE row from database
         */
        for(let dbItem of localizedLangDbFlatJson) {
            let rowInBaseLang = baseFlatJsonLang.filter( item => item.key === dbItem.key).shift();
            if(typeof rowInBaseLang === "undefined"){
                if( typeof dbItem["static"] !== "undefined" && dbItem["static"] != null) {
                    dbItem.static_status = "DELETED_FROM_BASE";
                    /// update SQL
                    console.log(`${thisFile}::> languageCode:${languageCode} found deleted key in base language: ${dbItem.key}\n however, the key has Static value and require attention. static_status set as 'DELETED_FROM_BASE'`);
                    await sqliteWrapper.write(languageCode, dbItem.key, dbItem.value, dbItem.originalValue, dbItem.static, dbItem.static_status, dbItem.checksum);
                } else {
                    /// Just add to delete list and delete from this list
                    console.log(`${thisFile}::> languageCode:${languageCode} found deleted key: '${dbItem.key}' \n It will remove key row from local database`);
                    await sqliteWrapper.delete(languageCode, dbItem.key);
                }
            }
        }
        localizedLangDbFlatJson = await sqliteWrapper.getAsFlattedJson(languageCode);

        /**
         * FIND MISSING OR NEW ITEMS
         * ONLY STRINGS NEED TRANSLATION --- SO FILTER STRING VALUES
         * Find Items which does not exist in localized language Database. known as 'NEW' item.
         * Add them to a list and fetch from Google Translate
         */
        let listOfNonStringLocalizationsRequireToTranslate = []
        let listOfLocalizationsRequireToTranslate = [];
        for(let baseItem of baseFlatJsonLang ) {
            let rowInLocalizedDb = localizedLangDbFlatJson.filter( item => item.key === baseItem.key).shift();
            //console.log(`${JSON.stringify(baseItem, null, 4)}`);
            /// Add missing in Database
            if(typeof rowInLocalizedDb === "undefined" || rowInLocalizedDb === null){
                // Translation applies to Strings only
                if(typeof baseItem.value === 'string') {
                    //console.log(`item found for new translation ${JSON.stringify(baseItem)}  rowInLocalizedDb:${typeof localizedLangDbFlatJson}`)
                    listOfLocalizationsRequireToTranslate.push( baseItem );
                } else {
                    /// Add Them to list of non String
                    listOfNonStringLocalizationsRequireToTranslate.push(baseItem);
                }
            }
        }

        for(let baseItem of baseFlatJsonLang ) {
            /// At this point, donot process non string values
            if(typeof baseItem.value !== 'string') {
                continue;
            }
            let rowInLocalizedDb = localizedLangDbFlatJson.filter( item => (item.key === baseItem.key) && (item.originalValue !== baseItem.value)).shift();

            if(typeof rowInLocalizedDb !== 'undefined'){
                //console.log(`${JSON.stringify(rowInLocalizedDb, null, 4)}`);
                if(typeof rowInLocalizedDb.static === 'undefined' || rowInLocalizedDb.static === null){
                    //listOfLocalizationsRequireToTranslate.push( baseItem );
                    listOfLocalizationsRequireToTranslate.push( baseItem );
                } else {
                    rowInLocalizedDb.value = baseItem.value;
                    listOfLocalizationsRequireToTranslate.push( rowInLocalizedDb );
                    console.log(`${JSON.stringify(baseItem, null, 4)}\n${JSON.stringify(rowInLocalizedDb, null, 4)}`);
                }
            }
            /// Add missing in Database
            /*
            if(typeof rowInLocalizedDb === "undefined" || rowInLocalizedDb === null){
                // Translation applies to Strings only
                if(typeof baseItem.value === 'string') {
                    //console.log(`item found for new translation ${JSON.stringify(baseItem)}  rowInLocalizedDb:${typeof localizedLangDbFlatJson}`)
                    listOfLocalizationsRequireToTranslate.push( baseItem );
                }
            }
            */
        }

        try {
            if( listOfLocalizationsRequireToTranslate.length > 0){
                console.log(`${thisFile}::> languageCode:${languageCode} found ${listOfLocalizationsRequireToTranslate.length} items required to be translated`);
                let translationsResult = await this.googleTranslate.translateFromBaseLangJson(listOfLocalizationsRequireToTranslate, process.env.BASE_LANG, languageCode);
                if(translationsResult.length < listOfLocalizationsRequireToTranslate.length) {
                    throw Error(`Request for translation sent for ${listOfLocalizationsRequireToTranslate.length} items but received only ${translationsResult.length} items`);
                }
                if(translationsResult.length > 0){
                    console.log(`${thisFile}::checkAndUpdateLanguage :> Localizable json for language code '${languageCode}' translated 'received:${translationsResult.length}'||'requested:${listOfLocalizationsRequireToTranslate.length}' NEW items using google Translate.\nWrtting to Database...`);
                   // console.log(JSON.stringify(translationsResult, null, 1))
                    for(let item of translationsResult){
                        console.log(`Item to write on Sqlite3 ::> ${JSON.stringify(item, null, 4)}`);
                        await sqliteWrapper.write(languageCode, item.key, item.value, item.originalValue, item.static, item.static_status, item.checksum);
                    }
                    console.log("Wrote to db")
                }
            } else {
                console.log(`${thisFile} No translations required for language:${languageCode}`);
            }
        }catch (e) {
            console.log("CATCHED HERE");
            throw e;
        }

        try{
            for(let item of listOfNonStringLocalizationsRequireToTranslate) {
                console.log(item);
                await sqliteWrapper.write(languageCode, item.key, item.value, item.value, null, null, item.checksum);
            }
        }catch (e) {
            console.trace(`Process failed. error:${e}`);
            throw e;
        }

        /*
        let sqlLangTranslationRequiredListFromBase = {};
        /// Find Changed Rows
        for(let key of Object.keys(baseFlatJsonLang)){
            console.log(`base:${key}`);
            let valueInSql = localizedLangDbFlatJson[key];
            if(typeof valueInSql === "undefined"){
                ///console.log(`Key does not exist in sql ${key}`)
                sqlLangTranslationRequiredList[key] = baseFlatJsonLang[key];

                /// if no static, then delete from SQL

            } else {
                let baseChecksum = baseFlatJsonLang[key].checksum;
                let sqlChecksum = valueInSql.checksum;

                /// if sql has static, set static as invalid checksum
            }
        }

        console.log(`Key does not exist in sql ${JSON.stringify(sqlLangTranslationRequiredListFromBase, null, 4)}`)

         */
    }
}

module.exports = LocalizablesUtils;