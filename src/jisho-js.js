/*
    Main module entrypoint.
*/


// CONSTANTS
const JISHO_API_URL = "https://jisho.org/api/v1/search/words?keyword=";

const REQUEST_HEADERS = new Headers();
REQUEST_HEADERS.append('content-type', 'application/json');
REQUEST_HEADERS.append('accept', 'application/json');
REQUEST_HEADERS.append('user-agent', 'node.js');

const REQUEST_JSON = {
  method: "GET",
  headers: REQUEST_HEADERS,
  mode: "cors",
  cache: "default",
};


// OBJECTS

// NOTE: Using a proper 'class' definition is significantly slower
/** 
 * [JishoRecord Converts an entry from the Jisho Web API into a simplified form]
 * @param   {Object}    entry [Entry from the Jisho Web API]
 * @return  {Object}          [Array of jisho results objects]
 */
function JishoRecord(entry) {
    return {
        slug: entry.slug,
        is_common: entry.is_common,
        jlpt_level: extractJLPTLevel(entry),
        wanikani_level: extractWaniKaniLevel(entry),
        reading: extractReading(entry),
        meanings: extractMeanings(entry),
        word_type: extractWordTypes(entry)
    };
}


// UTILITY FUNCTIONS

/** 
 * [extractJLPTLevel Extract the JLPT level from a Jisho API response record]
 * @param   {Object}  entry     [record in a Jisho API response]
 * @return  {string}            [JLPT level in the format 'Nx']
 */
function extractJLPTLevel(entry) {
    const jlpt_block = entry.jlpt[0];
    if (jlpt_block === undefined) return '';
    return jlpt_block
        .replace('jlpt-', '')
        .toUpperCase();
}

/** 
 * [extractWaniKaniLevel Extract the WaniKani level from a Jisho API response record]
 * @param   {Object}  entry     [record in a Jisho API response]
 * @return  {string}            [WaniKani level]
 */
function extractWaniKaniLevel(entry) {
    const tags_block = entry.tags[0];
    if (tags_block === undefined) return '';
    return tags_block
        .replace('wanikani', '');
}

/** 
 * [extractReading Extract the word reading from a Jisho API response record]
 * @param   {Object}  entry     [record in a Jisho API response]
 * @return  {string}            [reading]
 */
function extractReading(entry) {
    const reading = entry.japanese[0].reading;
    return reading;
}

/** 
 * [extractMeanings Extract a word's meanings from a Jisho API response record]
 * @param   {Object}  entry     [record in a Jisho API response]
 * @return  {Array}             [array of unique word meanings]
 */
function extractMeanings(entry) {
    let meanings = [];
    for (const meaning_block of entry.senses) {
        meanings = meanings.concat(
            meaning_block.english_definitions.
                map(entry => entry.toLowerCase())
        );
    }
    return [...new Set(meanings)];
}

/** 
 * [extractWordTypes Extract a word's grammatical types from a Jisho API response record]
 * @param   {Object}  entry     [record in a Jisho API response]
 * @return  {Array}             [array of unique word grammatical types]
 */
function extractWordTypes(entry) {
    let word_types = [];
    for (const type_block of entry.senses) {
        word_types = word_types.concat(
            type_block.parts_of_speech
                .map(entry => entry.toLowerCase())
                .filter(entry => !entry.includes('wikipedia'))
        );
    }
    return [...new Set(word_types)];
}

/** 
 * [extractJishoData Converts Jisho API response records into JishoRecord entries]
 * @param   {Array}  response_json      [array of records in a Jisho API response]
 * @return  {Array}                     [array of JishoRecord Objects]
 */
async function extractJishoData(response_json) {
    // Extract and transform the data block
    return response_json.data.map(entry => JishoRecord(entry));
}


// ENDPOINTS
class JishoAPI {
    /** 
     * [getEntries Gets records from the Jisho Web API]
     * @param   {string}    query           [Query word to send to the API]
     * @param   {boolean}   is_commmon      [Flag to query for common vocabulary]
     * @return  {Array}                     [Array of JishoRecord objects]
     */
    async getEntries(query, is_common = false) {
        if (typeof query !== 'string') {
            throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
        }
        const query_blocks = [query];

        if (is_common) {
            query_blocks.unshift('#common');
        }

        const response_json = await this.execute_query(query_blocks);
        return extractJishoData(response_json);
    }

    /** 
     * [getCommonEntries Get only common entries for a given query]
     * @param   {string}     query   [Query word to send to the API]
     * @return  {Array}              [Array of JishoRecord objects]
     */
    async getCommonEntries(query) {
        return this.getEntries(query, true);
    }

    /** 
     * [getEntriesStartingWith Get results for a word starting with a given query]
     * @param   {string}    query           [Query word to send to the API]
     * @param   {boolean}   is_commmon      [Flag to query for common vocabulary]
     * @return  {Array}                     [Array of JishoRecord objects]
     */
    async getEntriesStartingWith(query, is_common = false) {
        if (typeof query !== 'string') {
            throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
        }
        return this.getEntries(`${query}*`, is_common);
    }

    /** 
     * [getEntriesEndingWith Get results for a word ending with a given query]
     * @param   {string}    query           [Query word to send to the API]
     * @param   {boolean}   is_commmon      [Flag to query for common vocabulary]
     * @return  {Array}                     [Array of JishoRecord objects]
     */
    async getEntriesEndingWith(query, is_common = false) {
        if (typeof query !== 'string') {
            throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
        }
        return this.getEntries(`*${query}`, is_common);
    }

    /** 
     * [getEntriesJLPTLevel Get results for a given JLPT level]
     * @param   {string}    query           [Query word to send to the API]
     * @param   {string}    jlpt_level      [JLPT level in the Nx or nx format]
     * @return  {Array}                     [Array of JishoRecord objects]
     */
    async getEntriesJLPTLevel(query, jlpt_level) {
        if (typeof query !== 'string') {
            throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
        }

        const jlpt_regex = /[Nn]?/;
        if (typeof jlpt_level !== 'string' && !jlpt_level.match(jlpt_regex)) {
            throw new Error(`JLPT level needs to be in the format 'N3' or 'n3'. Got '${jlpt_level}' instead. Aborting!`);
        }   
        const jlpt_string = `#jlpt-${jlpt_level.toLowerCase()}`;

        const response_json = await this.execute_query([jlpt_string, query]);
        return extractJishoData(response_json);
    }

    /** 
     * [getEntriesWasei Get wasei eigo results for a given query]
     * @param   {string}    query           [Query word to send to the API]
     * @param   {boolean}   is_commmon      [Flag to query for common vocabulary]
     * @return  {Array}                     [Array of JishoRecord objects]
     */
    async getEntriesWasei(query, is_common = false) {
        if (typeof query !== 'string') {
            throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
        }
        const query_blocks = ['#wasei', query];

        if (is_common) {
            query_blocks.unshift('#common');
        }

        const response_json = await this.execute_query(query_blocks);
        return extractJishoData(response_json);
    }

    /** 
     * [execute_query Core function to get results from the Jisho API]
     * @param   {Array}  query_blocks [Query words to send to the API]
     * @return  {Array}               [Array of jisho results objects]
     */
    async execute_query(query_blocks) {
        const query_string = query_blocks.join(' ');
        const encoded_query = query_blocks.map(entry => encodeURIComponent(entry)).join(' ');
        const fullURL = `${JISHO_API_URL}${encoded_query}`;
        console.debug(`Executing Jisho API call '${fullURL}'`);

        const request = new Request(fullURL, REQUEST_JSON);
        const response = await fetch(request);

        // NOTE: The Jisho Web API almost always returns HTTP 200,
        // because there is some result to return
        if (response.status === 200) {
            console.debug(`Response for query '${query_string}' received.`);
            return await response.json();
        }
        throw new Error(
            `HTTP ${response.status}: Couldn't get results for query '${query_string}'.`
            + ' Check if API server is available and the query correct.'
        );
    }
};

export default JishoAPI;
