"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var Buffer_1 = require("./Buffer");
var CircularList_1 = require("./common/CircularList");
var TestUtils_test_1 = require("./TestUtils.test");
var BufferLine_1 = require("./BufferLine");
var INIT_COLS = 80;
var INIT_ROWS = 24;
describe('Buffer', function () {
    var terminal;
    var buffer;
    beforeEach(function () {
        terminal = new TestUtils_test_1.MockTerminal();
        terminal.cols = INIT_COLS;
        terminal.rows = INIT_ROWS;
        terminal.options.scrollback = 1000;
        buffer = new Buffer_1.Buffer(terminal, true);
    });
    describe('constructor', function () {
        it('should create a CircularList with max length equal to rows + scrollback, for its lines', function () {
            chai_1.assert.instanceOf(buffer.lines, CircularList_1.CircularList);
            chai_1.assert.equal(buffer.lines.maxLength, terminal.rows + terminal.options.scrollback);
        });
        it('should set the Buffer\'s scrollBottom value equal to the terminal\'s rows -1', function () {
            chai_1.assert.equal(buffer.scrollBottom, terminal.rows - 1);
        });
    });
    describe('fillViewportRows', function () {
        it('should fill the buffer with blank lines based on the size of the viewport', function () {
            var blankLineChar = buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA).loadCell(0, new BufferLine_1.CellData()).getAsCharData();
            buffer.fillViewportRows();
            chai_1.assert.equal(buffer.lines.length, INIT_ROWS);
            for (var y = 0; y < INIT_ROWS; y++) {
                chai_1.assert.equal(buffer.lines.get(y).length, INIT_COLS);
                for (var x = 0; x < INIT_COLS; x++) {
                    chai_1.assert.deepEqual(buffer.lines.get(y).loadCell(x, new BufferLine_1.CellData()).getAsCharData(), blankLineChar);
                }
            }
        });
    });
    describe('getWrappedRangeForLine', function () {
        describe('non-wrapped', function () {
            it('should return a single row for the first row', function () {
                buffer.fillViewportRows();
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(0), { first: 0, last: 0 });
            });
            it('should return a single row for a middle row', function () {
                buffer.fillViewportRows();
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(12), { first: 12, last: 12 });
            });
            it('should return a single row for the last row', function () {
                buffer.fillViewportRows();
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(buffer.lines.length - 1), { first: 23, last: 23 });
            });
        });
        describe('wrapped', function () {
            it('should return a range for the first row', function () {
                buffer.fillViewportRows();
                buffer.lines.get(1).isWrapped = true;
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(0), { first: 0, last: 1 });
            });
            it('should return a range for a middle row wrapping upwards', function () {
                buffer.fillViewportRows();
                buffer.lines.get(12).isWrapped = true;
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(12), { first: 11, last: 12 });
            });
            it('should return a range for a middle row wrapping downwards', function () {
                buffer.fillViewportRows();
                buffer.lines.get(13).isWrapped = true;
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(12), { first: 12, last: 13 });
            });
            it('should return a range for a middle row wrapping both ways', function () {
                buffer.fillViewportRows();
                buffer.lines.get(11).isWrapped = true;
                buffer.lines.get(12).isWrapped = true;
                buffer.lines.get(13).isWrapped = true;
                buffer.lines.get(14).isWrapped = true;
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(12), { first: 10, last: 14 });
            });
            it('should return a range for the last row', function () {
                buffer.fillViewportRows();
                buffer.lines.get(23).isWrapped = true;
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(buffer.lines.length - 1), { first: 22, last: 23 });
            });
            it('should return a range for a row that wraps upward to first row', function () {
                buffer.fillViewportRows();
                buffer.lines.get(1).isWrapped = true;
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(1), { first: 0, last: 1 });
            });
            it('should return a range for a row that wraps downward to last row', function () {
                buffer.fillViewportRows();
                buffer.lines.get(buffer.lines.length - 1).isWrapped = true;
                chai_1.assert.deepEqual(buffer.getWrappedRangeForLine(buffer.lines.length - 2), { first: 22, last: 23 });
            });
        });
    });
    describe('resize', function () {
        describe('column size is reduced', function () {
            it('should trim the data in the buffer', function () {
                buffer.fillViewportRows();
                buffer.resize(INIT_COLS / 2, INIT_ROWS);
                chai_1.assert.equal(buffer.lines.length, INIT_ROWS);
                for (var i = 0; i < INIT_ROWS; i++) {
                    chai_1.assert.equal(buffer.lines.get(i).length, INIT_COLS / 2);
                }
            });
        });
        describe('column size is increased', function () {
            it('should add pad columns', function () {
                buffer.fillViewportRows();
                buffer.resize(INIT_COLS + 10, INIT_ROWS);
                chai_1.assert.equal(buffer.lines.length, INIT_ROWS);
                for (var i = 0; i < INIT_ROWS; i++) {
                    chai_1.assert.equal(buffer.lines.get(i).length, INIT_COLS + 10);
                }
            });
        });
        describe('row size reduced', function () {
            it('should trim blank lines from the end', function () {
                buffer.fillViewportRows();
                buffer.resize(INIT_COLS, INIT_ROWS - 10);
                chai_1.assert.equal(buffer.lines.length, INIT_ROWS - 10);
            });
            it('should move the viewport down when it\'s at the end', function () {
                buffer.fillViewportRows();
                buffer.y = INIT_ROWS - 5 - 1;
                buffer.resize(INIT_COLS, INIT_ROWS - 10);
                chai_1.assert.equal(buffer.lines.length, INIT_ROWS - 5);
                chai_1.assert.equal(buffer.ydisp, 5);
                chai_1.assert.equal(buffer.ybase, 5);
            });
            describe('no scrollback', function () {
                it('should trim from the top of the buffer when the cursor reaches the bottom', function () {
                    terminal.options.scrollback = 0;
                    buffer = new Buffer_1.Buffer(terminal, true);
                    chai_1.assert.equal(buffer.lines.maxLength, INIT_ROWS);
                    buffer.y = INIT_ROWS - 1;
                    buffer.fillViewportRows();
                    var chData = buffer.lines.get(5).loadCell(0, new BufferLine_1.CellData()).getAsCharData();
                    chData[1] = 'a';
                    buffer.lines.get(5).setCell(0, BufferLine_1.CellData.fromCharData(chData));
                    chData = buffer.lines.get(INIT_ROWS - 1).loadCell(0, new BufferLine_1.CellData()).getAsCharData();
                    chData[1] = 'b';
                    buffer.lines.get(INIT_ROWS - 1).setCell(0, BufferLine_1.CellData.fromCharData(chData));
                    buffer.resize(INIT_COLS, INIT_ROWS - 5);
                    chai_1.assert.equal(buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getAsCharData()[1], 'a');
                    chai_1.assert.equal(buffer.lines.get(INIT_ROWS - 1 - 5).loadCell(0, new BufferLine_1.CellData()).getAsCharData()[1], 'b');
                });
            });
        });
        describe('row size increased', function () {
            describe('empty buffer', function () {
                it('should add blank lines to end', function () {
                    buffer.fillViewportRows();
                    chai_1.assert.equal(buffer.ydisp, 0);
                    buffer.resize(INIT_COLS, INIT_ROWS + 10);
                    chai_1.assert.equal(buffer.ydisp, 0);
                    chai_1.assert.equal(buffer.lines.length, INIT_ROWS + 10);
                });
            });
            describe('filled buffer', function () {
                it('should show more of the buffer above', function () {
                    buffer.fillViewportRows();
                    for (var i = 0; i < 10; i++) {
                        buffer.lines.push(buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
                    }
                    buffer.y = INIT_ROWS - 1;
                    buffer.ybase = 10;
                    buffer.ydisp = 10;
                    chai_1.assert.equal(buffer.lines.length, INIT_ROWS + 10);
                    buffer.resize(INIT_COLS, INIT_ROWS + 5);
                    chai_1.assert.equal(buffer.ydisp, 5);
                    chai_1.assert.equal(buffer.ybase, 5);
                    chai_1.assert.equal(buffer.lines.length, INIT_ROWS + 10);
                });
                it('should show more of the buffer below when the viewport is at the top of the buffer', function () {
                    buffer.fillViewportRows();
                    for (var i = 0; i < 10; i++) {
                        buffer.lines.push(buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
                    }
                    buffer.y = INIT_ROWS - 1;
                    buffer.ybase = 10;
                    buffer.ydisp = 0;
                    chai_1.assert.equal(buffer.lines.length, INIT_ROWS + 10);
                    buffer.resize(INIT_COLS, INIT_ROWS + 5);
                    chai_1.assert.equal(buffer.ydisp, 0);
                    chai_1.assert.equal(buffer.ybase, 5);
                    chai_1.assert.equal(buffer.lines.length, INIT_ROWS + 10);
                });
            });
        });
        describe('row and column increased', function () {
            it('should resize properly', function () {
                buffer.fillViewportRows();
                buffer.resize(INIT_COLS + 5, INIT_ROWS + 5);
                chai_1.assert.equal(buffer.lines.length, INIT_ROWS + 5);
                for (var i = 0; i < INIT_ROWS + 5; i++) {
                    chai_1.assert.equal(buffer.lines.get(i).length, INIT_COLS + 5);
                }
            });
        });
        describe('reflow', function () {
            it('should not wrap empty lines', function () {
                buffer.fillViewportRows();
                chai_1.assert.equal(buffer.lines.length, INIT_ROWS);
                buffer.resize(INIT_COLS - 5, INIT_ROWS);
                chai_1.assert.equal(buffer.lines.length, INIT_ROWS);
            });
            it('should shrink row length', function () {
                buffer.fillViewportRows();
                buffer.resize(5, 10);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).length, 5);
                chai_1.assert.equal(buffer.lines.get(1).length, 5);
                chai_1.assert.equal(buffer.lines.get(2).length, 5);
                chai_1.assert.equal(buffer.lines.get(3).length, 5);
                chai_1.assert.equal(buffer.lines.get(4).length, 5);
                chai_1.assert.equal(buffer.lines.get(5).length, 5);
                chai_1.assert.equal(buffer.lines.get(6).length, 5);
                chai_1.assert.equal(buffer.lines.get(7).length, 5);
                chai_1.assert.equal(buffer.lines.get(8).length, 5);
                chai_1.assert.equal(buffer.lines.get(9).length, 5);
            });
            it('should wrap and unwrap lines', function () {
                buffer.fillViewportRows();
                buffer.resize(5, 10);
                var firstLine = buffer.lines.get(0);
                for (var i = 0; i < 5; i++) {
                    var code = 'a'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    firstLine.set(i, [null, char, 1, code]);
                }
                buffer.y = 1;
                chai_1.assert.equal(buffer.lines.get(0).length, 5);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcde');
                buffer.resize(1, 10);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'a');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'b');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'c');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(), 'd');
                chai_1.assert.equal(buffer.lines.get(4).translateToString(), 'e');
                chai_1.assert.equal(buffer.lines.get(5).translateToString(), ' ');
                chai_1.assert.equal(buffer.lines.get(6).translateToString(), ' ');
                chai_1.assert.equal(buffer.lines.get(7).translateToString(), ' ');
                chai_1.assert.equal(buffer.lines.get(8).translateToString(), ' ');
                chai_1.assert.equal(buffer.lines.get(9).translateToString(), ' ');
                buffer.resize(5, 10);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcde');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '     ');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), '     ');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(), '     ');
                chai_1.assert.equal(buffer.lines.get(4).translateToString(), '     ');
                chai_1.assert.equal(buffer.lines.get(5).translateToString(), '     ');
                chai_1.assert.equal(buffer.lines.get(6).translateToString(), '     ');
                chai_1.assert.equal(buffer.lines.get(7).translateToString(), '     ');
                chai_1.assert.equal(buffer.lines.get(8).translateToString(), '     ');
                chai_1.assert.equal(buffer.lines.get(9).translateToString(), '     ');
            });
            it('should discard parts of wrapped lines that go out of the scrollback', function () {
                buffer.fillViewportRows();
                terminal.options.scrollback = 1;
                buffer.resize(10, 5);
                var lastLine = buffer.lines.get(3);
                for (var i = 0; i < 10; i++) {
                    var code = 'a'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    lastLine.set(i, [null, char, 1, code]);
                }
                chai_1.assert.equal(buffer.lines.length, 5);
                buffer.y = 4;
                buffer.resize(2, 5);
                chai_1.assert.equal(buffer.y, 4);
                chai_1.assert.equal(buffer.ybase, 1);
                chai_1.assert.equal(buffer.lines.length, 6);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'ab');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'cd');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'ef');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(), 'gh');
                chai_1.assert.equal(buffer.lines.get(4).translateToString(), 'ij');
                chai_1.assert.equal(buffer.lines.get(5).translateToString(), '  ');
                buffer.resize(1, 5);
                chai_1.assert.equal(buffer.y, 4);
                chai_1.assert.equal(buffer.ybase, 1);
                chai_1.assert.equal(buffer.lines.length, 6);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'f');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'g');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'h');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(), 'i');
                chai_1.assert.equal(buffer.lines.get(4).translateToString(), 'j');
                chai_1.assert.equal(buffer.lines.get(5).translateToString(), ' ');
                buffer.resize(10, 5);
                chai_1.assert.equal(buffer.y, 1);
                chai_1.assert.equal(buffer.ybase, 0);
                chai_1.assert.equal(buffer.lines.length, 5);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'fghij     ');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '          ');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), '          ');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(), '          ');
                chai_1.assert.equal(buffer.lines.get(4).translateToString(), '          ');
            });
            it('should remove the correct amount of rows when reflowing larger', function () {
                buffer.fillViewportRows();
                buffer.resize(10, 10);
                buffer.y = 2;
                var firstLine = buffer.lines.get(0);
                var secondLine = buffer.lines.get(1);
                for (var i = 0; i < 10; i++) {
                    var code = 'a'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    firstLine.set(i, [null, char, 1, code]);
                }
                for (var i = 0; i < 10; i++) {
                    var code = '0'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    secondLine.set(i, [null, char, 1, code]);
                }
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcdefghij');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '0123456789');
                for (var i = 2; i < 10; i++) {
                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '          ');
                }
                buffer.resize(2, 10);
                chai_1.assert.equal(buffer.ybase, 1);
                chai_1.assert.equal(buffer.lines.length, 11);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'ab');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'cd');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'ef');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(), 'gh');
                chai_1.assert.equal(buffer.lines.get(4).translateToString(), 'ij');
                chai_1.assert.equal(buffer.lines.get(5).translateToString(), '01');
                chai_1.assert.equal(buffer.lines.get(6).translateToString(), '23');
                chai_1.assert.equal(buffer.lines.get(7).translateToString(), '45');
                chai_1.assert.equal(buffer.lines.get(8).translateToString(), '67');
                chai_1.assert.equal(buffer.lines.get(9).translateToString(), '89');
                chai_1.assert.equal(buffer.lines.get(10).translateToString(), '  ');
                buffer.resize(10, 10);
                chai_1.assert.equal(buffer.ybase, 0);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcdefghij');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '0123456789');
                for (var i = 2; i < 10; i++) {
                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '          ');
                }
            });
            it('should transfer combined char data over to reflowed lines', function () {
                buffer.fillViewportRows();
                buffer.resize(4, 3);
                buffer.y = 2;
                var firstLine = buffer.lines.get(0);
                firstLine.set(0, [null, 'a', 1, 'a'.charCodeAt(0)]);
                firstLine.set(1, [null, 'b', 1, 'b'.charCodeAt(0)]);
                firstLine.set(2, [null, 'c', 1, 'c'.charCodeAt(0)]);
                firstLine.set(3, [null, '😁', 1, '😁'.charCodeAt(0)]);
                chai_1.assert.equal(buffer.lines.length, 3);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abc😁');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '    ');
                buffer.resize(2, 3);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'ab');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'c😁');
            });
            it('should adjust markers when reflowing', function () {
                buffer.fillViewportRows();
                buffer.resize(10, 16);
                for (var i = 0; i < 10; i++) {
                    var code = 'a'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    buffer.lines.get(0).set(i, [null, char, 1, code]);
                }
                for (var i = 0; i < 10; i++) {
                    var code = '0'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    buffer.lines.get(1).set(i, [null, char, 1, code]);
                }
                for (var i = 0; i < 10; i++) {
                    var code = 'k'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    buffer.lines.get(2).set(i, [null, char, 1, code]);
                }
                buffer.y = 3;
                var firstMarker = buffer.addMarker(0);
                var secondMarker = buffer.addMarker(1);
                var thirdMarker = buffer.addMarker(2);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcdefghij');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '0123456789');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'klmnopqrst');
                chai_1.assert.equal(firstMarker.line, 0);
                chai_1.assert.equal(secondMarker.line, 1);
                chai_1.assert.equal(thirdMarker.line, 2);
                buffer.resize(2, 16);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'ab');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'cd');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'ef');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(), 'gh');
                chai_1.assert.equal(buffer.lines.get(4).translateToString(), 'ij');
                chai_1.assert.equal(buffer.lines.get(5).translateToString(), '01');
                chai_1.assert.equal(buffer.lines.get(6).translateToString(), '23');
                chai_1.assert.equal(buffer.lines.get(7).translateToString(), '45');
                chai_1.assert.equal(buffer.lines.get(8).translateToString(), '67');
                chai_1.assert.equal(buffer.lines.get(9).translateToString(), '89');
                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'kl');
                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'mn');
                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'op');
                chai_1.assert.equal(buffer.lines.get(13).translateToString(), 'qr');
                chai_1.assert.equal(buffer.lines.get(14).translateToString(), 'st');
                chai_1.assert.equal(firstMarker.line, 0, 'first marker should remain unchanged');
                chai_1.assert.equal(secondMarker.line, 5, 'second marker should be shifted since the first line wrapped');
                chai_1.assert.equal(thirdMarker.line, 10, 'third marker should be shifted since the first and second lines wrapped');
                buffer.resize(10, 16);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcdefghij');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '0123456789');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'klmnopqrst');
                chai_1.assert.equal(firstMarker.line, 0, 'first marker should remain unchanged');
                chai_1.assert.equal(secondMarker.line, 1, 'second marker should be restored to it\'s original line');
                chai_1.assert.equal(thirdMarker.line, 2, 'third marker should be restored to it\'s original line');
                chai_1.assert.equal(firstMarker.isDisposed, false);
                chai_1.assert.equal(secondMarker.isDisposed, false);
                chai_1.assert.equal(thirdMarker.isDisposed, false);
            });
            it('should dispose markers whose rows are trimmed during a reflow', function () {
                buffer.fillViewportRows();
                terminal.options.scrollback = 1;
                buffer.resize(10, 11);
                for (var i = 0; i < 10; i++) {
                    var code = 'a'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    buffer.lines.get(0).set(i, [null, char, 1, code]);
                }
                for (var i = 0; i < 10; i++) {
                    var code = '0'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    buffer.lines.get(1).set(i, [null, char, 1, code]);
                }
                for (var i = 0; i < 10; i++) {
                    var code = 'k'.charCodeAt(0) + i;
                    var char = String.fromCharCode(code);
                    buffer.lines.get(2).set(i, [null, char, 1, code]);
                }
                buffer.y = 10;
                var firstMarker = buffer.addMarker(0);
                var secondMarker = buffer.addMarker(1);
                var thirdMarker = buffer.addMarker(2);
                buffer.y = 3;
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcdefghij');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '0123456789');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'klmnopqrst');
                chai_1.assert.equal(firstMarker.line, 0);
                chai_1.assert.equal(secondMarker.line, 1);
                chai_1.assert.equal(thirdMarker.line, 2);
                buffer.resize(2, 11);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'ij');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '01');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), '23');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(), '45');
                chai_1.assert.equal(buffer.lines.get(4).translateToString(), '67');
                chai_1.assert.equal(buffer.lines.get(5).translateToString(), '89');
                chai_1.assert.equal(buffer.lines.get(6).translateToString(), 'kl');
                chai_1.assert.equal(buffer.lines.get(7).translateToString(), 'mn');
                chai_1.assert.equal(buffer.lines.get(8).translateToString(), 'op');
                chai_1.assert.equal(buffer.lines.get(9).translateToString(), 'qr');
                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'st');
                chai_1.assert.equal(secondMarker.line, 1, 'second marker should remain the same as it was shifted 4 and trimmed 4');
                chai_1.assert.equal(thirdMarker.line, 6, 'third marker should be shifted since the first and second lines wrapped');
                chai_1.assert.equal(firstMarker.isDisposed, true, 'first marker was trimmed');
                chai_1.assert.equal(secondMarker.isDisposed, false);
                chai_1.assert.equal(thirdMarker.isDisposed, false);
                buffer.resize(10, 11);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'ij        ');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(), '0123456789');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'klmnopqrst');
                chai_1.assert.equal(secondMarker.line, 1, 'second marker should be restored');
                chai_1.assert.equal(thirdMarker.line, 2, 'third marker should be restored');
            });
            it('should correctly reflow wrapped lines that end in null space (via tab char)', function () {
                buffer.fillViewportRows();
                buffer.resize(4, 10);
                buffer.y = 2;
                buffer.lines.get(0).set(0, [null, 'a', 1, 'a'.charCodeAt(0)]);
                buffer.lines.get(0).set(1, [null, 'b', 1, 'b'.charCodeAt(0)]);
                buffer.lines.get(1).set(0, [null, 'c', 1, 'c'.charCodeAt(0)]);
                buffer.lines.get(1).set(1, [null, 'd', 1, 'd'.charCodeAt(0)]);
                buffer.lines.get(1).isWrapped = true;
                buffer.resize(5, 10);
                chai_1.assert.equal(buffer.ybase, 0);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), 'ab  c');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(false), 'd    ');
                buffer.resize(6, 10);
                chai_1.assert.equal(buffer.ybase, 0);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), 'ab  cd');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(false), '      ');
            });
            it('should wrap wide characters correctly when reflowing larger', function () {
                buffer.fillViewportRows();
                buffer.resize(12, 10);
                buffer.y = 2;
                for (var i = 0; i < 12; i += 4) {
                    buffer.lines.get(0).set(i, [null, '汉', 2, '汉'.charCodeAt(0)]);
                    buffer.lines.get(1).set(i, [null, '汉', 2, '汉'.charCodeAt(0)]);
                }
                for (var i = 2; i < 12; i += 4) {
                    buffer.lines.get(0).set(i, [null, '语', 2, '语'.charCodeAt(0)]);
                    buffer.lines.get(1).set(i, [null, '语', 2, '语'.charCodeAt(0)]);
                }
                for (var i = 1; i < 12; i += 2) {
                    buffer.lines.get(0).set(i, [null, '', 0, undefined]);
                    buffer.lines.get(1).set(i, [null, '', 0, undefined]);
                }
                buffer.lines.get(1).isWrapped = true;
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉语汉语');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '汉语汉语汉语');
                buffer.resize(13, 10);
                chai_1.assert.equal(buffer.ybase, 0);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉语汉语');
                chai_1.assert.equal(buffer.lines.get(0).translateToString(false), '汉语汉语汉语 ');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '汉语汉语汉语');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(false), '汉语汉语汉语 ');
                buffer.resize(14, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉语汉语汉');
                chai_1.assert.equal(buffer.lines.get(0).translateToString(false), '汉语汉语汉语汉');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '语汉语汉语');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(false), '语汉语汉语    ');
            });
            it('should correctly reflow wrapped lines that end in null space (via tab char)', function () {
                buffer.fillViewportRows();
                buffer.resize(4, 10);
                buffer.y = 2;
                buffer.lines.get(0).set(0, [null, 'a', 1, 'a'.charCodeAt(0)]);
                buffer.lines.get(0).set(1, [null, 'b', 1, 'b'.charCodeAt(0)]);
                buffer.lines.get(1).set(0, [null, 'c', 1, 'c'.charCodeAt(0)]);
                buffer.lines.get(1).set(1, [null, 'd', 1, 'd'.charCodeAt(0)]);
                buffer.lines.get(1).isWrapped = true;
                buffer.resize(3, 10);
                chai_1.assert.equal(buffer.y, 2);
                chai_1.assert.equal(buffer.ybase, 0);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(false), 'ab ');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(false), ' cd');
                buffer.resize(2, 10);
                chai_1.assert.equal(buffer.y, 3);
                chai_1.assert.equal(buffer.ybase, 0);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(false), 'ab');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(false), '  ');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(false), 'cd');
            });
            it('should wrap wide characters correctly when reflowing smaller', function () {
                buffer.fillViewportRows();
                buffer.resize(12, 10);
                buffer.y = 2;
                for (var i = 0; i < 12; i += 4) {
                    buffer.lines.get(0).set(i, [null, '汉', 2, '汉'.charCodeAt(0)]);
                    buffer.lines.get(1).set(i, [null, '汉', 2, '汉'.charCodeAt(0)]);
                }
                for (var i = 2; i < 12; i += 4) {
                    buffer.lines.get(0).set(i, [null, '语', 2, '语'.charCodeAt(0)]);
                    buffer.lines.get(1).set(i, [null, '语', 2, '语'.charCodeAt(0)]);
                }
                for (var i = 1; i < 12; i += 2) {
                    buffer.lines.get(0).set(i, [null, '', 0, undefined]);
                    buffer.lines.get(1).set(i, [null, '', 0, undefined]);
                }
                buffer.lines.get(1).isWrapped = true;
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉语汉语');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '汉语汉语汉语');
                buffer.resize(11, 10);
                chai_1.assert.equal(buffer.ybase, 0);
                chai_1.assert.equal(buffer.lines.length, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉语汉');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '语汉语汉语');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(true), '汉语');
                buffer.resize(10, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉语汉');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '语汉语汉语');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(true), '汉语');
                buffer.resize(9, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉语');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '汉语汉语');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(true), '汉语汉语');
                buffer.resize(8, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉语');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '汉语汉语');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(true), '汉语汉语');
                buffer.resize(7, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '语汉语');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(true), '汉语汉');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(true), '语汉语');
                buffer.resize(6, 10);
                chai_1.assert.equal(buffer.lines.get(0).translateToString(true), '汉语汉');
                chai_1.assert.equal(buffer.lines.get(1).translateToString(true), '语汉语');
                chai_1.assert.equal(buffer.lines.get(2).translateToString(true), '汉语汉');
                chai_1.assert.equal(buffer.lines.get(3).translateToString(true), '语汉语');
            });
            describe('reflowLarger cases', function () {
                beforeEach(function () {
                    buffer.fillViewportRows();
                    buffer.resize(2, 10);
                    buffer.lines.get(0).set(0, [null, 'a', 1, 'a'.charCodeAt(0)]);
                    buffer.lines.get(0).set(1, [null, 'b', 1, 'b'.charCodeAt(0)]);
                    buffer.lines.get(1).set(0, [null, 'c', 1, 'c'.charCodeAt(0)]);
                    buffer.lines.get(1).set(1, [null, 'd', 1, 'd'.charCodeAt(0)]);
                    buffer.lines.get(1).isWrapped = true;
                    buffer.lines.get(2).set(0, [null, 'e', 1, 'e'.charCodeAt(0)]);
                    buffer.lines.get(2).set(1, [null, 'f', 1, 'f'.charCodeAt(0)]);
                    buffer.lines.get(3).set(0, [null, 'g', 1, 'g'.charCodeAt(0)]);
                    buffer.lines.get(3).set(1, [null, 'h', 1, 'h'.charCodeAt(0)]);
                    buffer.lines.get(3).isWrapped = true;
                    buffer.lines.get(4).set(0, [null, 'i', 1, 'i'.charCodeAt(0)]);
                    buffer.lines.get(4).set(1, [null, 'j', 1, 'j'.charCodeAt(0)]);
                    buffer.lines.get(5).set(0, [null, 'k', 1, 'k'.charCodeAt(0)]);
                    buffer.lines.get(5).set(1, [null, 'l', 1, 'l'.charCodeAt(0)]);
                    buffer.lines.get(5).isWrapped = true;
                });
                describe('viewport not yet filled', function () {
                    it('should move the cursor up and add empty lines', function () {
                        buffer.y = 6;
                        buffer.resize(4, 10);
                        chai_1.assert.equal(buffer.y, 3);
                        chai_1.assert.equal(buffer.ydisp, 0);
                        chai_1.assert.equal(buffer.ybase, 0);
                        chai_1.assert.equal(buffer.lines.length, 10);
                        chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcd');
                        chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'efgh');
                        chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'ijkl');
                        for (var i = 3; i < 10; i++) {
                            chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                        }
                        var wrappedLines = [];
                        for (var i = 0; i < buffer.lines.length; i++) {
                            chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                        }
                    });
                });
                describe('viewport filled, scrollback remaining', function () {
                    beforeEach(function () {
                        buffer.y = 9;
                    });
                    describe('ybase === 0', function () {
                        it('should move the cursor up and add empty lines', function () {
                            buffer.resize(4, 10);
                            chai_1.assert.equal(buffer.y, 6);
                            chai_1.assert.equal(buffer.ydisp, 0);
                            chai_1.assert.equal(buffer.ybase, 0);
                            chai_1.assert.equal(buffer.lines.length, 10);
                            chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'abcd');
                            chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'efgh');
                            chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'ijkl');
                            for (var i = 3; i < 10; i++) {
                                chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                            }
                            var wrappedLines = [];
                            for (var i = 0; i < buffer.lines.length; i++) {
                                chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                            }
                        });
                    });
                    describe('ybase !== 0', function () {
                        beforeEach(function () {
                            for (var i = 0; i < 10; i++) {
                                buffer.lines.splice(0, 0, buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
                            }
                            buffer.ybase = 10;
                        });
                        describe('&& ydisp === ybase', function () {
                            it('should adjust the viewport and keep ydisp = ybase', function () {
                                buffer.ydisp = 10;
                                buffer.resize(4, 10);
                                chai_1.assert.equal(buffer.y, 9);
                                chai_1.assert.equal(buffer.ydisp, 7);
                                chai_1.assert.equal(buffer.ybase, 7);
                                chai_1.assert.equal(buffer.lines.length, 17);
                                for (var i = 0; i < 10; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                                }
                                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'abcd');
                                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'efgh');
                                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'ijkl');
                                for (var i = 13; i < 17; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                                }
                                var wrappedLines = [];
                                for (var i = 0; i < buffer.lines.length; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                                }
                            });
                        });
                        describe('&& ydisp !== ybase', function () {
                            it('should keep ydisp at the same value', function () {
                                buffer.ydisp = 5;
                                buffer.resize(4, 10);
                                chai_1.assert.equal(buffer.y, 9);
                                chai_1.assert.equal(buffer.ydisp, 5);
                                chai_1.assert.equal(buffer.ybase, 7);
                                chai_1.assert.equal(buffer.lines.length, 17);
                                for (var i = 0; i < 10; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                                }
                                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'abcd');
                                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'efgh');
                                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'ijkl');
                                for (var i = 13; i < 17; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                                }
                                var wrappedLines = [];
                                for (var i = 0; i < buffer.lines.length; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                                }
                            });
                        });
                    });
                });
                describe('viewport filled, no scrollback remaining', function () {
                    describe('ybase !== 0', function () {
                        beforeEach(function () {
                            terminal.options.scrollback = 10;
                            for (var i = 0; i < 10; i++) {
                                buffer.lines.splice(0, 0, buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
                            }
                            buffer.y = 9;
                            buffer.ybase = 10;
                        });
                        describe('&& ydisp === ybase', function () {
                            it('should trim lines and keep ydisp = ybase', function () {
                                buffer.ydisp = 10;
                                buffer.resize(4, 10);
                                chai_1.assert.equal(buffer.y, 9);
                                chai_1.assert.equal(buffer.ydisp, 7);
                                chai_1.assert.equal(buffer.ybase, 7);
                                chai_1.assert.equal(buffer.lines.length, 17);
                                for (var i = 0; i < 10; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                                }
                                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'abcd');
                                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'efgh');
                                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'ijkl');
                                for (var i = 13; i < 17; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                                }
                                var wrappedLines = [];
                                for (var i = 0; i < buffer.lines.length; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                                }
                            });
                        });
                        describe('&& ydisp !== ybase', function () {
                            it('should trim lines and not change ydisp', function () {
                                buffer.ydisp = 5;
                                buffer.resize(4, 10);
                                chai_1.assert.equal(buffer.y, 9);
                                chai_1.assert.equal(buffer.ydisp, 5);
                                chai_1.assert.equal(buffer.ybase, 7);
                                chai_1.assert.equal(buffer.lines.length, 17);
                                for (var i = 0; i < 10; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                                }
                                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'abcd');
                                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'efgh');
                                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'ijkl');
                                for (var i = 13; i < 17; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '    ');
                                }
                                var wrappedLines = [];
                                for (var i = 0; i < buffer.lines.length; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                                }
                            });
                        });
                    });
                });
            });
            describe('reflowSmaller cases', function () {
                beforeEach(function () {
                    buffer.fillViewportRows();
                    buffer.resize(4, 10);
                    buffer.lines.get(0).set(0, [null, 'a', 1, 'a'.charCodeAt(0)]);
                    buffer.lines.get(0).set(1, [null, 'b', 1, 'b'.charCodeAt(0)]);
                    buffer.lines.get(0).set(2, [null, 'c', 1, 'c'.charCodeAt(0)]);
                    buffer.lines.get(0).set(3, [null, 'd', 1, 'd'.charCodeAt(0)]);
                    buffer.lines.get(1).set(0, [null, 'e', 1, 'e'.charCodeAt(0)]);
                    buffer.lines.get(1).set(1, [null, 'f', 1, 'f'.charCodeAt(0)]);
                    buffer.lines.get(1).set(2, [null, 'g', 1, 'g'.charCodeAt(0)]);
                    buffer.lines.get(1).set(3, [null, 'h', 1, 'h'.charCodeAt(0)]);
                    buffer.lines.get(2).set(0, [null, 'i', 1, 'i'.charCodeAt(0)]);
                    buffer.lines.get(2).set(1, [null, 'j', 1, 'j'.charCodeAt(0)]);
                    buffer.lines.get(2).set(2, [null, 'k', 1, 'k'.charCodeAt(0)]);
                    buffer.lines.get(2).set(3, [null, 'l', 1, 'l'.charCodeAt(0)]);
                });
                describe('viewport not yet filled', function () {
                    it('should move the cursor down', function () {
                        buffer.y = 3;
                        buffer.resize(2, 10);
                        chai_1.assert.equal(buffer.y, 6);
                        chai_1.assert.equal(buffer.ydisp, 0);
                        chai_1.assert.equal(buffer.ybase, 0);
                        chai_1.assert.equal(buffer.lines.length, 10);
                        chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'ab');
                        chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'cd');
                        chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'ef');
                        chai_1.assert.equal(buffer.lines.get(3).translateToString(), 'gh');
                        chai_1.assert.equal(buffer.lines.get(4).translateToString(), 'ij');
                        chai_1.assert.equal(buffer.lines.get(5).translateToString(), 'kl');
                        for (var i = 6; i < 10; i++) {
                            chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                        }
                        var wrappedLines = [1, 3, 5];
                        for (var i = 0; i < buffer.lines.length; i++) {
                            chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                        }
                    });
                });
                describe('viewport filled, scrollback remaining', function () {
                    beforeEach(function () {
                        buffer.y = 9;
                    });
                    describe('ybase === 0', function () {
                        it('should trim the top', function () {
                            buffer.resize(2, 10);
                            chai_1.assert.equal(buffer.y, 9);
                            chai_1.assert.equal(buffer.ydisp, 3);
                            chai_1.assert.equal(buffer.ybase, 3);
                            chai_1.assert.equal(buffer.lines.length, 13);
                            chai_1.assert.equal(buffer.lines.get(0).translateToString(), 'ab');
                            chai_1.assert.equal(buffer.lines.get(1).translateToString(), 'cd');
                            chai_1.assert.equal(buffer.lines.get(2).translateToString(), 'ef');
                            chai_1.assert.equal(buffer.lines.get(3).translateToString(), 'gh');
                            chai_1.assert.equal(buffer.lines.get(4).translateToString(), 'ij');
                            chai_1.assert.equal(buffer.lines.get(5).translateToString(), 'kl');
                            for (var i = 6; i < 13; i++) {
                                chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                            }
                            var wrappedLines = [1, 3, 5];
                            for (var i = 0; i < buffer.lines.length; i++) {
                                chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                            }
                        });
                    });
                    describe('ybase !== 0', function () {
                        beforeEach(function () {
                            for (var i = 0; i < 10; i++) {
                                buffer.lines.splice(0, 0, buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
                            }
                            buffer.ybase = 10;
                        });
                        describe('&& ydisp === ybase', function () {
                            it('should adjust the viewport and keep ydisp = ybase', function () {
                                buffer.ydisp = 10;
                                buffer.resize(2, 10);
                                chai_1.assert.equal(buffer.ydisp, 13);
                                chai_1.assert.equal(buffer.ybase, 13);
                                chai_1.assert.equal(buffer.lines.length, 23);
                                for (var i = 0; i < 10; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                                }
                                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'ab');
                                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'cd');
                                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'ef');
                                chai_1.assert.equal(buffer.lines.get(13).translateToString(), 'gh');
                                chai_1.assert.equal(buffer.lines.get(14).translateToString(), 'ij');
                                chai_1.assert.equal(buffer.lines.get(15).translateToString(), 'kl');
                                for (var i = 16; i < 23; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                                }
                                var wrappedLines = [11, 13, 15];
                                for (var i = 0; i < buffer.lines.length; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                                }
                            });
                        });
                        describe('&& ydisp !== ybase', function () {
                            it('should keep ydisp at the same value', function () {
                                buffer.ydisp = 5;
                                buffer.resize(2, 10);
                                chai_1.assert.equal(buffer.ydisp, 5);
                                chai_1.assert.equal(buffer.ybase, 13);
                                chai_1.assert.equal(buffer.lines.length, 23);
                                for (var i = 0; i < 10; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                                }
                                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'ab');
                                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'cd');
                                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'ef');
                                chai_1.assert.equal(buffer.lines.get(13).translateToString(), 'gh');
                                chai_1.assert.equal(buffer.lines.get(14).translateToString(), 'ij');
                                chai_1.assert.equal(buffer.lines.get(15).translateToString(), 'kl');
                                for (var i = 16; i < 23; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                                }
                                var wrappedLines = [11, 13, 15];
                                for (var i = 0; i < buffer.lines.length; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                                }
                            });
                        });
                    });
                });
                describe('viewport filled, no scrollback remaining', function () {
                    describe('ybase !== 0', function () {
                        beforeEach(function () {
                            terminal.options.scrollback = 10;
                            for (var i = 0; i < 10; i++) {
                                buffer.lines.splice(0, 0, buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
                            }
                            buffer.ybase = 10;
                        });
                        describe('&& ydisp === ybase', function () {
                            it('should trim lines and keep ydisp = ybase', function () {
                                buffer.ydisp = 10;
                                buffer.y = 13;
                                buffer.resize(2, 10);
                                chai_1.assert.equal(buffer.ydisp, 10);
                                chai_1.assert.equal(buffer.ybase, 10);
                                chai_1.assert.equal(buffer.lines.length, 20);
                                for (var i = 0; i < 7; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                                }
                                chai_1.assert.equal(buffer.lines.get(7).translateToString(), 'ab');
                                chai_1.assert.equal(buffer.lines.get(8).translateToString(), 'cd');
                                chai_1.assert.equal(buffer.lines.get(9).translateToString(), 'ef');
                                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'gh');
                                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'ij');
                                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'kl');
                                for (var i = 13; i < 20; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                                }
                                var wrappedLines = [8, 10, 12];
                                for (var i = 0; i < buffer.lines.length; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                                }
                            });
                        });
                        describe('&& ydisp !== ybase', function () {
                            it('should trim lines and not change ydisp', function () {
                                buffer.ydisp = 5;
                                buffer.y = 13;
                                buffer.resize(2, 10);
                                chai_1.assert.equal(buffer.ydisp, 5);
                                chai_1.assert.equal(buffer.ybase, 10);
                                chai_1.assert.equal(buffer.lines.length, 20);
                                for (var i = 0; i < 7; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                                }
                                chai_1.assert.equal(buffer.lines.get(7).translateToString(), 'ab');
                                chai_1.assert.equal(buffer.lines.get(8).translateToString(), 'cd');
                                chai_1.assert.equal(buffer.lines.get(9).translateToString(), 'ef');
                                chai_1.assert.equal(buffer.lines.get(10).translateToString(), 'gh');
                                chai_1.assert.equal(buffer.lines.get(11).translateToString(), 'ij');
                                chai_1.assert.equal(buffer.lines.get(12).translateToString(), 'kl');
                                for (var i = 13; i < 20; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).translateToString(), '  ');
                                }
                                var wrappedLines = [8, 10, 12];
                                for (var i = 0; i < buffer.lines.length; i++) {
                                    chai_1.assert.equal(buffer.lines.get(i).isWrapped, wrappedLines.indexOf(i) !== -1, "line " + i + " isWrapped must equal " + (wrappedLines.indexOf(i) !== -1));
                                }
                            });
                        });
                    });
                });
            });
        });
    });
    describe('buffer marked to have no scrollback', function () {
        it('should always have a scrollback of 0', function () {
            chai_1.assert.equal(terminal.options.scrollback, 1000);
            buffer = new Buffer_1.Buffer(terminal, false);
            buffer.fillViewportRows();
            chai_1.assert.equal(buffer.lines.maxLength, INIT_ROWS);
            buffer.resize(INIT_COLS, INIT_ROWS * 2);
            chai_1.assert.equal(buffer.lines.maxLength, INIT_ROWS * 2);
            buffer.resize(INIT_COLS, INIT_ROWS / 2);
            chai_1.assert.equal(buffer.lines.maxLength, INIT_ROWS / 2);
        });
    });
    describe('addMarker', function () {
        it('should adjust a marker line when the buffer is trimmed', function () {
            terminal.options.scrollback = 0;
            buffer = new Buffer_1.Buffer(terminal, true);
            buffer.fillViewportRows();
            var marker = buffer.addMarker(buffer.lines.length - 1);
            chai_1.assert.equal(marker.line, buffer.lines.length - 1);
            buffer.lines.onTrimEmitter.fire(1);
            chai_1.assert.equal(marker.line, buffer.lines.length - 2);
        });
        it('should dispose of a marker if it is trimmed off the buffer', function () {
            terminal.options.scrollback = 0;
            buffer = new Buffer_1.Buffer(terminal, true);
            buffer.fillViewportRows();
            chai_1.assert.equal(buffer.markers.length, 0);
            var marker = buffer.addMarker(0);
            chai_1.assert.equal(marker.isDisposed, false);
            chai_1.assert.equal(buffer.markers.length, 1);
            buffer.lines.onTrimEmitter.fire(1);
            chai_1.assert.equal(marker.isDisposed, true);
            chai_1.assert.equal(buffer.markers.length, 0);
        });
    });
    describe('translateBufferLineToString', function () {
        it('should handle selecting a section of ascii text', function () {
            var line = new BufferLine_1.BufferLine(4);
            line.setCell(0, BufferLine_1.CellData.fromCharData([null, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(1, BufferLine_1.CellData.fromCharData([null, 'b', 1, 'b'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([null, 'c', 1, 'c'.charCodeAt(0)]));
            line.setCell(3, BufferLine_1.CellData.fromCharData([null, 'd', 1, 'd'.charCodeAt(0)]));
            buffer.lines.set(0, line);
            var str = buffer.translateBufferLineToString(0, true, 0, 2);
            chai_1.assert.equal(str, 'ab');
        });
        it('should handle a cut-off double width character by including it', function () {
            var line = new BufferLine_1.BufferLine(3);
            line.setCell(0, BufferLine_1.CellData.fromCharData([null, '語', 2, 35486]));
            line.setCell(1, BufferLine_1.CellData.fromCharData([null, '', 0, null]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([null, 'a', 1, 'a'.charCodeAt(0)]));
            buffer.lines.set(0, line);
            var str1 = buffer.translateBufferLineToString(0, true, 0, 1);
            chai_1.assert.equal(str1, '語');
        });
        it('should handle a zero width character in the middle of the string by not including it', function () {
            var line = new BufferLine_1.BufferLine(3);
            line.setCell(0, BufferLine_1.CellData.fromCharData([null, '語', 2, '語'.charCodeAt(0)]));
            line.setCell(1, BufferLine_1.CellData.fromCharData([null, '', 0, null]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([null, 'a', 1, 'a'.charCodeAt(0)]));
            buffer.lines.set(0, line);
            var str0 = buffer.translateBufferLineToString(0, true, 0, 1);
            chai_1.assert.equal(str0, '語');
            var str1 = buffer.translateBufferLineToString(0, true, 0, 2);
            chai_1.assert.equal(str1, '語');
            var str2 = buffer.translateBufferLineToString(0, true, 0, 3);
            chai_1.assert.equal(str2, '語a');
        });
        it('should handle single width emojis', function () {
            var line = new BufferLine_1.BufferLine(2);
            line.setCell(0, BufferLine_1.CellData.fromCharData([null, '😁', 1, '😁'.charCodeAt(0)]));
            line.setCell(1, BufferLine_1.CellData.fromCharData([null, 'a', 1, 'a'.charCodeAt(0)]));
            buffer.lines.set(0, line);
            var str1 = buffer.translateBufferLineToString(0, true, 0, 1);
            chai_1.assert.equal(str1, '😁');
            var str2 = buffer.translateBufferLineToString(0, true, 0, 2);
            chai_1.assert.equal(str2, '😁a');
        });
        it('should handle double width emojis', function () {
            var line = new BufferLine_1.BufferLine(2);
            line.setCell(0, BufferLine_1.CellData.fromCharData([null, '😁', 2, '😁'.charCodeAt(0)]));
            line.setCell(1, BufferLine_1.CellData.fromCharData([null, '', 0, null]));
            buffer.lines.set(0, line);
            var str1 = buffer.translateBufferLineToString(0, true, 0, 1);
            chai_1.assert.equal(str1, '😁');
            var str2 = buffer.translateBufferLineToString(0, true, 0, 2);
            chai_1.assert.equal(str2, '😁');
            var line2 = new BufferLine_1.BufferLine(3);
            line2.setCell(0, BufferLine_1.CellData.fromCharData([null, '😁', 2, '😁'.charCodeAt(0)]));
            line2.setCell(1, BufferLine_1.CellData.fromCharData([null, '', 0, null]));
            line2.setCell(2, BufferLine_1.CellData.fromCharData([null, 'a', 1, 'a'.charCodeAt(0)]));
            buffer.lines.set(0, line2);
            var str3 = buffer.translateBufferLineToString(0, true, 0, 3);
            chai_1.assert.equal(str3, '😁a');
        });
    });
    describe('stringIndexToBufferIndex', function () {
        var terminal;
        beforeEach(function () {
            terminal = new TestUtils_test_1.TestTerminal({ rows: 5, cols: 10, scrollback: 5 });
        });
        it('multiline ascii', function () {
            var input = 'This is ASCII text spanning multiple lines.';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([(i / terminal.cols) | 0, i % terminal.cols], bufferIndex);
            }
        });
        it('combining e\u0301 in a sentence', function () {
            var input = 'Sitting in the cafe\u0301 drinking coffee.';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < 19; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([(i / terminal.cols) | 0, i % terminal.cols], bufferIndex);
            }
            chai_1.assert.deepEqual(terminal.buffer.stringIndexToBufferIndex(0, 18), terminal.buffer.stringIndexToBufferIndex(0, 19));
            for (var i = 19; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([((i - 1) / terminal.cols) | 0, (i - 1) % terminal.cols], bufferIndex);
            }
        });
        it('multiline combining e\u0301', function () {
            var input = 'e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([((i >> 1) / terminal.cols) | 0, (i >> 1) % terminal.cols], bufferIndex);
            }
        });
        it('surrogate char in a sentence', function () {
            var input = 'The 𝄞 is a clef widely used in modern notation.';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < 5; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([(i / terminal.cols) | 0, i % terminal.cols], bufferIndex);
            }
            chai_1.assert.deepEqual(terminal.buffer.stringIndexToBufferIndex(0, 4), terminal.buffer.stringIndexToBufferIndex(0, 5));
            for (var i = 5; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([((i - 1) / terminal.cols) | 0, (i - 1) % terminal.cols], bufferIndex);
            }
        });
        it('multiline surrogate char', function () {
            var input = '𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([((i >> 1) / terminal.cols) | 0, (i >> 1) % terminal.cols], bufferIndex);
            }
        });
        it('surrogate char with combining', function () {
            var input = '𓂀\u0301 - the eye hiroglyph with an acute accent.';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            chai_1.assert.deepEqual([0, 0], terminal.buffer.stringIndexToBufferIndex(0, 1));
            chai_1.assert.deepEqual([0, 0], terminal.buffer.stringIndexToBufferIndex(0, 2));
            for (var i = 2; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([((i - 2) / terminal.cols) | 0, (i - 2) % terminal.cols], bufferIndex);
            }
        });
        it('multiline surrogate with combining', function () {
            var input = '𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301𓂀\u0301';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([(((i / 3) | 0) / terminal.cols) | 0, ((i / 3) | 0) % terminal.cols], bufferIndex);
            }
        });
        it('fullwidth chars', function () {
            var input = 'These １２３ are some fat numbers.';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < 6; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([(i / terminal.cols) | 0, i % terminal.cols], bufferIndex);
            }
            chai_1.assert.deepEqual([0, 8], terminal.buffer.stringIndexToBufferIndex(0, 7));
            chai_1.assert.deepEqual([1, 0], terminal.buffer.stringIndexToBufferIndex(0, 8));
            for (var i = 9; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([((i + 3) / terminal.cols) | 0, (i + 3) % terminal.cols], bufferIndex);
            }
        });
        it('multiline fullwidth chars', function () {
            var input = '１２３４５６７８９０１２３４５６７８９０';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 9; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i);
                chai_1.assert.deepEqual([((i << 1) / terminal.cols) | 0, (i << 1) % terminal.cols], bufferIndex);
            }
        });
        it('fullwidth combining with emoji - match emoji cell', function () {
            var input = 'Lots of ￥\u0301 make me 😃.';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            var stringIndex = s.match(/😃/).index;
            var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, stringIndex);
            chai_1.assert(terminal.buffer.lines.get(bufferIndex[0]).loadCell(bufferIndex[1], new BufferLine_1.CellData()).getChars(), '😃');
        });
        it('multiline fullwidth chars with offset 1 (currently tests for broken behavior)', function () {
            var input = 'a１２３４５６７８９０１２３４５６７８９０';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 10; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i, true);
                var j = (i - 0) << 1;
                chai_1.assert.deepEqual([(j / terminal.cols) | 0, j % terminal.cols], bufferIndex);
            }
        });
        it('test fully wrapped buffer up to last char', function () {
            var input = Array(6).join('1234567890');
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i, true);
                chai_1.assert.equal(input[i], terminal.buffer.lines.get(bufferIndex[0]).loadCell(bufferIndex[1], new BufferLine_1.CellData()).getChars());
            }
        });
        it('test fully wrapped buffer up to last char with full width odd', function () {
            var input = 'a￥\u0301a￥\u0301a￥\u0301a￥\u0301a￥\u0301a￥\u0301a￥\u0301a￥\u0301'
                + 'a￥\u0301a￥\u0301a￥\u0301a￥\u0301a￥\u0301a￥\u0301a￥\u0301';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(input, s);
            for (var i = 0; i < input.length; ++i) {
                var bufferIndex = terminal.buffer.stringIndexToBufferIndex(0, i, true);
                chai_1.assert.equal((!(i % 3))
                    ? input[i]
                    : (i % 3 === 1)
                        ? input.substr(i, 2)
                        : input.substr(i - 1, 2), terminal.buffer.lines.get(bufferIndex[0]).loadCell(bufferIndex[1], new BufferLine_1.CellData()).getChars());
            }
        });
        it('should handle \t in lines correctly', function () {
            var input = '\thttps://google.de';
            terminal.writeSync(input);
            var s = terminal.buffer.iterator(true).next().content;
            chai_1.assert.equal(s, Array(terminal.getOption('tabStopWidth') + 1).join(' ') + 'https://google.de');
        });
    });
    describe('BufferStringIterator', function () {
        it('iterator does not overflow buffer limits', function () {
            var terminal = new TestUtils_test_1.TestTerminal({ rows: 5, cols: 10, scrollback: 5 });
            var data = [
                'aaaaaaaaaa',
                'aaaaaaaaa\n',
                'aaaaaaaaaa',
                'aaaaaaaaa\n',
                'aaaaaaaaaa',
                'aaaaaaaaaa',
                'aaaaaaaaaa',
                'aaaaaaaaa\n',
                'aaaaaaaaaa',
                'aaaaaaaaaa'
            ];
            terminal.writeSync(data.join(''));
            chai_1.expect(function () {
                for (var overscan = 0; overscan < 20; ++overscan) {
                    for (var start = -10; start < 20; ++start) {
                        for (var end = -10; end < 20; ++end) {
                            var it_1 = terminal.buffer.iterator(false, start, end, overscan, overscan);
                            while (it_1.hasNext()) {
                                it_1.next();
                            }
                        }
                    }
                }
            }).to.not.throw();
        });
    });
});
//# sourceMappingURL=Buffer.test.js.map