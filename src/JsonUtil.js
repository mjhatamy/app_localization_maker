

class JsonUtil {
    sort(unorderedJson){
        var inner_sort = function(m_unorderedJson) {
            const m_ordered = {};
            Object.keys(m_unorderedJson).sort( function (a, b) {
                    return a.localeCompare(b, undefined, { caseFirst: 'upper'});
                }
            ).forEach(function(key) {
                if (typeof (m_unorderedJson[key]) === 'object') {
                    m_ordered[key] = inner_sort(m_unorderedJson[key]);
                } else {
                    m_ordered[key] = m_unorderedJson[key];
                }
            });
            return m_ordered;
        };
        return inner_sort(unorderedJson);
    }



}

module.exports = JsonUtil;