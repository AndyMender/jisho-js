/*
    Main module entrypoint.
*/

// CONSTANTS
// TODO: Are other arguments allowed?
const JISHO_API_URL = "https://jisho.org/api/v1/search/words?keyword=";


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

// ENTRYPOINTS

/** 
 * [execute_query Core function to get results from the Jisho API]
 * @param   {[Array]}  query_blocks [Full input string for the query]
 * @return  {[Array]}               [list of jisho results objects]
 * */ 
async function execute_query(query_blocks) {
    const encoded_query = query_blocks.map(entry => encodeURIComponent(entry)).join(' ');
    const fullURL = `${JISHO_API_URL}${encoded_query}`;
    console.debug(`Executing Jisho API call '${fullURL}'`);

    const response = await fetch(new Request(fullURL));

    // NOTE: The Jisho Web API almost always returns HTTP 200,
    // because there is some result to return
    if (response.status === 200) {
        console.debug(`Response for query '${query_blocks.join(' ')}' received.`);
        return await extractJishoData(response);
    }
    throw new Error(`Couldn't get results for query ${query_string}. Check if API server is available and the query correct.`);
}


async function getCommonEntries(query) {
    // Generate query blocks
    let query_blocks = []
    if (typeof query === 'string') {
        query_blocks = [query];
    } else if (typeof query === 'array') {
        query_blocks = query;
    } else {
        throw new Error(`Value of query, '${query}' is incompatible. Aborting!`);
    }
    query_blocks.unshift('#common');

    return execute_query(query_blocks);
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


async function extractJishoData(response) {
    const response_json = await response.json();

    // Extract and transform the data block
    return response_json.data.map(entry => JishoRecord(entry));
}


// TESTING GROUNDS
// execute_query("道具").then(results => console.log(results)).catch((error) => {
//     console.error(error);
// });

getCommonEntries("道具").then(results => console.log(results)).catch((error) => {
    console.error(error);
});