const fs = require('fs');
const Locale = require('./Locale');

class DartPresentationStrings {
    supportedLanguages;
    constructor(supportedLanguages) {
        this.supportedLanguages = supportedLanguages;
    }

    async make(json){
        let mainCode = [];
        mainCode.push("import 'dart:async';");
        mainCode.push("import 'dart:convert';");
        mainCode.push("import 'package:flutter/material.dart';");
        mainCode.push("import 'package:flutter/services.dart';");

        mainCode.push("\nconst String _assetsLanguageDirectory = \"lang\";");

        mainCode.push("const List<Locale> _supportedLanguages = [");
        let i = 0;
        for(let lang of this.supportedLanguages){
            let comma = (this.supportedLanguages.length > 1 && i < (this.supportedLanguages.length - 1)) ? "," : "";
            if(lang.languageCode != null && lang.countryCode != null) {
                if(lang.scriptCode != null) {
                    mainCode.push(`\tLocale('${lang.languageCode}')${comma}`);
                } else {
                    mainCode.push(`\tLocale('${lang.languageCode}', '${lang.countryCode}')${comma}`);
                }
            } else {
                mainCode.push(`\tLocale('${lang.languageCode}')${comma}`);
            }
            i += 1;
        }
        mainCode.push("];");

        mainCode.push(`
extension on Map<String, dynamic> {
  dynamic getKeyPath(String keyPath) {
    final _keysFromKeyPath = keyPath.split(".");
    dynamic value = this;
    String key;
    for (int i = 0; i < _keysFromKeyPath.length; i++) {
      key = _keysFromKeyPath[i];
      if (key == null || key.length <= 0) {
        return null;
      }
      if (!value.containsKey(key)) {
        return null;
      }
      if (value is Map<String, dynamic>) {
        value = value[key];
      } else {
        value = value[key];
      }
    }
    //print(value);
    return value;
  }
}

extension on Locale {
  String jsonFile() {
    List<String> fileNameArr = List<String>();
    fileNameArr.add(this.languageCode);
    if (this.scriptCode != null && this.scriptCode.length > 0) {
      fileNameArr.add(this.scriptCode);
    }
    if (this.countryCode != null && this.countryCode.length > 0) {
      fileNameArr.add(this.countryCode);
    }
    return fileNameArr.join("_");
  }
}

class AppLocalizations {
  static List<Locale> supportedLocales = _supportedLanguages;
  final Locale locale;
  Map<String, dynamic> _localizedStrings;

  _AppTranslations strings;
  AppLocalizations(this.locale) {
    this.strings = _AppTranslations(this);
  }

  // Helper method to keep the code in the widgets concise
  // Localizations are accessed using an InheritedWidget "of" syntax
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  // Static member to have a simple access to the delegate from the MaterialApp
  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  Future<bool> _load() async {
    // Load the language JSON file from the "lang" folder
    String jsonString = await rootBundle
        .loadString('$_assetsLanguageDirectory/\${locale.jsonFile()}.json');
    _localizedStrings = json.decode(jsonString);
    return true;
  }

  // This method will be called from every widget which needs a localized text
  dynamic translate(String keyPath) {
    return _localizedStrings.getKeyPath(keyPath);
  }
}

// LocalizationsDelegate is a factory for a set of localized resources
// In this case, the localized strings will be gotten in an AppLocalizations object
class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  // This delegate instance will never change (it doesn't even have fields!)
  // It can provide a constant constructor.
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    // Include all of your supported language codes here
    return (_supportedLanguages
            .where((e) => e.languageCode == locale.languageCode)
            .length >
        0);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    // AppLocalizations class is where the JSON loading actually runs
    AppLocalizations localizations = new AppLocalizations(locale);
    await localizations._load();
    return localizations;
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

abstract class _AppTranslationsBase {
  final AppLocalizations _appLocalizations;
  _AppTranslationsBase(this._appLocalizations);
  dynamic translate(String keyPath) {
    return this._appLocalizations.translate(keyPath);
  }
}
        `);
        mainCode.push("");
        mainCode.push("");
        mainCode.push("");


        mainCode.push("");
        let outputFilePath = process.env.DART_LOCALIZATION_CLASS_FILE_PATH;
        fs.writeFile(outputFilePath, mainCode.join("\n"), function (err) {
            if(err){
                console.error(`Failed to write output SWIFT code to file at path:\nError: ${err}`);
                return;
            }
            console.log(`File successfully write to ${outputFilePath}`);
        });

    }



    localizationStringFileGenerator(locale, flattedJson, isBase = false){
        const weak_this = this;
        return new Promise((resolve, reject) => {
            if(typeof process.env.DART_LOCALIZATION_JSON_BASE_PATH === 'undefined' || process.env.DART_LOCALIZATION_JSON_BASE_PATH == null){
                throw Error("Environment variable for DART_LOCALIZATION_JSON_BASE_PATH not set. check .env file.")
            }
            let outputFilePath = `${process.env.DART_LOCALIZATION_JSON_BASE_PATH}/${locale.jsonFileName()}`;

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

            let outJson = {};
            for(let jsonItem of flattedJson){
                let keys = jsonItem.key.split(".");
                //console.log(keys);
                let item = outJson;
                if(outJson.hasOwnProperty(keys[0])) {
                    item = outJson[keys[0]];
                } else {
                    outJson[keys[0]] = {};
                    item = outJson[keys[0]];
                }
                for(let [index, key] of keys.entries()) {
                    if(index === (keys.length - 1)) {
                        item[key] = jsonItem.value;
                    } else if(!item.hasOwnProperty(key)) {
                        item[key] = {}
                        item = item[key];
                    } else {
                        item = item[key];
                    }
                }
            }
            //console.log(JSON.stringify(outJson, null, 4));

            fs.writeFile(outputFilePath, JSON.stringify(flattedJson, null, 4), 'utf8', function (err) {
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

module.exports = DartPresentationStrings;