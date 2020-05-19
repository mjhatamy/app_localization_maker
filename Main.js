const sleep = require('sleep');
const LocalizationJSONFileWrapper = require('./src/LocalizationJSONFileWrapper');
const SQLiteWrapper = require('./src/SqliteWrapper');
const ProcessLocalizations = require('./src/ProcessLocalizations');
const SwiftPresentationStringGenerator = require('./src/IosSwiftPresentationStringGenerator');
const DartPresentationStrings = require('./src/DartPresentationStrings');
const Locale = require('./src/Locale');

const SUPPORTED_LANG = [
    "da",
    "de",
    "en",
    "fa",
    "fr",
    "hu",
    "it",
    "ja",
    "ro",
    "ru",
    "tr",

];

const SupportedLanguages = [
    new Locale('en', 'US'),
    new Locale('fa', 'IR'),
    new Locale('it', 'IT')
]

class Main {
    constructor(src_dir){
        if (typeof src_dir === 'undefined' || src_dir == null) {
            throw "Instantiation of class SQLiteWrapper require to specify src root directory of the main app";
        }
        this.src_dir = src_dir;
        this.localizationJSONFileWrapper = new LocalizationJSONFileWrapper(this.src_dir);
        this.sqliteWrapper = new SQLiteWrapper(this.src_dir);
        this.processJsonLocalizations = new ProcessLocalizations();
    }


    async buildDart() {
        try {
            await this._build();

            /// Write Base Language
            let locale = new Locale('en', 'US');

            let dartProcessor = new DartPresentationStrings(SupportedLanguages);
            await dartProcessor.localizationStringFileGenerator( locale, this.localizationJSONFileWrapper.flatLocalizationJson);
            for(let locale of SupportedLanguages){
                if(locale.languageCode === process.env.BASE_LANG){
                    continue;
                }
                let localizedLangDbFlatJson = await this.sqliteWrapper.getAsFlattedJson(locale.languageCode);
                await dartProcessor.localizationStringFileGenerator(locale, localizedLangDbFlatJson);
            }
            await dartProcessor.make(this.localizationJSONFileWrapper.localizationJson);
        }catch (e) {
            throw e;
        }
    }

    async buildIOS() {
        try {
            await this._build();

            /// Write Base Language
            await new SwiftPresentationStringGenerator().localizationStringFileGenerator(process.env.BASE_LANG, this.localizationJSONFileWrapper.flatLocalizationJson, true);
            await new SwiftPresentationStringGenerator().localizationStringFileGenerator(process.env.BASE_LANG, this.localizationJSONFileWrapper.flatLocalizationJson);
            for(let lang of SupportedLanguages){
                if(lang.languageCode === process.env.BASE_LANG){
                    continue;
                }
                let localizedLangDbFlatJson = await this.sqliteWrapper.getAsFlattedJson(lang.languageCode);
                await new SwiftPresentationStringGenerator().localizationStringFileGenerator(lang.languageCode, localizedLangDbFlatJson);
            }

            new SwiftPresentationStringGenerator().makeSwiftFile(this.localizationJSONFileWrapper.localizationJson);
        }catch (e) {
            throw e;
        }
    }
    
    async _build(){
        console.log( SupportedLanguages );
        console.log(this.localizationJSONFileWrapper.flatLocalizationJson.filter( item=> typeof item.value === 'string').length)
        for(let lang of SupportedLanguages){
            if(lang.languageCode === process.env.BASE_LANG){
                continue;
            }
            await this.processJsonLocalizations.checkAndUpdateIfRequired(this.sqliteWrapper, this.localizationJSONFileWrapper.flatLocalizationJson, lang.languageCode);
        }

        this.sqliteWrapper.closeDb();
        console.log("DONE  212")
        /// Validate Original Json File and find Changed Fields

        /// Validate Original JSon File against all languages

        /// Rebuild Localizable files for all available languages

        /// Rebuild Presentation String Swift File
    }
}

module.exports = Main;