const googleTranslate = require('google-translate')("AIzaSyA40yfkjKWOwDH1f1mqoWNwFFfgPQxHtS0");
const sleep = require('sleep');
const path = require('path');
const thisFile = path.basename(__filename);
const maxItemsPerInterval = 600;
const interval = 10;
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

class GoogleTranslate {

    sendToGoogle(list, fromLang, toLang) {
        const weak_this = this;
        return new Promise(async function (resolve, reject) {
            let currentEpochTime = weak_this.timeNow();
            let intervalToWaitThrottle = (GoogleTranslate.lastFetchEpoch + interval) - currentEpochTime;
            if( intervalToWaitThrottle > 0 ) {
                console.log(`Sleeping for ${intervalToWaitThrottle} seconds for next Google API Translation batch`);
                //sleep.sleep(intervalToWaitThrottle);
                await snooze(intervalToWaitThrottle * 1000)
            } else {
                GoogleTranslate.lastFetchEpoch = currentEpochTime;
            }
            googleTranslate.translate(list, fromLang, toLang, function (err, translation) {
                if (err) {
                    console.trace(err);
                    reject(err);
                    return;
                }
                if(Array.isArray(translation)) {
                    resolve(translation);
                } else {
                    resolve([translation]);
                }

            });
        });
    };

    timeNow(){
        return Math.floor(new Date() / 1000);
    }
    /**
     * Translation API will find duplicate strings from List of translations strings and will only send those which need to be translated
     * and it will replace all occurrences of the same item in the database based on the resolved value.
     * @param rawInputList Array of Strings to translate
     * @param fromLang Source Language code
     * @param toLang  Destination Language Code
     * @returns {Promise<Array>}  On Success returns list of
     */
    async translateFromBaseLangJson(rawInputList, fromLang, toLang) {
        const weak_this = this;
        return new Promise(async (resolve, reject) => {
            if(rawInputList.length <= 0){
                return [];
            }

            let inputList = rawInputList.map( item => item.value )
            inputList = inputList.filter( (elem, pos) => inputList.indexOf(elem) === pos );

            let translationsResults = [];

            try {
                let indexStart = 0;
                let indexEnd = maxItemsPerInterval;
                if(indexEnd > inputList.length){
                    indexEnd = inputList.length;
                }
                while(indexStart < inputList.length){
                    let slice = inputList.slice(indexStart, indexEnd);
                    let results = await weak_this.sendToGoogle(slice, fromLang, toLang);

                    for(let resultItem of results) {
                        let baseLangItems = rawInputList.filter(  item => item.value === resultItem.originalText );

                        if(typeof baseLangItems === "undefined" || baseLangItems === null || baseLangItems.length <= 0){
                            throw Error("translated item value does not exist in input Raw List from BaseLang. it must not happen")
                        } else {
                            for(let baseLangItem of baseLangItems ) {
                                if(resultItem.originalText !== baseLangItem.value){
                                    throw Error(`It looks like that rawInputList.filter found an incorrect item or google translate module has issue of returning correct item`)
                                }

                                let staticValue = null;
                                let staticStatus = null;
                                if(baseLangItem.hasOwnProperty("static")){
                                    staticValue = baseLangItem.static;
                                }
                                if(baseLangItems.hasOwnProperty("static_status")){
                                    staticStatus = baseLangItem.static_status;
                                }

                                let translatedItem = {
                                    key: baseLangItem.key,
                                    value: resultItem.translatedText,
                                    originalValue: baseLangItem.value,
                                    static: staticValue,
                                    static_status: staticStatus,
                                    checksum: baseLangItem.checksum
                                };
                                translationsResults.push( translatedItem )
                            }
                        }
                    }
                    indexStart = indexEnd;
                    indexEnd += maxItemsPerInterval;
                    if(indexEnd > inputList.length){
                        indexEnd = inputList.length;
                    }
                }
                resolve(translationsResults);
            }catch (e) {
                console.trace(`Translation failed. error :${e}`);
                reject(e);
            }
        });
    }
}

/// Initial value must not block execution, so it will be time which is already expired
GoogleTranslate.lastFetchEpoch = Math.floor(new Date() / 1000) - (interval + 10);

module.exports = GoogleTranslate;