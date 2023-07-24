import test from 'unit.js';
import JishoAPI from '../src/jisho-js.js';

const TEST_STRING = '道具';

describe('Self-test', function() {
    it('Self-test', function() {
        test.object({name: 'Carl'}).hasProperty('name');
    });
});

describe('API Tests', function() {
    it('Test getEntries', function() {
        const jisho_api = new JishoAPI();
        jisho_api.getEntries(TEST_STRING, true)
            .then(results => test.array(results) && test.assert(results.length > 0));
    });

    it('Test getCommonEntries', function() {
        const jisho_api = new JishoAPI();
        jisho_api.getCommonEntries(TEST_STRING)
            .then(results => test.array(results) && test.assert(results.length > 0));
    });

    it('Test getEntriesStartingWith', function() {
        const jisho_api = new JishoAPI();
        jisho_api.getEntriesStartingWith('同')
            .then(results => test.array(results) && test.assert(results.length > 0));
    });

    it('Test getEntriesEndingWith', function() {
        const jisho_api = new JishoAPI();
        jisho_api.getEntriesEndingWith('同')
            .then(results => test.array(results) && test.assert(results.length > 0));
    });

    it('Test getEntriesJLPTLevel', function() {
        const jisho_api = new JishoAPI();
        jisho_api.getEntriesJLPTLevel('同', 'N2')
            .then(results => test.array(results) && test.assert(results.length > 0));
    });

    it('Test getEntriesWasei', function() {
        const jisho_api = new JishoAPI();
        jisho_api.getEntriesWasei('ボ', true)
            .then(results => test.array(results) && test.assert(results.length > 0));
    });
});
