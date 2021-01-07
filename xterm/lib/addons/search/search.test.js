"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var search = require("./search");
var SearchHelper_1 = require("./SearchHelper");
var MockTerminalPlain = (function () {
    function MockTerminalPlain() {
    }
    return MockTerminalPlain;
}());
var MockTerminal = (function () {
    function MockTerminal(options) {
        this._core = new (require('../../../lib/Terminal')).Terminal(options);
        this.searchHelper = new TestSearchHelper(this);
        this.cols = options.cols;
    }
    Object.defineProperty(MockTerminal.prototype, "core", {
        get: function () {
            return this._core;
        },
        enumerable: true,
        configurable: true
    });
    MockTerminal.prototype.pushWriteData = function () {
        this._core._innerWrite();
    };
    return MockTerminal;
}());
var TestSearchHelper = (function (_super) {
    __extends(TestSearchHelper, _super);
    function TestSearchHelper() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestSearchHelper.prototype.findInLine = function (term, rowNumber, searchOptions) {
        return this._findInLine(term, rowNumber, 0, searchOptions);
    };
    TestSearchHelper.prototype.findFromIndex = function (term, row, col, searchOptions, isReverseSearch) {
        return this._findInLine(term, row, col, searchOptions, isReverseSearch);
    };
    return TestSearchHelper;
}(SearchHelper_1.SearchHelper));
describe('search addon', function () {
    describe('apply', function () {
        it('should register findNext and findPrevious', function () {
            search.apply(MockTerminalPlain);
            chai_1.assert.equal(typeof MockTerminalPlain.prototype.findNext, 'function');
            chai_1.assert.equal(typeof MockTerminalPlain.prototype.findPrevious, 'function');
        });
    });
    describe('find', function () {
        it('Searchhelper - should find correct position', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 3 });
            term.core.write('Hello World\r\ntest\n123....hello');
            term.pushWriteData();
            var hello0 = term.searchHelper.findInLine('Hello', 0);
            var hello1 = term.searchHelper.findInLine('Hello', 1);
            var hello2 = term.searchHelper.findInLine('Hello', 2);
            chai_1.expect(hello0).eql({ col: 0, row: 0, term: 'Hello' });
            chai_1.expect(hello1).eql(undefined);
            chai_1.expect(hello2).eql({ col: 11, row: 2, term: 'Hello' });
        });
        it('should find search term accross line wrap', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 10, rows: 5 });
            term.core.write('texttextHellotext\r\n');
            term.core.write('texttexttextHellotext         goodbye');
            term.pushWriteData();
            var hello0 = term.searchHelper.findInLine('Hello', 0);
            var hello1 = term.searchHelper.findInLine('Hello', 1);
            var hello2 = term.searchHelper.findInLine('Hello', 2);
            var hello3 = term.searchHelper.findInLine('Hello', 3);
            var llo = term.searchHelper.findInLine('llo', 1);
            var goodbye = term.searchHelper.findInLine('goodbye', 2);
            chai_1.expect(hello0).eql({ col: 8, row: 0, term: 'Hello' });
            chai_1.expect(hello1).eql(undefined);
            chai_1.expect(hello2).eql({ col: 2, row: 3, term: 'Hello' });
            chai_1.expect(hello3).eql(undefined);
            chai_1.expect(llo).eql(undefined);
            chai_1.expect(goodbye).eql({ col: 0, row: 5, term: 'goodbye' });
            term.core.resize(9, 5);
            var hello0Resize = term.searchHelper.findInLine('Hello', 0);
            chai_1.expect(hello0Resize).eql({ col: 8, row: 0, term: 'Hello' });
        });
        it('should respect search regex', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 10, rows: 4 });
            term.core.write('abcdefghijklmnopqrstuvwxyz\r\n~/dev  ');
            term.pushWriteData();
            var searchOptions = {
                regex: true,
                wholeWord: false,
                caseSensitive: false
            };
            var hello0 = term.searchHelper.findInLine('dee*', 0, searchOptions);
            var hello1 = term.searchHelper.findInLine('jkk*', 0, searchOptions);
            var hello2 = term.searchHelper.findInLine('mnn*', 1, searchOptions);
            var tilda0 = term.searchHelper.findInLine('^~', 3, searchOptions);
            var tilda1 = term.searchHelper.findInLine('^[~]', 3, searchOptions);
            var tilda2 = term.searchHelper.findInLine('^\\~', 3, searchOptions);
            chai_1.expect(hello0).eql({ col: 3, row: 0, term: 'de' });
            chai_1.expect(hello1).eql({ col: 9, row: 0, term: 'jk' });
            chai_1.expect(hello2).eql(undefined);
            chai_1.expect(tilda0).eql({ col: 0, row: 3, term: '~' });
            chai_1.expect(tilda1).eql({ col: 0, row: 3, term: '~' });
            chai_1.expect(tilda2).eql({ col: 0, row: 3, term: '~' });
        });
        it('should not select empty lines', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 3 });
            var line = term.searchHelper.findInLine('^.*$', 0, { regex: true });
            chai_1.expect(line).eql(undefined);
        });
        it('should respect case sensitive', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 4 });
            term.core.write('Hello World\r\n123....hello\r\nmoreTestHello');
            term.pushWriteData();
            var searchOptions = {
                regex: false,
                wholeWord: false,
                caseSensitive: true
            };
            var hello0 = term.searchHelper.findInLine('Hello', 0, searchOptions);
            var hello1 = term.searchHelper.findInLine('Hello', 1, searchOptions);
            var hello2 = term.searchHelper.findInLine('Hello', 2, searchOptions);
            chai_1.expect(hello0).eql({ col: 0, row: 0, term: 'Hello' });
            chai_1.expect(hello1).eql(undefined);
            chai_1.expect(hello2).eql({ col: 8, row: 2, term: 'Hello' });
        });
        it('should respect case sensitive + regex', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 4 });
            term.core.write('hellohello\r\nHelloHello');
            term.pushWriteData();
            var searchOptions = {
                regex: true,
                wholeWord: false,
                caseSensitive: true
            };
            var hello0 = term.searchHelper.findInLine('Hello', 0, searchOptions);
            var hello1 = term.searchHelper.findInLine('Hello$', 0, searchOptions);
            var hello2 = term.searchHelper.findInLine('Hello', 1, searchOptions);
            var hello3 = term.searchHelper.findInLine('Hello$', 1, searchOptions);
            chai_1.expect(hello0).eql(undefined);
            chai_1.expect(hello1).eql(undefined);
            chai_1.expect(hello2).eql({ col: 0, row: 1, term: 'Hello' });
            chai_1.expect(hello3).eql({ col: 5, row: 1, term: 'Hello' });
        });
        it('should respect whole-word search option', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 5 });
            term.core.write('Hello World\r\nWorld Hello\r\nWorldHelloWorld\r\nHelloWorld\r\nWorldHello');
            term.pushWriteData();
            var searchOptions = {
                regex: false,
                wholeWord: true,
                caseSensitive: false
            };
            var hello0 = term.searchHelper.findInLine('Hello', 0, searchOptions);
            var hello1 = term.searchHelper.findInLine('Hello', 1, searchOptions);
            var hello2 = term.searchHelper.findInLine('Hello', 2, searchOptions);
            var hello3 = term.searchHelper.findInLine('Hello', 3, searchOptions);
            var hello4 = term.searchHelper.findInLine('Hello', 4, searchOptions);
            chai_1.expect(hello0).eql({ col: 0, row: 0, term: 'Hello' });
            chai_1.expect(hello1).eql({ col: 6, row: 1, term: 'Hello' });
            chai_1.expect(hello2).eql(undefined);
            chai_1.expect(hello3).eql(undefined);
            chai_1.expect(hello4).eql(undefined);
        });
        it('should respect whole-word + case sensitive search options', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 5 });
            term.core.write('Hello World\r\nHelloWorld');
            term.pushWriteData();
            var searchOptions = {
                regex: false,
                wholeWord: true,
                caseSensitive: true
            };
            var hello0 = term.searchHelper.findInLine('Hello', 0, searchOptions);
            var hello1 = term.searchHelper.findInLine('hello', 0, searchOptions);
            var hello2 = term.searchHelper.findInLine('Hello', 1, searchOptions);
            var hello3 = term.searchHelper.findInLine('hello', 1, searchOptions);
            chai_1.expect(hello0).eql({ col: 0, row: 0, term: 'Hello' });
            chai_1.expect(hello1).eql(undefined);
            chai_1.expect(hello2).eql(undefined);
            chai_1.expect(hello3).eql(undefined);
        });
        it('should respect whole-word + regex search options', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 5 });
            term.core.write('Hello World Hello\r\nHelloWorldHello');
            term.pushWriteData();
            var searchOptions = {
                regex: true,
                wholeWord: true,
                caseSensitive: false
            };
            var hello0 = term.searchHelper.findInLine('Hello', 0, searchOptions);
            var hello1 = term.searchHelper.findInLine('Hello$', 0, searchOptions);
            var hello2 = term.searchHelper.findInLine('Hello', 1, searchOptions);
            var hello3 = term.searchHelper.findInLine('Hello$', 1, searchOptions);
            chai_1.expect(hello0).eql({ col: 0, row: 0, term: 'hello' });
            chai_1.expect(hello1).eql({ col: 12, row: 0, term: 'hello' });
            chai_1.expect(hello2).eql(undefined);
            chai_1.expect(hello3).eql(undefined);
        });
        it('should respect all search options', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 5 });
            term.core.write('Hello World Hello\r\nHelloWorldHello');
            term.pushWriteData();
            var searchOptions = {
                regex: true,
                wholeWord: true,
                caseSensitive: true
            };
            var hello0 = term.searchHelper.findInLine('Hello', 0, searchOptions);
            var hello1 = term.searchHelper.findInLine('Hello$', 0, searchOptions);
            var hello2 = term.searchHelper.findInLine('hello', 0, searchOptions);
            var hello3 = term.searchHelper.findInLine('hello$', 0, searchOptions);
            var hello4 = term.searchHelper.findInLine('hello', 1, searchOptions);
            var hello5 = term.searchHelper.findInLine('hello$', 1, searchOptions);
            chai_1.expect(hello0).eql({ col: 0, row: 0, term: 'Hello' });
            chai_1.expect(hello1).eql({ col: 12, row: 0, term: 'Hello' });
            chai_1.expect(hello2).eql(undefined);
            chai_1.expect(hello3).eql(undefined);
            chai_1.expect(hello4).eql(undefined);
            chai_1.expect(hello5).eql(undefined);
        });
        it('should find multiple matches in line', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 5 });
            term.core.write('helloooo helloooo\r\naaaAAaaAAA');
            term.pushWriteData();
            var searchOptions = {
                regex: false,
                wholeWord: false,
                caseSensitive: false
            };
            var find0 = term.searchHelper.findFromIndex('hello', 0, 0, searchOptions);
            var find1 = term.searchHelper.findFromIndex('hello', 0, find0.col + find0.term.length, searchOptions);
            var find2 = term.searchHelper.findFromIndex('aaaa', 1, 0, searchOptions);
            var find3 = term.searchHelper.findFromIndex('aaaa', 1, find2.col + find2.term.length, searchOptions);
            var find4 = term.searchHelper.findFromIndex('aaaa', 1, find3.col + find3.term.length, searchOptions);
            chai_1.expect(find0).eql({ col: 0, row: 0, term: 'hello' });
            chai_1.expect(find1).eql({ col: 9, row: 0, term: 'hello' });
            chai_1.expect(find2).eql({ col: 0, row: 1, term: 'aaaa' });
            chai_1.expect(find3).eql({ col: 4, row: 1, term: 'aaaa' });
            chai_1.expect(find4).eql(undefined);
        });
        it('should find multiple matches in line - reverse search', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 5 });
            term.core.write('it is what it is');
            term.pushWriteData();
            var searchOptions = {
                regex: false,
                wholeWord: false,
                caseSensitive: false
            };
            var isReverseSearch = true;
            var find0 = term.searchHelper.findFromIndex('is', 0, 16, searchOptions, isReverseSearch);
            var find1 = term.searchHelper.findFromIndex('is', 0, find0.col, searchOptions, isReverseSearch);
            var find2 = term.searchHelper.findFromIndex('it', 0, 16, searchOptions, isReverseSearch);
            var find3 = term.searchHelper.findFromIndex('it', 0, find2.col, searchOptions, isReverseSearch);
            chai_1.expect(find0).eql({ col: 14, row: 0, term: 'is' });
            chai_1.expect(find1).eql({ col: 3, row: 0, term: 'is' });
            chai_1.expect(find2).eql({ col: 11, row: 0, term: 'it' });
            chai_1.expect(find3).eql({ col: 0, row: 0, term: 'it' });
        });
        it('should find multiple matches in line - reverse search with regex', function () {
            search.apply(MockTerminal);
            var term = new MockTerminal({ cols: 20, rows: 5 });
            term.core.write('zzzABCzzzzABCABC');
            term.pushWriteData();
            var searchOptions = {
                regex: true,
                wholeWord: false,
                caseSensitive: true
            };
            var isReverseSearch = true;
            var find0 = term.searchHelper.findFromIndex('[A-Z]{3}', 0, 16, searchOptions, isReverseSearch);
            var find1 = term.searchHelper.findFromIndex('[A-Z]{3}', 0, find0.col, searchOptions, isReverseSearch);
            var find2 = term.searchHelper.findFromIndex('[A-Z]{3}', 0, find1.col, searchOptions, isReverseSearch);
            var find3 = term.searchHelper.findFromIndex('[A-Z]{3}', 0, find2.col, searchOptions, isReverseSearch);
            chai_1.expect(find0).eql({ col: 13, row: 0, term: 'ABC' });
            chai_1.expect(find1).eql({ col: 10, row: 0, term: 'ABC' });
            chai_1.expect(find2).eql({ col: 3, row: 0, term: 'ABC' });
            chai_1.expect(find3).eql(undefined);
        });
    });
});
//# sourceMappingURL=search.test.js.map