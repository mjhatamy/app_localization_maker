
class Locale {
    languageCode;
    countryCode;
    scriptCode;
    constructor(languageCode, countryCode, scriptCode = null) {
        this.languageCode = languageCode;
        this.countryCode = countryCode;
        this.scriptCode = scriptCode;
    }
    jsonFileName() {
        let name = [];
        name.push(this.languageCode);
        if(this.scriptCode != null && this.scriptCode.length > 1) {
            name.push(this.scriptCode);
        }
        if(this.countryCode != null && this.countryCode.length > 1) {
            name.push(this.countryCode);
        }
        return name.join("_") + ".json";
    }
}

module.exports = Locale;

