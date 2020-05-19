const fs = require('fs');
const path = require('path');

/***
 *
 * FLATTED Base Json :
 * {
 *     key: String
 *     value: String,
 *     checksum: String
 * }
 *
 * FLATTED Language JSON Format :
 *  {
 *     key: String
 *     value: String, /// NOT NULL
 *     originalValue: String, /// NOT NULL
 *     static : String|Null,
 *     static_status: String|Null,  // INVALID_CHECKSUM, DELETED_BASE
 *     checksum: String   /// checksum of the base lang file value
 *     modifiedAt: Int
 * }
 *
 *
 */
const Main = require('./Main');

const src_dir = path.resolve(__dirname);
const dotenv = require('dotenv');
dotenv.config();

if(process.argv.length < 3){
    let info= "Not enough Arguments. Expected Arguments : 1. Localization file Path, 2. Output mode (swift/android) 3. output file path and name.";
    console.error(info);
    process.exit();
}

let argv1 = process.argv[2];

let main = new Main(src_dir);

/// Build iOS PresentationString swift file
if (argv1.toLocaleLowerCase() ==='ios') {

    //let flatJson = localizationJSONFileWrapper.getFlatFormat();
    //console.log( JSON.stringify(flatJson, null, 4)   );
    //sqliteWrapper.getFlatJsonFor("en")
}
else if (argv1.toLocaleLowerCase() === 'build') {
    main.buildIOS().then( res => {
        console.log("Done in main")
    }).catch( e => {
        console.error(e);
    })
    /*
    let flatJson = localizationJSONFileWrapper.localizationFlatJson;
    sqliteWrapper.updateBaseLanguage(flatJson).then( res=>{
        console.log(`Write done :> ${res}`);
    }).catch( e =>{
        console.log(e);
    })
    */

} else if (argv1.toLocaleLowerCase() === 'dart') {
    main.buildDart().then( res => {
        console.log("DART in main")
    }).catch( e => {
        console.error(e);
    })
    /*
    let flatJson = localizationJSONFileWrapper.localizationFlatJson;
    sqliteWrapper.updateBaseLanguage(flatJson).then( res=>{
        console.log(`Write done :> ${res}`);
    }).catch( e =>{
        console.log(e);
    })
    */

}





