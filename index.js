/*
    Main module entrypoint.
*/

// CONSTANTS
// TODO: Are other arguments allowed?
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
function JishoRecord(entry) {
    return {
        slug: entry.slug,
        is_common: entry.is_common,
        jlpt_level: extractJLPTLevel(entry),
        wanikani_level: extractWaniKaniLevel(entry),
        reading: extractReading(entry),
        meanings: extractMeanings(entry)
    };
}

// ENDPOINTS

async function getEntries(query, is_common = False) {
    if (typeof query !== 'string') {
        throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
    }
    const query_blocks = [query];

    if (is_common) {
        query_blocks.unshift('#common');
    }
    const response_json = await execute_query(query_blocks);
    return extractJishoData(response_json);
}


async function getCommonEntries(query) {
    return getEntries(query, true);
}


async function getEntriesStartingWith(query, is_common = false) {
    if (typeof query !== 'string') {
        throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
    }
    return getEntries(`${query}*`, is_common);
}


async function getEntriesEndingWith(query, is_common = false) {
    if (typeof query !== 'string') {
        throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
    }
    return getEntries(`*${query}`, is_common);
}

async function getEntriesJLPTLevel(query, jlpt_level) {
    if (typeof query !== 'string') {
        throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
    }
    let jlpt_string = '#jlpt-';

    if (typeof jlpt_level === 'number') {
        jlpt_string += `n${jlpt_level}`;
    } else if (typeof jlpt_level === 'string') {
        // Assume 'N*' or 'n*' JLPT-style level String
        if (jlpt_level.startsWith('N') || jlpt_level.startsWith('n')) {
            jlpt_string += jlpt_level.toLowerCase();
        } 
        // Assume number passed as String
        else {
            jlpt_string += `n${jlpt_level}` ;
        }
    }
    const response_json = await execute_query([jlpt_string, query]);
    return extractJishoData(response_json);
}


// TODO: endpoint currently not supported by API server!
async function getKanjiEntries(query) {
    if (typeof query !== 'string') {
        throw new Error(`Query value '${query}' is incompatible. It must be a string. Aborting!`);
    }
    return await execute_query(['#kanji', query]);
}


/** 
 * [execute_query Core function to get results from the Jisho API]
 * @param   {[Array]}  query_blocks [Query words to send to the API]
 * @return  {[Array]}               [Array of jisho results objects]
 * */ 
async function execute_query(query_blocks) {
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


// UTILITY FUNCTIONS

function extractJLPTLevel(entry) {
    const jlpt_block = entry.jlpt[0];
    if (jlpt_block === undefined) return '';
    return jlpt_block
        .replace('jlpt-', '')
        .toUpperCase();
}


function extractWaniKaniLevel(entry) {
    const tags_block = entry.tags[0];
    if (tags_block === undefined) return '';
    return tags_block
        .replace('wanikani', '');
}


function extractReading(entry) {
    const reading = entry.japanese[0].reading;
    return reading;
}


function extractMeanings(entry) {
    const meanings = [];
    for (const meaning_block of entry.senses) {
        meanings.push(meaning_block.english_definitions.join(", "));
    }
    return meanings;
}


async function extractJishoData(response_json) {
    // Extract and transform the data block
    return response_json.data.map(entry => JishoRecord(entry));
}


// TESTING GROUNDS

// getCommonEntries('道具').then(results => console.log(results)).catch((error) => {
//     console.error(error);
// });

getEntriesJLPTLevel('地', 3).then(results => console.log(results)).catch((error) => {
    console.error(error);
});

// TODO: Currently not supported by API!
// getKanjiEntries('道').then(results => console.log(results)).catch((error) => {
//     console.error(error);
// });
