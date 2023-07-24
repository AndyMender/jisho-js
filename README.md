# jisho-js
JavaScript wrapper around the jisho.org search Web API.

[![Build Status](https://app.travis-ci.com/AndyMender/jisho-js.svg?branch=main)](https://app.travis-ci.com/AndyMender/jisho-js)

## Details
The library provides functions to query words directly through the exposed 
[search API endpoint](https://jisho.org/api/v1/search/words?keyword=), with different possible crateria, 
like
- JLPT levels

- WaniKani levels

- Word commonality

- Additional filter tags like `#wasei` to search for wasei eigo words

Unlike existing JavaScript packages, it does **not** scrape the HTML output of returned results.

## Limitations
- Many filter flags mentioned in the [docs](https://jisho.org/docs) are not supported by the Web API, 
  however some obvious combinations don't work in the Web UI either (for instance, the `#adjective` tag 
  often returns non-adjective words for a given query).

- Kanji results are not supported by the Web API, however these would likely contain different information 
  than word results.

- The Web API always returns `HTTP 200` even when the response is empty or the input was not correctly formatted.
