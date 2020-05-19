const fs = require('fs');

class IosSwiftPresentationStringGenerator {

    makeSwiftFile(json){

        var code = "/**\n\n";
        code += "\tCreated by Majid Hatami Aghdam\n";
        code += "\tNodeJs Code Generator localizations_nodejs By mjhatamy@gmail.com\n";
        code += "\tAuto code generated on " + `${new Date()}\n`;
        code += "*/\n\n";
        code += "import UIKit\n\n\npublic final class PresentationStrings {\n\n";
        //return "\u{200E}" + (ldict?[key] ?? ( mdict[key] ?? ""))   \200E causes the string to show always in english format

        code += "\tfileprivate class func valueForKeyPath(_ keyPath:String) -> String{\n";
        code += "\t\tlet value = NSLocalizedString(keyPath, comment:keyPath)\n";
        code += "\t\tif value == keyPath {\n";
        code += "\t\t\tLOGE(\" Error in NSLocalizedString. Value not found for keypath: \(keyPath) \")\n";
        code += "\t\t}\n";
        code += "\t\treturn value\n";
        code += "\t}\n";

        code += "\tpublic func valueForKeyPath(_ keyPath:String) -> String{\n";
        code += "\t\tlet value = NSLocalizedString(keyPath, comment:keyPath)\n";
        code += "\t\tif value == keyPath {\n";
        code += "\t\t\tLOGE(\" Error in NSLocalizedString. Value not found for keypath: \(keyPath) \")\n";
        code += "\t\t}\n";
        code += "\t\treturn value\n";
        code += "\t}\n";

        code += "\tfileprivate class func valueForKeyPath(_ keyPath:String) -> Int?{\n";
        code += "\t\tguard let intVal = Int( NSLocalizedString(keyPath, comment:keyPath) ) else {\n";
        code += "\t\t\tLOGE(\"Unable to find Int value for KeyPath:\\(keyPath)  NSLocalizedString:\\(NSLocalizedString(keyPath, comment:keyPath)) \")\n";
        code += "\t\t\treturn nil\n\t\t}\n";
        code += "\t\treturn intVal\n";
        code += "\t}\n\n";

        code += "\tinit() {\n";
        code += "\t}\n\n";

        function makeTables(){
            var tabs = "";
            for(var i = 0; i < depth; i += 1){
                tabs += "\t";
            }
            //console.log(`${tabs}Tabs:${depth}`);
            return tabs;
        }

        function process_Item(parentKey, item){
            if( typeof item === 'object'){
                depth += 1;
                //code += makeTables();
                wrap_JsonObject(parentKey, item);
                depth -= 1;
            }else if (typeof item === 'string'){
                wrap_ValueObject(parentKey, item);
            }
        }

        function wrap_JsonObject(parentKey, m_item){
            for(var key in m_item){
                let newParentKey = `${parentKey}.${key}`
                const item = m_item[key];
                if( typeof item === 'object'){
                    code += `${makeTables()}public var ${key}:m${key} = m${key}()\n`;
                    code += `${makeTables()}public struct m${key}{\n`;
                    depth += 1;

                    wrap_JsonObject(newParentKey, item);
                    depth -= 1;
                    code += `${makeTables()}}\n`;
                }else if (typeof item === 'string'){
                    wrap_ValueObject(newParentKey, key);
                }else if (typeof item === 'number'){
                    wrap_NumberValueObject(newParentKey, key);
                } else{
                    console.log("unknown object type: ", typeof  item);
                }
            }
        }

        function wrap_ValueObject(parentKey, item){
            code += `${makeTables()}public var ${item}:String { return PresentationStrings.valueForKeyPath("${parentKey}")  }\n`;
        }

        function wrap_NumberValueObject(parentKey, item){
            code += `${makeTables()}public var ${item}:Int? {return PresentationStrings.valueForKeyPath("${parentKey}")}\n`;
        }

        /// First Add Keys which are value type
        for(key in json){
            const item = json[key];
            if(typeof item === 'string'){
                let keyWidthOutSpaceForVariableName = key.replace(/ /g,"_");
                code += `\tpublic var ${keyWidthOutSpaceForVariableName}:String { return NSLocalizedString("${key}", comment:"${key}") }\n`
            }
        }

        code += '\n\n';

        /// Now add Keys for struct types
        var depth = 1
        for(var key in json){
            const item = json[key];
            if(typeof item === 'object'){
                code += `\tpublic struct m${key}{\n`;
                process_Item(key, item);
                code += "\t}\n";
                code += `\tpublic let ${key}:m${key} = m${key}()\n\n`;
            }

            /*
            for(var index in item){
                const m_item = item[index];
                console.log(`m_item: ${typeof item} index:${index}  key:${typeof m_item.key} ${typeof m_item.value}`);

                for(var innerKey in item[index]){

                    //console.log(`${innerKey}`);
                    code += `\t\tvar ${innerKey}:String {return valueForKey("${key}.${innerKey}")}\n`;
                }
            }
            */

        }

        code += "}";
        console.log("\nDONE\n")
        //console.log(code);
        if(typeof process.env.SWIFT_PRESENTATION_FILE_PATH === 'undefined' || process.env.SWIFT_PRESENTATION_FILE_PATH == null){
            throw Error("Environment variable for SWIFT_PRESENTATION_FILE_PATH not set. check .env file.")
        }
        let outputFilePath = process.env.SWIFT_PRESENTATION_FILE_PATH;

        fs.writeFile(outputFilePath, code, 'utf8', function (err) {
            if(err){
                console.error(`Failed to write output SWIFT code to file at path:\nError: ${err}`);
                return;
            }
            console.log(`File successfully write to ${outputFilePath}`);
        });
    }

    localizationStringFileGenerator(languageCode, flattedJson, isBase = false){
        const weak_this = this;
        return new Promise((resolve, reject) => {
            if(typeof process.env.IOS_LOCALIZATION_BASE_PATH === 'undefined' || process.env.IOS_LOCALIZATION_BASE_PATH == null){
                throw Error("Environment variable for IOS_LOCALIZATION_BASE_PATH not set. check .env file.")
            }
            let outputFilePath = `${process.env.IOS_LOCALIZATION_BASE_PATH}/${languageCode}.lproj/Localizable.strings`;
            if(isBase) {
                outputFilePath = `${process.env.IOS_LOCALIZATION_BASE_PATH}/Base.lproj/Localizable.strings`;
            }
            if(flattedJson.length <= 0) {
                throw Error("Flatted json must not be empty. check why it happened.")
            }

            let outputString = "";
            for(let item of flattedJson){
                //console.log(item)
                if(typeof item.value !== 'string'){
                    outputString += `"${item.key}"="${item.value}"; \r\n`
                } else {
                    if(typeof item.static === 'string'){
                        outputString += `"${item.key}"=${JSON.stringify(item.static)}; \r\n`
                    } else {
                        outputString += `"${item.key}"=${JSON.stringify(item.value)}; \r\n`
                    }

                }

            }
            fs.writeFile(outputFilePath, outputString, 'utf8', function (err) {
                if(err){
                    console.error(`Failed to write output Localizable code to file at path:\nError: ${err}`);
                    reject(err)
                    return;
                }
                console.log(`File successfully write to ${outputFilePath}`);
                resolve(outputFilePath)
            });
        })
    }
}

module.exports = IosSwiftPresentationStringGenerator;
