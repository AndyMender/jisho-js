import test from 'unit.js';
import JishoAPI from '../src/jisho-js.js';

describe('Self-test', function(){
    it('Self-test', function(){
        test.object({name: 'Carl'}).hasProperty('name');
    });
});

describe('API Tests', function(){
    it('Test getEntries', function() {
        const jisho_api = new JishoAPI();
        jisho_api.getEntries('道具', true)
            .then(results => test.array(results)).catch((error) => {
            console.error(error);
        });
    });
});
