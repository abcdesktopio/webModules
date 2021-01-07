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
var SelectionManager_1 = require("./SelectionManager");
var BufferSet_1 = require("./BufferSet");
var TestUtils_test_1 = require("./TestUtils.test");
var BufferLine_1 = require("./BufferLine");
var TestMockTerminal = (function (_super) {
    __extends(TestMockTerminal, _super);
    function TestMockTerminal() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestMockTerminal.prototype.emit = function (event, data) { };
    return TestMockTerminal;
}(TestUtils_test_1.MockTerminal));
var TestSelectionManager = (function (_super) {
    __extends(TestSelectionManager, _super);
    function TestSelectionManager(terminal, charMeasure) {
        return _super.call(this, terminal, charMeasure) || this;
    }
    Object.defineProperty(TestSelectionManager.prototype, "model", {
        get: function () { return this._model; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestSelectionManager.prototype, "selectionMode", {
        set: function (mode) { this._activeSelectionMode = mode; },
        enumerable: true,
        configurable: true
    });
    TestSelectionManager.prototype.selectLineAt = function (line) { this._selectLineAt(line); };
    TestSelectionManager.prototype.selectWordAt = function (coords) { this._selectWordAt(coords, true); };
    TestSelectionManager.prototype.areCoordsInSelection = function (coords, start, end) { return this._areCoordsInSelection(coords, start, end); };
    TestSelectionManager.prototype.enable = function () { };
    TestSelectionManager.prototype.disable = function () { };
    TestSelectionManager.prototype.refresh = function () { };
    return TestSelectionManager;
}(SelectionManager_1.SelectionManager));
describe('SelectionManager', function () {
    var terminal;
    var buffer;
    var selectionManager;
    beforeEach(function () {
        terminal = new TestMockTerminal();
        terminal.cols = 80;
        terminal.rows = 2;
        terminal.options.scrollback = 100;
        terminal.buffers = new BufferSet_1.BufferSet(terminal);
        terminal.buffer = terminal.buffers.active;
        buffer = terminal.buffer;
        selectionManager = new TestSelectionManager(terminal, null);
    });
    function stringToRow(text) {
        var result = new BufferLine_1.BufferLine(text.length);
        for (var i = 0; i < text.length; i++) {
            result.setCell(i, BufferLine_1.CellData.fromCharData([0, text.charAt(i), 1, text.charCodeAt(i)]));
        }
        return result;
    }
    function stringArrayToRow(chars) {
        var line = new BufferLine_1.BufferLine(chars.length);
        chars.map(function (c, idx) { return line.setCell(idx, BufferLine_1.CellData.fromCharData([0, c, 1, c.charCodeAt(0)])); });
        return line;
    }
    describe('_selectWordAt', function () {
        it('should expand selection for normal width chars', function () {
            buffer.lines.set(0, stringToRow('foo bar'));
            selectionManager.selectWordAt([0, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'foo');
            selectionManager.selectWordAt([1, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'foo');
            selectionManager.selectWordAt([2, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'foo');
            selectionManager.selectWordAt([3, 0]);
            chai_1.assert.equal(selectionManager.selectionText, ' ');
            selectionManager.selectWordAt([4, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'bar');
            selectionManager.selectWordAt([5, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'bar');
            selectionManager.selectWordAt([6, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'bar');
        });
        it('should expand selection for whitespace', function () {
            buffer.lines.set(0, stringToRow('a   b'));
            selectionManager.selectWordAt([0, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'a');
            selectionManager.selectWordAt([1, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '   ');
            selectionManager.selectWordAt([2, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '   ');
            selectionManager.selectWordAt([3, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '   ');
            selectionManager.selectWordAt([4, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'b');
        });
        it('should expand selection for wide characters', function () {
            var data = [
                [null, '中', 2, '中'.charCodeAt(0)],
                [null, '', 0, null],
                [null, '文', 2, '文'.charCodeAt(0)],
                [null, '', 0, null],
                [null, ' ', 1, ' '.charCodeAt(0)],
                [null, 'a', 1, 'a'.charCodeAt(0)],
                [null, '中', 2, '中'.charCodeAt(0)],
                [null, '', 0, null],
                [null, '文', 2, '文'.charCodeAt(0)],
                [null, '', 0, ''.charCodeAt(0)],
                [null, 'b', 1, 'b'.charCodeAt(0)],
                [null, ' ', 1, ' '.charCodeAt(0)],
                [null, 'f', 1, 'f'.charCodeAt(0)],
                [null, 'o', 1, 'o'.charCodeAt(0)],
                [null, 'o', 1, 'o'.charCodeAt(0)]
            ];
            var line = new BufferLine_1.BufferLine(data.length);
            for (var i = 0; i < data.length; ++i)
                line.setCell(i, BufferLine_1.CellData.fromCharData(data[i]));
            buffer.lines.set(0, line);
            selectionManager.selectWordAt([0, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '中文');
            selectionManager.selectWordAt([1, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '中文');
            selectionManager.selectWordAt([2, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '中文');
            selectionManager.selectWordAt([3, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '中文');
            selectionManager.selectWordAt([4, 0]);
            chai_1.assert.equal(selectionManager.selectionText, ' ');
            selectionManager.selectWordAt([5, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'a中文b');
            selectionManager.selectWordAt([6, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'a中文b');
            selectionManager.selectWordAt([7, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'a中文b');
            selectionManager.selectWordAt([8, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'a中文b');
            selectionManager.selectWordAt([9, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'a中文b');
            selectionManager.selectWordAt([10, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'a中文b');
            selectionManager.selectWordAt([11, 0]);
            chai_1.assert.equal(selectionManager.selectionText, ' ');
            selectionManager.selectWordAt([12, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'foo');
            selectionManager.selectWordAt([13, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'foo');
            selectionManager.selectWordAt([14, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'foo');
        });
        it('should select up to non-path characters that are commonly adjacent to paths', function () {
            buffer.lines.set(0, stringToRow('(cd)[ef]{gh}\'ij"'));
            selectionManager.selectWordAt([0, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '(cd');
            selectionManager.selectWordAt([1, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'cd');
            selectionManager.selectWordAt([2, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'cd');
            selectionManager.selectWordAt([3, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'cd)');
            selectionManager.selectWordAt([4, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '[ef');
            selectionManager.selectWordAt([5, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'ef');
            selectionManager.selectWordAt([6, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'ef');
            selectionManager.selectWordAt([7, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'ef]');
            selectionManager.selectWordAt([8, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '{gh');
            selectionManager.selectWordAt([9, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'gh');
            selectionManager.selectWordAt([10, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'gh');
            selectionManager.selectWordAt([11, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'gh}');
            selectionManager.selectWordAt([12, 0]);
            chai_1.assert.equal(selectionManager.selectionText, '\'ij');
            selectionManager.selectWordAt([13, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'ij');
            selectionManager.selectWordAt([14, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'ij');
            selectionManager.selectWordAt([15, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'ij"');
        });
        it('should expand upwards or downards for wrapped lines', function () {
            buffer.lines.set(0, stringToRow('                                                                             foo'));
            buffer.lines.set(1, stringToRow('bar                                                                             '));
            buffer.lines.get(1).isWrapped = true;
            selectionManager.selectWordAt([1, 1]);
            chai_1.assert.equal(selectionManager.selectionText, 'foobar');
            selectionManager.model.clearSelection();
            selectionManager.selectWordAt([78, 0]);
            chai_1.assert.equal(selectionManager.selectionText, 'foobar');
        });
        it('should expand both upwards and downwards for word wrapped over many lines', function () {
            var expectedText = 'fooaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccbar';
            buffer.lines.set(0, stringToRow('                                                                             foo'));
            buffer.lines.set(1, stringToRow('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
            buffer.lines.set(2, stringToRow('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'));
            buffer.lines.set(3, stringToRow('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'));
            buffer.lines.set(4, stringToRow('bar                                                                             '));
            buffer.lines.get(1).isWrapped = true;
            buffer.lines.get(2).isWrapped = true;
            buffer.lines.get(3).isWrapped = true;
            buffer.lines.get(4).isWrapped = true;
            selectionManager.selectWordAt([78, 0]);
            chai_1.assert.equal(selectionManager.selectionText, expectedText);
            selectionManager.model.clearSelection();
            selectionManager.selectWordAt([40, 1]);
            chai_1.assert.equal(selectionManager.selectionText, expectedText);
            selectionManager.model.clearSelection();
            selectionManager.selectWordAt([40, 2]);
            chai_1.assert.equal(selectionManager.selectionText, expectedText);
            selectionManager.model.clearSelection();
            selectionManager.selectWordAt([40, 3]);
            chai_1.assert.equal(selectionManager.selectionText, expectedText);
            selectionManager.model.clearSelection();
            selectionManager.selectWordAt([1, 4]);
            chai_1.assert.equal(selectionManager.selectionText, expectedText);
        });
        describe('emoji', function () {
            it('should treat a single emoji as a word when wrapped in spaces', function () {
                buffer.lines.set(0, stringToRow(' ⚽ a'));
                selectionManager.selectWordAt([0, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([1, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '⚽');
                selectionManager.selectWordAt([2, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
            });
            it('should treat multiple emojis as a word when wrapped in spaces', function () {
                buffer.lines.set(0, stringToRow(' ⚽⚽ a'));
                selectionManager.selectWordAt([0, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([1, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '⚽⚽');
                selectionManager.selectWordAt([2, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '⚽⚽');
                selectionManager.selectWordAt([3, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
            });
            it('should treat emojis using the zero-width-joiner as a single word', function () {
                buffer.lines.set(0, stringArrayToRow([
                    ' ', '👨‍', '👩‍', '👧‍', '👦', ' ', 'a'
                ]));
                selectionManager.selectWordAt([0, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([1, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '👨‍👩‍👧‍👦');
                selectionManager.selectWordAt([2, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '👨‍👩‍👧‍👦');
                selectionManager.selectWordAt([3, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '👨‍👩‍👧‍👦');
                selectionManager.selectWordAt([4, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '👨‍👩‍👧‍👦');
                selectionManager.selectWordAt([5, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
            });
            it('should treat emojis and characters joined together as a word', function () {
                buffer.lines.set(0, stringToRow(' ⚽ab cd⚽ ef⚽gh'));
                selectionManager.selectWordAt([0, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([1, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '⚽ab');
                selectionManager.selectWordAt([2, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '⚽ab');
                selectionManager.selectWordAt([3, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '⚽ab');
                selectionManager.selectWordAt([4, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([5, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'cd⚽');
                selectionManager.selectWordAt([6, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'cd⚽');
                selectionManager.selectWordAt([7, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'cd⚽');
                selectionManager.selectWordAt([8, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([9, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef⚽gh');
                selectionManager.selectWordAt([10, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef⚽gh');
                selectionManager.selectWordAt([11, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef⚽gh');
                selectionManager.selectWordAt([12, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef⚽gh');
                selectionManager.selectWordAt([13, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef⚽gh');
            });
            it('should treat complex emojis and characters joined together as a word', function () {
                buffer.lines.set(0, stringArrayToRow([
                    ' ', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'a', 'b', ' ', 'c', 'd', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ' ', 'e', 'f', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'g', 'h', ' ', 'a'
                ]));
                selectionManager.selectWordAt([0, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([1, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '🏴󠁧󠁢󠁥󠁮󠁧󠁿ab');
                selectionManager.selectWordAt([2, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '🏴󠁧󠁢󠁥󠁮󠁧󠁿ab');
                selectionManager.selectWordAt([3, 0]);
                chai_1.assert.equal(selectionManager.selectionText, '🏴󠁧󠁢󠁥󠁮󠁧󠁿ab');
                selectionManager.selectWordAt([4, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([5, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'cd🏴󠁧󠁢󠁥󠁮󠁧󠁿');
                selectionManager.selectWordAt([6, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'cd🏴󠁧󠁢󠁥󠁮󠁧󠁿');
                selectionManager.selectWordAt([7, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'cd🏴󠁧󠁢󠁥󠁮󠁧󠁿');
                selectionManager.selectWordAt([8, 0]);
                chai_1.assert.equal(selectionManager.selectionText, ' ');
                selectionManager.selectWordAt([9, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef🏴󠁧󠁢󠁥󠁮󠁧󠁿gh');
                selectionManager.selectWordAt([10, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef🏴󠁧󠁢󠁥󠁮󠁧󠁿gh');
                selectionManager.selectWordAt([11, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef🏴󠁧󠁢󠁥󠁮󠁧󠁿gh');
                selectionManager.selectWordAt([12, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef🏴󠁧󠁢󠁥󠁮󠁧󠁿gh');
                selectionManager.selectWordAt([13, 0]);
                chai_1.assert.equal(selectionManager.selectionText, 'ef🏴󠁧󠁢󠁥󠁮󠁧󠁿gh');
            });
        });
    });
    describe('_selectLineAt', function () {
        it('should select the entire line', function () {
            buffer.lines.set(0, stringToRow('foo bar'));
            selectionManager.selectLineAt(0);
            chai_1.assert.equal(selectionManager.selectionText, 'foo bar', 'The selected text is correct');
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionStart, [0, 0]);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionEnd, [terminal.cols, 0], 'The actual selection spans the entire column');
        });
        it('should select the entire wrapped line', function () {
            buffer.lines.set(0, stringToRow('foo'));
            var line2 = stringToRow('bar');
            line2.isWrapped = true;
            buffer.lines.set(1, line2);
            selectionManager.selectLineAt(0);
            chai_1.assert.equal(selectionManager.selectionText, 'foobar', 'The selected text is correct');
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionStart, [0, 0]);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionEnd, [terminal.cols, 1], 'The actual selection spans the entire column');
        });
    });
    describe('selectAll', function () {
        it('should select the entire buffer, beyond the viewport', function () {
            buffer.lines.length = 5;
            buffer.lines.set(0, stringToRow('1'));
            buffer.lines.set(1, stringToRow('2'));
            buffer.lines.set(2, stringToRow('3'));
            buffer.lines.set(3, stringToRow('4'));
            buffer.lines.set(4, stringToRow('5'));
            selectionManager.selectAll();
            terminal.buffer.ybase = buffer.lines.length - terminal.rows;
            chai_1.assert.equal(selectionManager.selectionText, '1\n2\n3\n4\n5');
        });
    });
    describe('selectLines', function () {
        it('should select a single line', function () {
            buffer.lines.length = 3;
            buffer.lines.set(0, stringToRow('1'));
            buffer.lines.set(1, stringToRow('2'));
            buffer.lines.set(2, stringToRow('3'));
            selectionManager.selectLines(1, 1);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionStart, [0, 1]);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionEnd, [terminal.cols, 1]);
        });
        it('should select multiple lines', function () {
            buffer.lines.length = 5;
            buffer.lines.set(0, stringToRow('1'));
            buffer.lines.set(1, stringToRow('2'));
            buffer.lines.set(2, stringToRow('3'));
            buffer.lines.set(3, stringToRow('4'));
            buffer.lines.set(4, stringToRow('5'));
            selectionManager.selectLines(1, 3);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionStart, [0, 1]);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionEnd, [terminal.cols, 3]);
        });
        it('should select the to the start when requesting a negative row', function () {
            buffer.lines.length = 2;
            buffer.lines.set(0, stringToRow('1'));
            buffer.lines.set(1, stringToRow('2'));
            selectionManager.selectLines(-1, 0);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionStart, [0, 0]);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionEnd, [terminal.cols, 0]);
        });
        it('should select the to the end when requesting beyond the final row', function () {
            buffer.lines.length = 2;
            buffer.lines.set(0, stringToRow('1'));
            buffer.lines.set(1, stringToRow('2'));
            selectionManager.selectLines(1, 2);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionStart, [0, 1]);
            chai_1.assert.deepEqual(selectionManager.model.finalSelectionEnd, [terminal.cols, 1]);
        });
    });
    describe('hasSelection', function () {
        it('should return whether there is a selection', function () {
            selectionManager.model.selectionStart = [0, 0];
            selectionManager.model.selectionStartLength = 0;
            chai_1.assert.equal(selectionManager.hasSelection, false);
            selectionManager.model.selectionEnd = [0, 0];
            chai_1.assert.equal(selectionManager.hasSelection, false);
            selectionManager.model.selectionEnd = [1, 0];
            chai_1.assert.equal(selectionManager.hasSelection, true);
            selectionManager.model.selectionEnd = [0, 1];
            chai_1.assert.equal(selectionManager.hasSelection, true);
            selectionManager.model.selectionEnd = [1, 1];
            chai_1.assert.equal(selectionManager.hasSelection, true);
        });
    });
    describe('column selection', function () {
        it('should select a column of text', function () {
            buffer.lines.length = 3;
            buffer.lines.set(0, stringToRow('abcdefghij'));
            buffer.lines.set(1, stringToRow('klmnopqrst'));
            buffer.lines.set(2, stringToRow('uvwxyz'));
            selectionManager.selectionMode = 3;
            selectionManager.model.selectionStart = [2, 0];
            selectionManager.model.selectionEnd = [4, 2];
            chai_1.assert.equal(selectionManager.selectionText, 'cd\nmn\nwx');
        });
        it('should select a column of text without chopping up double width characters', function () {
            buffer.lines.length = 3;
            buffer.lines.set(0, stringToRow('a'));
            buffer.lines.set(1, stringToRow('語'));
            buffer.lines.set(2, stringToRow('b'));
            selectionManager.selectionMode = 3;
            selectionManager.model.selectionStart = [0, 0];
            selectionManager.model.selectionEnd = [1, 2];
            chai_1.assert.equal(selectionManager.selectionText, 'a\n語\nb');
        });
        it('should select a column of text with single character emojis', function () {
            buffer.lines.length = 3;
            buffer.lines.set(0, stringToRow('a'));
            buffer.lines.set(1, stringToRow('☃'));
            buffer.lines.set(2, stringToRow('c'));
            selectionManager.selectionMode = 3;
            selectionManager.model.selectionStart = [0, 0];
            selectionManager.model.selectionEnd = [1, 2];
            chai_1.assert.equal(selectionManager.selectionText, 'a\n☃\nc');
        });
        it('should select a column of text with double character emojis', function () {
            buffer.lines.length = 3;
            buffer.lines.set(0, stringToRow('a '));
            buffer.lines.set(1, stringArrayToRow(['😁', ' ']));
            buffer.lines.set(2, stringToRow('c '));
            selectionManager.selectionMode = 3;
            selectionManager.model.selectionStart = [0, 0];
            selectionManager.model.selectionEnd = [1, 2];
            chai_1.assert.equal(selectionManager.selectionText, 'a\n😁\nc');
        });
    });
    describe('_areCoordsInSelection', function () {
        it('should return whether coords are in the selection', function () {
            chai_1.assert.isFalse(selectionManager.areCoordsInSelection([0, 0], [2, 0], [2, 1]));
            chai_1.assert.isFalse(selectionManager.areCoordsInSelection([1, 0], [2, 0], [2, 1]));
            chai_1.assert.isTrue(selectionManager.areCoordsInSelection([2, 0], [2, 0], [2, 1]));
            chai_1.assert.isTrue(selectionManager.areCoordsInSelection([10, 0], [2, 0], [2, 1]));
            chai_1.assert.isTrue(selectionManager.areCoordsInSelection([0, 1], [2, 0], [2, 1]));
            chai_1.assert.isTrue(selectionManager.areCoordsInSelection([1, 1], [2, 0], [2, 1]));
            chai_1.assert.isFalse(selectionManager.areCoordsInSelection([2, 1], [2, 0], [2, 1]));
        });
    });
});
//# sourceMappingURL=SelectionManager.test.js.map