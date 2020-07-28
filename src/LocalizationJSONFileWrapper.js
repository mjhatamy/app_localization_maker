const fs = require('fs');
const path = require('path');
const JsonUtil = require("./JsonUtil");
var crypto = require('crypto');
const thisFile = path.basename(__filename);

class LocalizationJSONFileWrapper {
    constructor(src_dir){
        if( typeof src_dir === 'undefined' || src_dir == null ){
            throw "Instantiation of class LocalizationJSONFileWrapper require to specify src root directory of the main app";
        }
        this.src_dir = src_dir;
        if( !fs.existsSync( this.getLocalizationFilePath() ) ){
            console.error(`localizationJsonFile at : ${this.getLocalizationFilePath()} does not exist. check file path and try again.`);
            throw `localizationJsonFile at : ${this.getLocalizationFilePath()} does not exist. check file path and try again.`
        }

        let localizationJsonContent = fs.readFileSync(this.getLocalizationFilePath() );
        this.localizationJson = JSON.parse(localizationJsonContent);
        this.localizationJson  = new JsonUtil().sort(this.localizationJson);
        //console.log( JSON.stringify(this.localizationJson, null, 4) )
        this.flatLocalizationJson =  this.toSimpleFlatFormat(this.localizationJson);

        //this.flatLocalizationJson = this.toHashedFlatFormat(m_localizationFlatJson);
        //console.log( JSON.stringify(this.flatLocalizationJson, null, 4) );

        /// Find Duplicate key
        let duplicateItems = []
        for(let item of this.flatLocalizationJson){
            let dup = this.flatLocalizationJson.filter( sitem => sitem.value === item.value )

            if(dup.length > 1 ){
                //console.log(dup)
                duplicateItems.push(dup)
                //throw Error("MORE THAN 1 item. duplicate key")
            }
        }
        //console.trace(`Duplicate Items found in base Localizable.\n${JSON.stringify(duplicateItems, null, 4)}`);
        console.log("ATTENTION......  FIX Duplicate items...... check LocalizationJSONFileWrapper");
        console.log("ADD ORIGINAL VALUE UNIQUE CONSTRAINT TO SQLITE")
    }
    getLocalizationFilePath(){
        return `${this.src_dir}/${process.env.BASE_Localizable_Json}`;
    }

    /*
    toHashedFlatFormat(localizationJsonArray) {
        let hashedFlatJson = {};
        for(const [key, value] of Object.entries( localizationJsonArray ) ) {
            //console.log(`Key:${key}--->value:${value}`);
            hashedFlatJson[key] = {
                value: value,
                checksum: crypto.createHash('md5').update(`${value}`).digest('hex')
            }
        }
        return hashedFlatJson;
    }
    */

    toSimpleFlatFormat(localizationJson){
        let flatJson = {};
        let nested = function(json, initialKey){
            //let path = initialKey
            Object.keys(json).forEach(function(key) {
                if (typeof (json[key]) === 'object') {
                    nested(json[key], `${initialKey}.${key}`);
                } else {
                    flatJson[`${initialKey}.${key}`] = json[key];
                }
            });
        };
        const weak_this = this;
        Object.keys(localizationJson).forEach(function(key) {
            if (typeof (localizationJson[key]) === 'object') {
                nested(localizationJson[key], key);
            } else {
                flatJson[key] = localizationJson[key];
            }
        });

        /// To Array now
        let flatJsonArray = [];
        Object.keys(flatJson).forEach(function(key) {
            flatJsonArray.push( { key: key, value: flatJson[key], checksum: crypto.createHash('md5').update(`${flatJson[key]}`).digest('hex') })
        });

        return flatJsonArray;
    }

}

module.exports = LocalizationJSONFileWrapper;