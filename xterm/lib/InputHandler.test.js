"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var InputHandler_1 = require("./InputHandler");
var TestUtils_test_1 = require("./TestUtils.test");
var Buffer_1 = require("./Buffer");
var Terminal_1 = require("./Terminal");
var BufferLine_1 = require("./BufferLine");
describe('InputHandler', function () {
    describe('save and restore cursor', function () {
        var terminal = new TestUtils_test_1.MockInputHandlingTerminal();
        terminal.buffer.x = 1;
        terminal.buffer.y = 2;
        terminal.curAttrData.fg = 3;
        var inputHandler = new InputHandler_1.InputHandler(terminal);
        inputHandler.saveCursor([]);
        chai_1.assert.equal(terminal.buffer.x, 1);
        chai_1.assert.equal(terminal.buffer.y, 2);
        chai_1.assert.equal(terminal.curAttrData.fg, 3);
        terminal.buffer.x = 10;
        terminal.buffer.y = 20;
        terminal.curAttrData.fg = 30;
        inputHandler.restoreCursor([]);
        chai_1.assert.equal(terminal.buffer.x, 1);
        chai_1.assert.equal(terminal.buffer.y, 2);
        chai_1.assert.equal(terminal.curAttrData.fg, 3);
    });
    describe('setCursorStyle', function () {
        it('should call Terminal.setOption with correct params', function () {
            var terminal = new TestUtils_test_1.MockInputHandlingTerminal();
            var inputHandler = new InputHandler_1.InputHandler(terminal);
            var collect = ' ';
            inputHandler.setCursorStyle([0], collect);
            chai_1.assert.equal(terminal.options['cursorStyle'], 'block');
            chai_1.assert.equal(terminal.options['cursorBlink'], true);
            terminal.options = {};
            inputHandler.setCursorStyle([1], collect);
            chai_1.assert.equal(terminal.options['cursorStyle'], 'block');
            chai_1.assert.equal(terminal.options['cursorBlink'], true);
            terminal.options = {};
            inputHandler.setCursorStyle([2], collect);
            chai_1.assert.equal(terminal.options['cursorStyle'], 'block');
            chai_1.assert.equal(terminal.options['cursorBlink'], false);
            terminal.options = {};
            inputHandler.setCursorStyle([3], collect);
            chai_1.assert.equal(terminal.options['cursorStyle'], 'underline');
            chai_1.assert.equal(terminal.options['cursorBlink'], true);
            terminal.options = {};
            inputHandler.setCursorStyle([4], collect);
            chai_1.assert.equal(terminal.options['cursorStyle'], 'underline');
            chai_1.assert.equal(terminal.options['cursorBlink'], false);
            terminal.options = {};
            inputHandler.setCursorStyle([5], collect);
            chai_1.assert.equal(terminal.options['cursorStyle'], 'bar');
            chai_1.assert.equal(terminal.options['cursorBlink'], true);
            terminal.options = {};
            inputHandler.setCursorStyle([6], collect);
            chai_1.assert.equal(terminal.options['cursorStyle'], 'bar');
            chai_1.assert.equal(terminal.options['cursorBlink'], false);
        });
    });
    describe('setMode', function () {
        it('should toggle Terminal.bracketedPasteMode', function () {
            var terminal = new TestUtils_test_1.MockInputHandlingTerminal();
            var collect = '?';
            terminal.bracketedPasteMode = false;
            var inputHandler = new InputHandler_1.InputHandler(terminal);
            inputHandler.setMode([2004], collect);
            chai_1.assert.equal(terminal.bracketedPasteMode, true);
            inputHandler.resetMode([2004], collect);
            chai_1.assert.equal(terminal.bracketedPasteMode, false);
        });
    });
    describe('regression tests', function () {
        function termContent(term, trim) {
            var result = [];
            for (var i = 0; i < term.rows; ++i)
                result.push(term.buffer.lines.get(i).translateToString(trim));
            return result;
        }
        it('insertChars', function () {
            var term = new Terminal_1.Terminal();
            var inputHandler = new InputHandler_1.InputHandler(term);
            inputHandler.parse(Array(term.cols - 9).join('a'));
            inputHandler.parse('1234567890');
            inputHandler.parse(Array(term.cols - 9).join('a'));
            inputHandler.parse('1234567890');
            var line1 = term.buffer.lines.get(0);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '1234567890');
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.insertChars([0]);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + ' 123456789');
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.insertChars([1]);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '  12345678');
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.insertChars([2]);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '    123456');
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.insertChars([10]);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '          ');
            chai_1.expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a'));
        });
        it('deleteChars', function () {
            var term = new Terminal_1.Terminal();
            var inputHandler = new InputHandler_1.InputHandler(term);
            inputHandler.parse(Array(term.cols - 9).join('a'));
            inputHandler.parse('1234567890');
            inputHandler.parse(Array(term.cols - 9).join('a'));
            inputHandler.parse('1234567890');
            var line1 = term.buffer.lines.get(0);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '1234567890');
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.deleteChars([0]);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '234567890 ');
            chai_1.expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a') + '234567890');
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.deleteChars([1]);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '34567890  ');
            chai_1.expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a') + '34567890');
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.deleteChars([2]);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '567890    ');
            chai_1.expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a') + '567890');
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.deleteChars([10]);
            chai_1.expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '          ');
            chai_1.expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a'));
        });
        it('eraseInLine', function () {
            var term = new Terminal_1.Terminal();
            var inputHandler = new InputHandler_1.InputHandler(term);
            inputHandler.parse(Array(term.cols + 1).join('a'));
            inputHandler.parse(Array(term.cols + 1).join('a'));
            inputHandler.parse(Array(term.cols + 1).join('a'));
            term.buffer.y = 0;
            term.buffer.x = 70;
            inputHandler.eraseInLine([0]);
            chai_1.expect(term.buffer.lines.get(0).translateToString(false)).equals(Array(71).join('a') + '          ');
            term.buffer.y = 1;
            term.buffer.x = 70;
            inputHandler.eraseInLine([1]);
            chai_1.expect(term.buffer.lines.get(1).translateToString(false)).equals(Array(71).join(' ') + ' aaaaaaaaa');
            term.buffer.y = 2;
            term.buffer.x = 70;
            inputHandler.eraseInLine([2]);
            chai_1.expect(term.buffer.lines.get(2).translateToString(false)).equals(Array(term.cols + 1).join(' '));
        });
        it('eraseInDisplay', function () {
            var term = new Terminal_1.Terminal({ cols: 80, rows: 7 });
            var inputHandler = new InputHandler_1.InputHandler(term);
            for (var i = 0; i < term.rows; ++i)
                inputHandler.parse(Array(term.cols + 1).join('a'));
            term.buffer.y = 5;
            term.buffer.x = 40;
            inputHandler.eraseInDisplay([0]);
            chai_1.expect(termContent(term, false)).eql([
                Array(term.cols + 1).join('a'),
                Array(term.cols + 1).join('a'),
                Array(term.cols + 1).join('a'),
                Array(term.cols + 1).join('a'),
                Array(term.cols + 1).join('a'),
                Array(40 + 1).join('a') + Array(term.cols - 40 + 1).join(' '),
                Array(term.cols + 1).join(' ')
            ]);
            chai_1.expect(termContent(term, true)).eql([
                Array(term.cols + 1).join('a'),
                Array(term.cols + 1).join('a'),
                Array(term.cols + 1).join('a'),
                Array(term.cols + 1).join('a'),
                Array(term.cols + 1).join('a'),
                Array(40 + 1).join('a'),
                ''
            ]);
            term.buffer.y = 0;
            term.buffer.x = 0;
            for (var i = 0; i < term.rows; ++i)
                inputHandler.parse(Array(term.cols + 1).join('a'));
            term.buffer.y = 5;
            term.buffer.x = 40;
            inputHandler.eraseInDisplay([1]);
            chai_1.expect(termContent(term, false)).eql([
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(41 + 1).join(' ') + Array(term.cols - 41 + 1).join('a'),
                Array(term.cols + 1).join('a')
            ]);
            chai_1.expect(termContent(term, true)).eql([
                '',
                '',
                '',
                '',
                '',
                Array(41 + 1).join(' ') + Array(term.cols - 41 + 1).join('a'),
                Array(term.cols + 1).join('a')
            ]);
            term.buffer.y = 0;
            term.buffer.x = 0;
            for (var i = 0; i < term.rows; ++i)
                inputHandler.parse(Array(term.cols + 1).join('a'));
            term.buffer.y = 5;
            term.buffer.x = 40;
            inputHandler.eraseInDisplay([2]);
            chai_1.expect(termContent(term, false)).eql([
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' '),
                Array(term.cols + 1).join(' ')
            ]);
            chai_1.expect(termContent(term, true)).eql([
                '',
                '',
                '',
                '',
                '',
                '',
                ''
            ]);
            term.buffer.y = 0;
            term.buffer.x = 0;
            inputHandler.parse(Array(term.cols + 1).join('a'));
            inputHandler.parse(Array(term.cols + 10).join('a'));
            for (var i = 3; i < term.rows; ++i)
                inputHandler.parse(Array(term.cols + 1).join('a'));
            chai_1.expect(term.buffer.lines.get(2).isWrapped).true;
            term.buffer.y = 2;
            term.buffer.x = 40;
            inputHandler.eraseInDisplay([1]);
            chai_1.expect(term.buffer.lines.get(2).isWrapped).false;
            term.buffer.y = 0;
            term.buffer.x = 0;
            inputHandler.parse(Array(term.cols + 1).join('a'));
            inputHandler.parse(Array(term.cols + 10).join('a'));
            for (var i = 3; i < term.rows; ++i)
                inputHandler.parse(Array(term.cols + 1).join('a'));
            chai_1.expect(term.buffer.lines.get(2).isWrapped).true;
            term.buffer.y = 1;
            term.buffer.x = 90;
            inputHandler.eraseInDisplay([1]);
            chai_1.expect(term.buffer.lines.get(2).isWrapped).false;
        });
    });
    it('convertEol setting', function () {
        var termNotConverting = new Terminal_1.Terminal({ cols: 15, rows: 10 });
        termNotConverting._inputHandler.parse('Hello\nWorld');
        chai_1.expect(termNotConverting.buffer.lines.get(0).translateToString(false)).equals('Hello          ');
        chai_1.expect(termNotConverting.buffer.lines.get(1).translateToString(false)).equals('     World     ');
        chai_1.expect(termNotConverting.buffer.lines.get(0).translateToString(true)).equals('Hello');
        chai_1.expect(termNotConverting.buffer.lines.get(1).translateToString(true)).equals('     World');
        var termConverting = new Terminal_1.Terminal({ cols: 15, rows: 10, convertEol: true });
        termConverting._inputHandler.parse('Hello\nWorld');
        chai_1.expect(termConverting.buffer.lines.get(0).translateToString(false)).equals('Hello          ');
        chai_1.expect(termConverting.buffer.lines.get(1).translateToString(false)).equals('World          ');
        chai_1.expect(termConverting.buffer.lines.get(0).translateToString(true)).equals('Hello');
        chai_1.expect(termConverting.buffer.lines.get(1).translateToString(true)).equals('World');
    });
    describe('print', function () {
        it('should not cause an infinite loop (regression test)', function () {
            var term = new Terminal_1.Terminal();
            var inputHandler = new InputHandler_1.InputHandler(term);
            var container = new Uint32Array(10);
            container[0] = 0x200B;
            inputHandler.print(container, 0, 1);
        });
    });
    describe('alt screen', function () {
        var term;
        var handler;
        beforeEach(function () {
            term = new Terminal_1.Terminal();
            handler = new InputHandler_1.InputHandler(term);
        });
        it('should handle DECSET/DECRST 47 (alt screen buffer)', function () {
            handler.parse('\x1b[?47h\r\n\x1b[31mJUNK\x1b[?47lTEST');
            chai_1.expect(term.buffer.translateBufferLineToString(0, true)).to.equal('');
            chai_1.expect(term.buffer.translateBufferLineToString(1, true)).to.equal('    TEST');
            chai_1.expect((term.buffer.lines.get(1).loadCell(4, new BufferLine_1.CellData()).getFgColor())).to.equal(1);
        });
        it('should handle DECSET/DECRST 1047 (alt screen buffer)', function () {
            handler.parse('\x1b[?1047h\r\n\x1b[31mJUNK\x1b[?1047lTEST');
            chai_1.expect(term.buffer.translateBufferLineToString(0, true)).to.equal('');
            chai_1.expect(term.buffer.translateBufferLineToString(1, true)).to.equal('    TEST');
            chai_1.expect((term.buffer.lines.get(1).loadCell(4, new BufferLine_1.CellData()).getFgColor())).to.equal(1);
        });
        it('should handle DECSET/DECRST 1048 (alt screen cursor)', function () {
            handler.parse('\x1b[?1048h\r\n\x1b[31mJUNK\x1b[?1048lTEST');
            chai_1.expect(term.buffer.translateBufferLineToString(0, true)).to.equal('TEST');
            chai_1.expect(term.buffer.translateBufferLineToString(1, true)).to.equal('JUNK');
            chai_1.expect(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).fg).to.equal(Buffer_1.DEFAULT_ATTR_DATA.fg);
            chai_1.expect((term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getFgColor())).to.equal(1);
        });
        it('should handle DECSET/DECRST 1049 (alt screen buffer+cursor)', function () {
            handler.parse('\x1b[?1049h\r\n\x1b[31mJUNK\x1b[?1049lTEST');
            chai_1.expect(term.buffer.translateBufferLineToString(0, true)).to.equal('TEST');
            chai_1.expect(term.buffer.translateBufferLineToString(1, true)).to.equal('');
            chai_1.expect(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).fg).to.equal(Buffer_1.DEFAULT_ATTR_DATA.fg);
        });
        it('should handle DECSET/DECRST 1049 - maintains saved cursor for alt buffer', function () {
            handler.parse('\x1b[?1049h\r\n\x1b[31m\x1b[s\x1b[?1049lTEST');
            chai_1.expect(term.buffer.translateBufferLineToString(0, true)).to.equal('TEST');
            chai_1.expect(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).fg).to.equal(Buffer_1.DEFAULT_ATTR_DATA.fg);
            handler.parse('\x1b[?1049h\x1b[uTEST');
            chai_1.expect(term.buffer.translateBufferLineToString(1, true)).to.equal('TEST');
            chai_1.expect((term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getFgColor())).to.equal(1);
        });
        it('should handle DECSET/DECRST 1049 - clears alt buffer with erase attributes', function () {
            handler.parse('\x1b[42m\x1b[?1049h');
            chai_1.expect(term.buffer.lines.get(20).loadCell(10, new BufferLine_1.CellData()).getBgColor()).to.equal(2);
        });
    });
    describe('text attributes', function () {
        var term;
        beforeEach(function () {
            term = new TestUtils_test_1.TestTerminal();
        });
        it('bold', function () {
            term.writeSync('\x1b[1m');
            chai_1.assert.equal(!!term.curAttrData.isBold(), true);
            term.writeSync('\x1b[22m');
            chai_1.assert.equal(!!term.curAttrData.isBold(), false);
        });
        it('dim', function () {
            term.writeSync('\x1b[2m');
            chai_1.assert.equal(!!term.curAttrData.isDim(), true);
            term.writeSync('\x1b[22m');
            chai_1.assert.equal(!!term.curAttrData.isDim(), false);
        });
        it('italic', function () {
            term.writeSync('\x1b[3m');
            chai_1.assert.equal(!!term.curAttrData.isItalic(), true);
            term.writeSync('\x1b[23m');
            chai_1.assert.equal(!!term.curAttrData.isItalic(), false);
        });
        it('underline', function () {
            term.writeSync('\x1b[4m');
            chai_1.assert.equal(!!term.curAttrData.isUnderline(), true);
            term.writeSync('\x1b[24m');
            chai_1.assert.equal(!!term.curAttrData.isUnderline(), false);
        });
        it('blink', function () {
            term.writeSync('\x1b[5m');
            chai_1.assert.equal(!!term.curAttrData.isBlink(), true);
            term.writeSync('\x1b[25m');
            chai_1.assert.equal(!!term.curAttrData.isBlink(), false);
        });
        it('inverse', function () {
            term.writeSync('\x1b[7m');
            chai_1.assert.equal(!!term.curAttrData.isInverse(), true);
            term.writeSync('\x1b[27m');
            chai_1.assert.equal(!!term.curAttrData.isInverse(), false);
        });
        it('invisible', function () {
            term.writeSync('\x1b[8m');
            chai_1.assert.equal(!!term.curAttrData.isInvisible(), true);
            term.writeSync('\x1b[28m');
            chai_1.assert.equal(!!term.curAttrData.isInvisible(), false);
        });
        it('colormode palette 16', function () {
            chai_1.assert.equal(term.curAttrData.getFgColorMode(), 0);
            chai_1.assert.equal(term.curAttrData.getBgColorMode(), 0);
            for (var i = 0; i < 8; ++i) {
                term.writeSync("\u001B[" + (i + 30) + ";" + (i + 40) + "m");
                chai_1.assert.equal(term.curAttrData.getFgColorMode(), 16777216);
                chai_1.assert.equal(term.curAttrData.getFgColor(), i);
                chai_1.assert.equal(term.curAttrData.getBgColorMode(), 16777216);
                chai_1.assert.equal(term.curAttrData.getBgColor(), i);
            }
            term.writeSync("\u001B[39;49m");
            chai_1.assert.equal(term.curAttrData.getFgColorMode(), 0);
            chai_1.assert.equal(term.curAttrData.getBgColorMode(), 0);
        });
        it('colormode palette 256', function () {
            chai_1.assert.equal(term.curAttrData.getFgColorMode(), 0);
            chai_1.assert.equal(term.curAttrData.getBgColorMode(), 0);
            for (var i = 0; i < 256; ++i) {
                term.writeSync("\u001B[38;5;" + i + ";48;5;" + i + "m");
                chai_1.assert.equal(term.curAttrData.getFgColorMode(), 33554432);
                chai_1.assert.equal(term.curAttrData.getFgColor(), i);
                chai_1.assert.equal(term.curAttrData.getBgColorMode(), 33554432);
                chai_1.assert.equal(term.curAttrData.getBgColor(), i);
            }
            term.writeSync("\u001B[39;49m");
            chai_1.assert.equal(term.curAttrData.getFgColorMode(), 0);
            chai_1.assert.equal(term.curAttrData.getFgColor(), -1);
            chai_1.assert.equal(term.curAttrData.getBgColorMode(), 0);
            chai_1.assert.equal(term.curAttrData.getBgColor(), -1);
        });
        it('colormode RGB', function () {
            chai_1.assert.equal(term.curAttrData.getFgColorMode(), 0);
            chai_1.assert.equal(term.curAttrData.getBgColorMode(), 0);
            term.writeSync("\u001B[38;2;1;2;3;48;2;4;5;6m");
            chai_1.assert.equal(term.curAttrData.getFgColorMode(), 50331648);
            chai_1.assert.equal(term.curAttrData.getFgColor(), 1 << 16 | 2 << 8 | 3);
            chai_1.assert.deepEqual(BufferLine_1.AttributeData.toColorRGB(term.curAttrData.getFgColor()), [1, 2, 3]);
            chai_1.assert.equal(term.curAttrData.getBgColorMode(), 50331648);
            chai_1.assert.deepEqual(BufferLine_1.AttributeData.toColorRGB(term.curAttrData.getBgColor()), [4, 5, 6]);
            term.writeSync("\u001B[39;49m");
            chai_1.assert.equal(term.curAttrData.getFgColorMode(), 0);
            chai_1.assert.equal(term.curAttrData.getFgColor(), -1);
            chai_1.assert.equal(term.curAttrData.getBgColorMode(), 0);
            chai_1.assert.equal(term.curAttrData.getBgColor(), -1);
        });
        it('should zero missing RGB values', function () {
            term.writeSync("\u001B[38;2;1;2;3m");
            term.writeSync("\u001B[38;2;5m");
            chai_1.assert.deepEqual(BufferLine_1.AttributeData.toColorRGB(term.curAttrData.getFgColor()), [5, 0, 0]);
        });
    });
});
//# sourceMappingURL=InputHandler.test.js.map