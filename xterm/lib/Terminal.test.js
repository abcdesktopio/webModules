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
var Terminal_1 = require("./Terminal");
var TestUtils_test_1 = require("./TestUtils.test");
var Buffer_1 = require("./Buffer");
var BufferLine_1 = require("./BufferLine");
var INIT_COLS = 80;
var INIT_ROWS = 24;
var TestTerminal = (function (_super) {
    __extends(TestTerminal, _super);
    function TestTerminal() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestTerminal.prototype.keyDown = function (ev) { return this._keyDown(ev); };
    TestTerminal.prototype.keyPress = function (ev) { return this._keyPress(ev); };
    return TestTerminal;
}(Terminal_1.Terminal));
describe('xterm.js', function () {
    var term;
    var termOptions = {
        cols: INIT_COLS,
        rows: INIT_ROWS
    };
    beforeEach(function () {
        term = new TestTerminal(termOptions);
        term.refresh = function () { };
        term.renderer = new TestUtils_test_1.MockRenderer();
        term.viewport = new TestUtils_test_1.MockViewport();
        term._compositionHelper = new TestUtils_test_1.MockCompositionHelper();
        term.write = function (data) {
            term.writeBuffer.push(data);
            term._innerWrite();
        };
        term.element = {
            classList: {
                toggle: function () { },
                remove: function () { }
            }
        };
    });
    it('should not mutate the options parameter', function () {
        term.setOption('cols', 1000);
        chai_1.assert.deepEqual(termOptions, {
            cols: INIT_COLS,
            rows: INIT_ROWS
        });
    });
    describe('getOption', function () {
        it('should retrieve the option correctly', function () {
            term.options.cursorBlink = true;
            chai_1.assert.equal(term.getOption('cursorBlink'), true);
            delete term.options.cursorBlink;
            term.options.cursorBlink = false;
            chai_1.assert.equal(term.getOption('cursorBlink'), false);
        });
        it('should throw when retrieving a non-existant option', function () {
            chai_1.assert.throws(term.getOption.bind(term, 'fake', true));
        });
    });
    describe('events', function () {
        it('should fire the onData evnet', function (done) {
            term.onData(function () { return done(); });
            term.handler('fake');
        });
        it('should fire the onCursorMove event', function (done) {
            term.on('cursormove', function () { return done(); });
            term.write('foo');
        });
        it('should fire the onLineFeed event', function (done) {
            term.on('linefeed', function () { return done(); });
            term.write('\n');
        });
        it('should fire a scroll event when scrollback is created', function (done) {
            term.on('scroll', function () { return done(); });
            term.write('\n'.repeat(INIT_ROWS));
        });
        it('should fire a scroll event when scrollback is cleared', function (done) {
            term.write('\n'.repeat(INIT_ROWS));
            term.on('scroll', function () { return done(); });
            term.clear();
        });
        it('should fire a key event after a keypress DOM event', function (done) {
            term.onKey(function (e) {
                chai_1.assert.equal(typeof e.key, 'string');
                chai_1.expect(e.domEvent).to.be.an.instanceof(Object);
                done();
            });
            var evKeyPress = {
                preventDefault: function () { },
                stopPropagation: function () { },
                type: 'keypress',
                keyCode: 13
            };
            term.keyPress(evKeyPress);
        });
        it('should fire a key event after a keydown DOM event', function (done) {
            term.onKey(function (e) {
                chai_1.assert.equal(typeof e.key, 'string');
                chai_1.expect(e.domEvent).to.be.an.instanceof(Object);
                done();
            });
            var evKeyDown = {
                preventDefault: function () { },
                stopPropagation: function () { },
                type: 'keydown',
                keyCode: 13
            };
            term.keyDown(evKeyDown);
        });
        it('should fire the onResize event', function (done) {
            term.onResize(function (e) {
                chai_1.expect(e).to.have.keys(['cols', 'rows']);
                chai_1.assert.equal(typeof e.cols, 'number');
                chai_1.assert.equal(typeof e.rows, 'number');
                done();
            });
            term.resize(1, 1);
        });
        it('should fire the onScroll event', function (done) {
            term.onScroll(function (e) {
                chai_1.assert.equal(typeof e, 'number');
                done();
            });
            term.scroll();
        });
        it('should fire the onTitleChange event', function (done) {
            term.onTitleChange(function (e) {
                chai_1.assert.equal(e, 'title');
                done();
            });
            term.handleTitle('title');
        });
    });
    describe('on', function () {
        beforeEach(function () {
            term.on('key', function () { });
            term.on('keypress', function () { });
            term.on('keydown', function () { });
        });
        describe('data', function () {
            it('should emit a data event', function (done) {
                term.on('data', function () {
                    done();
                });
                term.handler('fake');
            });
        });
        describe('cursormove', function () {
            it('should emit a cursormove event', function (done) {
                term.on('cursormove', function () {
                    done();
                });
                term.write('foo');
            });
        });
        describe('linefeed', function () {
            it('should emit a linefeed event', function (done) {
                term.on('linefeed', function () {
                    done();
                });
                term.write('\n');
            });
        });
        describe('scroll', function () {
            it('should emit a scroll event when scrollback is created', function (done) {
                term.on('scroll', function () {
                    done();
                });
                term.write('\n'.repeat(INIT_ROWS));
            });
            it('should emit a scroll event when scrollback is cleared', function (done) {
                term.write('\n'.repeat(INIT_ROWS));
                term.on('scroll', function () {
                    done();
                });
                term.clear();
            });
        });
        describe("keypress (including 'key' event)", function () {
            it('should receive a string and event object', function (done) {
                var steps = 0;
                var finish = function () {
                    if ((++steps) === 2) {
                        done();
                    }
                };
                var evKeyPress = {
                    preventDefault: function () { },
                    stopPropagation: function () { },
                    type: 'keypress',
                    keyCode: 13
                };
                term.on('keypress', function (key, event) {
                    chai_1.assert.equal(typeof key, 'string');
                    chai_1.expect(event).to.be.an.instanceof(Object);
                    finish();
                });
                term.on('key', function (key, event) {
                    chai_1.assert.equal(typeof key, 'string');
                    chai_1.expect(event).to.be.an.instanceof(Object);
                    finish();
                });
                term.keyPress(evKeyPress);
            });
        });
        describe("keydown (including 'key' event)", function () {
            it("should receive an event object for 'keydown' and a string and event object for 'key'", function (done) {
                var steps = 0;
                var finish = function () {
                    if ((++steps) === 2) {
                        done();
                    }
                };
                var evKeyDown = {
                    preventDefault: function () { },
                    stopPropagation: function () { },
                    type: 'keydown',
                    keyCode: 13
                };
                term.on('keydown', function (event) {
                    chai_1.expect(event).to.be.an.instanceof(Object);
                    finish();
                });
                term.on('key', function (key, event) {
                    chai_1.assert.equal(typeof key, 'string');
                    chai_1.expect(event).to.be.an.instanceof(Object);
                    finish();
                });
                term.keyDown(evKeyDown);
            });
        });
        describe('resize', function () {
            it('should receive an object: {cols: number, rows: number}', function (done) {
                term.on('resize', function (data) {
                    chai_1.expect(data).to.have.keys(['cols', 'rows']);
                    chai_1.assert.equal(typeof data.cols, 'number');
                    chai_1.assert.equal(typeof data.rows, 'number');
                    done();
                });
                term.resize(1, 1);
            });
        });
        describe('scroll', function () {
            it('should receive a number', function (done) {
                term.on('scroll', function (ydisp) {
                    chai_1.assert.equal(typeof ydisp, 'number');
                    done();
                });
                term.scroll();
            });
        });
        describe('title', function () {
            it('should receive a string', function (done) {
                term.on('title', function (title) {
                    chai_1.assert.equal(typeof title, 'string');
                    done();
                });
                term.handleTitle('title');
            });
        });
    });
    describe('attachCustomKeyEventHandler', function () {
        var evKeyDown = {
            preventDefault: function () { },
            stopPropagation: function () { },
            type: 'keydown',
            keyCode: 77
        };
        var evKeyPress = {
            preventDefault: function () { },
            stopPropagation: function () { },
            type: 'keypress',
            keyCode: 77
        };
        beforeEach(function () {
            term.handler = function () { };
            term.showCursor = function () { };
            term.clearSelection = function () { };
        });
        it('should process the keydown/keypress event based on what the handler returns', function () {
            chai_1.assert.equal(term.keyDown(evKeyDown), true);
            chai_1.assert.equal(term.keyPress(evKeyPress), true);
            term.attachCustomKeyEventHandler(function (ev) { return ev.keyCode === 77; });
            chai_1.assert.equal(term.keyDown(evKeyDown), true);
            chai_1.assert.equal(term.keyPress(evKeyPress), true);
            term.attachCustomKeyEventHandler(function (ev) { return ev.keyCode !== 77; });
            chai_1.assert.equal(term.keyDown(evKeyDown), false);
            chai_1.assert.equal(term.keyPress(evKeyPress), false);
        });
        it('should alive after reset(ESC c Full Reset (RIS))', function () {
            term.attachCustomKeyEventHandler(function (ev) { return ev.keyCode !== 77; });
            chai_1.assert.equal(term.keyDown(evKeyDown), false);
            chai_1.assert.equal(term.keyPress(evKeyPress), false);
            term.reset();
            chai_1.assert.equal(term.keyDown(evKeyDown), false);
            chai_1.assert.equal(term.keyPress(evKeyPress), false);
        });
    });
    describe('setOption', function () {
        it('should set option correctly', function () {
            term.setOption('cursorBlink', true);
            chai_1.assert.equal(term.options.cursorBlink, true);
            term.setOption('cursorBlink', false);
            chai_1.assert.equal(term.options.cursorBlink, false);
        });
        it('should throw when setting a non-existant option', function () {
            chai_1.assert.throws(term.setOption.bind(term, 'fake', true));
        });
    });
    describe('reset', function () {
        it('should not affect cursorState', function () {
            term.cursorState = 1;
            term.reset();
            chai_1.assert.equal(term.cursorState, 1);
            term.cursorState = 0;
            term.reset();
            chai_1.assert.equal(term.cursorState, 0);
        });
    });
    describe('clear', function () {
        it('should clear a buffer equal to rows', function () {
            var promptLine = term.buffer.lines.get(term.buffer.ybase + term.buffer.y);
            term.clear();
            chai_1.assert.equal(term.buffer.y, 0);
            chai_1.assert.equal(term.buffer.ybase, 0);
            chai_1.assert.equal(term.buffer.ydisp, 0);
            chai_1.assert.equal(term.buffer.lines.length, term.rows);
            chai_1.assert.deepEqual(term.buffer.lines.get(0), promptLine);
            for (var i = 1; i < term.rows; i++) {
                chai_1.assert.deepEqual(term.buffer.lines.get(i), term.buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
            }
        });
        it('should clear a buffer larger than rows', function () {
            for (var i = 0; i < term.rows * 2; i++) {
                term.write('test\n');
            }
            var promptLine = term.buffer.lines.get(term.buffer.ybase + term.buffer.y);
            term.clear();
            chai_1.assert.equal(term.buffer.y, 0);
            chai_1.assert.equal(term.buffer.ybase, 0);
            chai_1.assert.equal(term.buffer.ydisp, 0);
            chai_1.assert.equal(term.buffer.lines.length, term.rows);
            chai_1.assert.deepEqual(term.buffer.lines.get(0), promptLine);
            for (var i = 1; i < term.rows; i++) {
                chai_1.assert.deepEqual(term.buffer.lines.get(i), term.buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
            }
        });
        it('should not break the prompt when cleared twice', function () {
            var promptLine = term.buffer.lines.get(term.buffer.ybase + term.buffer.y);
            term.clear();
            term.clear();
            chai_1.assert.equal(term.buffer.y, 0);
            chai_1.assert.equal(term.buffer.ybase, 0);
            chai_1.assert.equal(term.buffer.ydisp, 0);
            chai_1.assert.equal(term.buffer.lines.length, term.rows);
            chai_1.assert.deepEqual(term.buffer.lines.get(0), promptLine);
            for (var i = 1; i < term.rows; i++) {
                chai_1.assert.deepEqual(term.buffer.lines.get(i), term.buffer.getBlankLine(Buffer_1.DEFAULT_ATTR_DATA));
            }
        });
    });
    describe('scroll', function () {
        describe('scrollLines', function () {
            var startYDisp;
            beforeEach(function () {
                for (var i = 0; i < term.rows * 2; i++) {
                    term.writeln('test');
                }
                startYDisp = term.rows + 1;
            });
            it('should scroll a single line', function () {
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollLines(-1);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp - 1);
                term.scrollLines(1);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
            });
            it('should scroll multiple lines', function () {
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollLines(-5);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp - 5);
                term.scrollLines(5);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
            });
            it('should not scroll beyond the bounds of the buffer', function () {
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollLines(1);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                for (var i = 0; i < startYDisp; i++) {
                    term.scrollLines(-1);
                }
                chai_1.assert.equal(term.buffer.ydisp, 0);
                term.scrollLines(-1);
                chai_1.assert.equal(term.buffer.ydisp, 0);
            });
        });
        describe('scrollPages', function () {
            var startYDisp;
            beforeEach(function () {
                for (var i = 0; i < term.rows * 3; i++) {
                    term.writeln('test');
                }
                startYDisp = (term.rows * 2) + 1;
            });
            it('should scroll a single page', function () {
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollPages(-1);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp - (term.rows - 1));
                term.scrollPages(1);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
            });
            it('should scroll a multiple pages', function () {
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollPages(-2);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp - (term.rows - 1) * 2);
                term.scrollPages(2);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
            });
        });
        describe('scrollToTop', function () {
            beforeEach(function () {
                for (var i = 0; i < term.rows * 3; i++) {
                    term.writeln('test');
                }
            });
            it('should scroll to the top', function () {
                chai_1.assert.notEqual(term.buffer.ydisp, 0);
                term.scrollToTop();
                chai_1.assert.equal(term.buffer.ydisp, 0);
            });
        });
        describe('scrollToBottom', function () {
            var startYDisp;
            beforeEach(function () {
                for (var i = 0; i < term.rows * 3; i++) {
                    term.writeln('test');
                }
                startYDisp = (term.rows * 2) + 1;
            });
            it('should scroll to the bottom', function () {
                term.scrollLines(-1);
                term.scrollToBottom();
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollPages(-1);
                term.scrollToBottom();
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollToTop();
                term.scrollToBottom();
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
            });
        });
        describe('scrollToLine', function () {
            var startYDisp;
            beforeEach(function () {
                for (var i = 0; i < term.rows * 3; i++) {
                    term.writeln('test');
                }
                startYDisp = (term.rows * 2) + 1;
            });
            it('should scroll to requested line', function () {
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollToLine(0);
                chai_1.assert.equal(term.buffer.ydisp, 0);
                term.scrollToLine(10);
                chai_1.assert.equal(term.buffer.ydisp, 10);
                term.scrollToLine(startYDisp);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollToLine(20);
                chai_1.assert.equal(term.buffer.ydisp, 20);
            });
            it('should not scroll beyond boundary lines', function () {
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollToLine(-1);
                chai_1.assert.equal(term.buffer.ydisp, 0);
                term.scrollToLine(startYDisp + 1);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
            });
        });
        describe('keyPress', function () {
            it('should scroll down, when a key is pressed and terminal is scrolled up', function () {
                var event = {
                    type: 'keydown',
                    key: 'a',
                    keyCode: 65,
                    preventDefault: function () { },
                    stopPropagation: function () { }
                };
                term.buffer.ydisp = 0;
                term.buffer.ybase = 40;
                term.keyPress(event);
                chai_1.assert.equal(term.buffer.ydisp, term.buffer.ybase);
            });
            it('should not scroll down, when a custom keydown handler prevents the event', function () {
                for (var i = 0; i < term.rows * 3; i++) {
                    term.writeln('test');
                }
                var startYDisp = (term.rows * 2) + 1;
                term.attachCustomKeyEventHandler(function () {
                    return false;
                });
                chai_1.assert.equal(term.buffer.ydisp, startYDisp);
                term.scrollLines(-1);
                chai_1.assert.equal(term.buffer.ydisp, startYDisp - 1);
                term.keyPress({ keyCode: 0 });
                chai_1.assert.equal(term.buffer.ydisp, startYDisp - 1);
            });
        });
        describe('scroll() function', function () {
            describe('when scrollback > 0', function () {
                it('should create a new line and scroll', function () {
                    term.buffer.lines.get(0).setCell(0, BufferLine_1.CellData.fromCharData([0, 'a', 0, 'a'.charCodeAt(0)]));
                    term.buffer.lines.get(INIT_ROWS - 1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'b', 0, 'b'.charCodeAt(0)]));
                    term.buffer.y = INIT_ROWS - 1;
                    term.scroll();
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS + 1);
                    chai_1.assert.equal(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getChars(), 'a');
                    chai_1.assert.equal(term.buffer.lines.get(INIT_ROWS - 1).loadCell(0, new BufferLine_1.CellData()).getChars(), 'b');
                    chai_1.assert.equal(term.buffer.lines.get(INIT_ROWS).loadCell(0, new BufferLine_1.CellData()).getChars(), '');
                });
                it('should properly scroll inside a scroll region (scrollTop set)', function () {
                    term.buffer.lines.get(0).setCell(0, BufferLine_1.CellData.fromCharData([0, 'a', 0, 'a'.charCodeAt(0)]));
                    term.buffer.lines.get(1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'b', 0, 'b'.charCodeAt(0)]));
                    term.buffer.lines.get(2).setCell(0, BufferLine_1.CellData.fromCharData([0, 'c', 0, 'c'.charCodeAt(0)]));
                    term.buffer.y = INIT_ROWS - 1;
                    term.buffer.scrollTop = 1;
                    term.scroll();
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS);
                    chai_1.assert.equal(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getChars(), 'a');
                    chai_1.assert.equal(term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getChars(), 'c');
                });
                it('should properly scroll inside a scroll region (scrollBottom set)', function () {
                    term.buffer.lines.get(0).setCell(0, BufferLine_1.CellData.fromCharData([0, 'a', 0, 'a'.charCodeAt(0)]));
                    term.buffer.lines.get(1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'b', 0, 'b'.charCodeAt(0)]));
                    term.buffer.lines.get(2).setCell(0, BufferLine_1.CellData.fromCharData([0, 'c', 0, 'c'.charCodeAt(0)]));
                    term.buffer.lines.get(3).setCell(0, BufferLine_1.CellData.fromCharData([0, 'd', 0, 'd'.charCodeAt(0)]));
                    term.buffer.lines.get(4).setCell(0, BufferLine_1.CellData.fromCharData([0, 'e', 0, 'e'.charCodeAt(0)]));
                    term.buffer.y = 3;
                    term.buffer.scrollBottom = 3;
                    term.scroll();
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS + 1);
                    chai_1.assert.equal(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getChars(), 'a', '\'a\' should be pushed to the scrollback');
                    chai_1.assert.equal(term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getChars(), 'b');
                    chai_1.assert.equal(term.buffer.lines.get(2).loadCell(0, new BufferLine_1.CellData()).getChars(), 'c');
                    chai_1.assert.equal(term.buffer.lines.get(3).loadCell(0, new BufferLine_1.CellData()).getChars(), 'd');
                    chai_1.assert.equal(term.buffer.lines.get(4).loadCell(0, new BufferLine_1.CellData()).getChars(), '', 'a blank line should be added at scrollBottom\'s index');
                    chai_1.assert.equal(term.buffer.lines.get(5).loadCell(0, new BufferLine_1.CellData()).getChars(), 'e');
                });
                it('should properly scroll inside a scroll region (scrollTop and scrollBottom set)', function () {
                    term.buffer.lines.get(0).setCell(0, BufferLine_1.CellData.fromCharData([0, 'a', 0, 'a'.charCodeAt(0)]));
                    term.buffer.lines.get(1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'b', 0, 'b'.charCodeAt(0)]));
                    term.buffer.lines.get(2).setCell(0, BufferLine_1.CellData.fromCharData([0, 'c', 0, 'c'.charCodeAt(0)]));
                    term.buffer.lines.get(3).setCell(0, BufferLine_1.CellData.fromCharData([0, 'd', 0, 'd'.charCodeAt(0)]));
                    term.buffer.lines.get(4).setCell(0, BufferLine_1.CellData.fromCharData([0, 'e', 0, 'e'.charCodeAt(0)]));
                    term.buffer.y = INIT_ROWS - 1;
                    term.buffer.scrollTop = 1;
                    term.buffer.scrollBottom = 3;
                    term.scroll();
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS);
                    chai_1.assert.equal(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getChars(), 'a');
                    chai_1.assert.equal(term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getChars(), 'c', '\'b\' should be removed from the buffer');
                    chai_1.assert.equal(term.buffer.lines.get(2).loadCell(0, new BufferLine_1.CellData()).getChars(), 'd');
                    chai_1.assert.equal(term.buffer.lines.get(3).loadCell(0, new BufferLine_1.CellData()).getChars(), '', 'a blank line should be added at scrollBottom\'s index');
                    chai_1.assert.equal(term.buffer.lines.get(4).loadCell(0, new BufferLine_1.CellData()).getChars(), 'e');
                });
            });
            describe('when scrollback === 0', function () {
                beforeEach(function () {
                    term.setOption('scrollback', 0);
                    chai_1.assert.equal(term.buffer.lines.maxLength, INIT_ROWS);
                });
                it('should create a new line and shift everything up', function () {
                    term.buffer.lines.get(0).setCell(0, BufferLine_1.CellData.fromCharData([0, 'a', 0, 'a'.charCodeAt(0)]));
                    term.buffer.lines.get(1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'b', 0, 'b'.charCodeAt(0)]));
                    term.buffer.lines.get(INIT_ROWS - 1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'c', 0, 'c'.charCodeAt(0)]));
                    term.buffer.y = INIT_ROWS - 1;
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS);
                    term.scroll();
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS);
                    chai_1.assert.equal(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getChars(), 'b');
                    chai_1.assert.equal(term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getChars(), '');
                    chai_1.assert.equal(term.buffer.lines.get(INIT_ROWS - 2).loadCell(0, new BufferLine_1.CellData()).getChars(), 'c');
                    chai_1.assert.equal(term.buffer.lines.get(INIT_ROWS - 1).loadCell(0, new BufferLine_1.CellData()).getChars(), '');
                });
                it('should properly scroll inside a scroll region (scrollTop set)', function () {
                    term.buffer.lines.get(0).setCell(0, BufferLine_1.CellData.fromCharData([0, 'a', 0, 'a'.charCodeAt(0)]));
                    term.buffer.lines.get(1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'b', 0, 'b'.charCodeAt(0)]));
                    term.buffer.lines.get(2).setCell(0, BufferLine_1.CellData.fromCharData([0, 'c', 0, 'c'.charCodeAt(0)]));
                    term.buffer.y = INIT_ROWS - 1;
                    term.buffer.scrollTop = 1;
                    term.scroll();
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS);
                    chai_1.assert.equal(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getChars(), 'a');
                    chai_1.assert.equal(term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getChars(), 'c');
                });
                it('should properly scroll inside a scroll region (scrollBottom set)', function () {
                    term.buffer.lines.get(0).setCell(0, BufferLine_1.CellData.fromCharData([0, 'a', 0, 'a'.charCodeAt(0)]));
                    term.buffer.lines.get(1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'b', 0, 'b'.charCodeAt(0)]));
                    term.buffer.lines.get(2).setCell(0, BufferLine_1.CellData.fromCharData([0, 'c', 0, 'c'.charCodeAt(0)]));
                    term.buffer.lines.get(3).setCell(0, BufferLine_1.CellData.fromCharData([0, 'd', 0, 'd'.charCodeAt(0)]));
                    term.buffer.lines.get(4).setCell(0, BufferLine_1.CellData.fromCharData([0, 'e', 0, 'e'.charCodeAt(0)]));
                    term.buffer.y = 3;
                    term.buffer.scrollBottom = 3;
                    term.scroll();
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS);
                    chai_1.assert.equal(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getChars(), 'b');
                    chai_1.assert.equal(term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getChars(), 'c');
                    chai_1.assert.equal(term.buffer.lines.get(2).loadCell(0, new BufferLine_1.CellData()).getChars(), 'd');
                    chai_1.assert.equal(term.buffer.lines.get(3).loadCell(0, new BufferLine_1.CellData()).getChars(), '', 'a blank line should be added at scrollBottom\'s index');
                    chai_1.assert.equal(term.buffer.lines.get(4).loadCell(0, new BufferLine_1.CellData()).getChars(), 'e');
                });
                it('should properly scroll inside a scroll region (scrollTop and scrollBottom set)', function () {
                    term.buffer.lines.get(0).setCell(0, BufferLine_1.CellData.fromCharData([0, 'a', 0, 'a'.charCodeAt(0)]));
                    term.buffer.lines.get(1).setCell(0, BufferLine_1.CellData.fromCharData([0, 'b', 0, 'b'.charCodeAt(0)]));
                    term.buffer.lines.get(2).setCell(0, BufferLine_1.CellData.fromCharData([0, 'c', 0, 'c'.charCodeAt(0)]));
                    term.buffer.lines.get(3).setCell(0, BufferLine_1.CellData.fromCharData([0, 'd', 0, 'd'.charCodeAt(0)]));
                    term.buffer.lines.get(4).setCell(0, BufferLine_1.CellData.fromCharData([0, 'e', 0, 'e'.charCodeAt(0)]));
                    term.buffer.y = INIT_ROWS - 1;
                    term.buffer.scrollTop = 1;
                    term.buffer.scrollBottom = 3;
                    term.scroll();
                    chai_1.assert.equal(term.buffer.lines.length, INIT_ROWS);
                    chai_1.assert.equal(term.buffer.lines.get(0).loadCell(0, new BufferLine_1.CellData()).getChars(), 'a');
                    chai_1.assert.equal(term.buffer.lines.get(1).loadCell(0, new BufferLine_1.CellData()).getChars(), 'c', '\'b\' should be removed from the buffer');
                    chai_1.assert.equal(term.buffer.lines.get(2).loadCell(0, new BufferLine_1.CellData()).getChars(), 'd');
                    chai_1.assert.equal(term.buffer.lines.get(3).loadCell(0, new BufferLine_1.CellData()).getChars(), '', 'a blank line should be added at scrollBottom\'s index');
                    chai_1.assert.equal(term.buffer.lines.get(4).loadCell(0, new BufferLine_1.CellData()).getChars(), 'e');
                });
            });
        });
    });
    describe('Third level shift', function () {
        var evKeyDown;
        var evKeyPress;
        beforeEach(function () {
            term.handler = function () { };
            term.showCursor = function () { };
            term.clearSelection = function () { };
            evKeyDown = {
                preventDefault: function () { },
                stopPropagation: function () { },
                type: 'keydown',
                altKey: null,
                keyCode: null
            };
            evKeyPress = {
                preventDefault: function () { },
                stopPropagation: function () { },
                type: 'keypress',
                altKey: null,
                charCode: null,
                keyCode: null
            };
        });
        describe('with macOptionIsMeta', function () {
            beforeEach(function () {
                term.browser.isMac = true;
                term.setOption('macOptionIsMeta', true);
            });
            it('should interfere with the alt key on keyDown', function () {
                evKeyDown.altKey = true;
                evKeyDown.keyCode = 81;
                chai_1.assert.equal(term.keyDown(evKeyDown), false);
                evKeyDown.altKey = true;
                evKeyDown.keyCode = 192;
                chai_1.assert.equal(term.keyDown(evKeyDown), false);
            });
        });
        describe('On Mac OS', function () {
            beforeEach(function () {
                term.browser.isMac = true;
            });
            it('should not interfere with the alt key on keyDown', function () {
                evKeyDown.altKey = true;
                evKeyDown.keyCode = 81;
                chai_1.assert.equal(term.keyDown(evKeyDown), true);
                evKeyDown.altKey = true;
                evKeyDown.keyCode = 192;
                chai_1.assert.equal(term.keyDown(evKeyDown), true);
            });
            it('should interefere with the alt + arrow keys', function () {
                evKeyDown.altKey = true;
                evKeyDown.keyCode = 37;
                chai_1.assert.equal(term.keyDown(evKeyDown), false);
                evKeyDown.altKey = true;
                evKeyDown.keyCode = 39;
                chai_1.assert.equal(term.keyDown(evKeyDown), false);
            });
            it('should emit key with alt + key on keyPress', function (done) {
                var keys = ['@', '@', '\\', '\\', '|', '|'];
                term.on('keypress', function (key) {
                    if (key) {
                        var index = keys.indexOf(key);
                        chai_1.assert(index !== -1, 'Emitted wrong key: ' + key);
                        keys.splice(index, 1);
                    }
                    if (keys.length === 0)
                        done();
                });
                evKeyPress.altKey = true;
                evKeyPress.charCode = null;
                evKeyPress.keyCode = 64;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = 64;
                evKeyPress.keyCode = 0;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = null;
                evKeyPress.keyCode = 92;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = 92;
                evKeyPress.keyCode = 0;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = null;
                evKeyPress.keyCode = 124;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = 124;
                evKeyPress.keyCode = 0;
                term.keyPress(evKeyPress);
            });
        });
        describe('On MS Windows', function () {
            beforeEach(function () {
                term.browser.isMSWindows = true;
            });
            it('should not interfere with the alt + ctrl key on keyDown', function () {
                evKeyPress.altKey = true;
                evKeyPress.ctrlKey = true;
                evKeyPress.keyCode = 81;
                chai_1.assert.equal(term.keyDown(evKeyPress), true);
                evKeyDown.altKey = true;
                evKeyDown.ctrlKey = true;
                evKeyDown.keyCode = 81;
                chai_1.assert.equal(term.keyDown(evKeyDown), true);
            });
            it('should interefere with the alt + ctrl + arrow keys', function () {
                evKeyDown.altKey = true;
                evKeyDown.ctrlKey = true;
                evKeyDown.keyCode = 37;
                chai_1.assert.equal(term.keyDown(evKeyDown), false);
                evKeyDown.keyCode = 39;
                chai_1.assert.equal(term.keyDown(evKeyDown), false);
            });
            it('should emit key with alt + ctrl + key on keyPress', function (done) {
                var keys = ['@', '@', '\\', '\\', '|', '|'];
                term.on('keypress', function (key) {
                    if (key) {
                        var index = keys.indexOf(key);
                        chai_1.assert(index !== -1, 'Emitted wrong key: ' + key);
                        keys.splice(index, 1);
                    }
                    if (keys.length === 0)
                        done();
                });
                evKeyPress.altKey = true;
                evKeyPress.ctrlKey = true;
                evKeyPress.charCode = null;
                evKeyPress.keyCode = 64;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = 64;
                evKeyPress.keyCode = 0;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = null;
                evKeyPress.keyCode = 92;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = 92;
                evKeyPress.keyCode = 0;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = null;
                evKeyPress.keyCode = 124;
                term.keyPress(evKeyPress);
                evKeyPress.charCode = 124;
                evKeyPress.keyCode = 0;
                term.keyPress(evKeyPress);
            });
        });
    });
    describe('unicode - surrogates', function () {
        it('2 characters per cell', function () {
            this.timeout(10000);
            var high = String.fromCharCode(0xD800);
            var cell = new BufferLine_1.CellData();
            for (var i = 0xDC00; i <= 0xDCFF; ++i) {
                term.write(high + String.fromCharCode(i));
                var tchar = term.buffer.lines.get(0).loadCell(0, cell);
                chai_1.expect(tchar.getChars()).eql(high + String.fromCharCode(i));
                chai_1.expect(tchar.getChars().length).eql(2);
                chai_1.expect(tchar.getWidth()).eql(1);
                chai_1.expect(term.buffer.lines.get(0).loadCell(1, cell).getChars()).eql('');
                term.reset();
            }
        });
        it('2 characters at last cell', function () {
            var high = String.fromCharCode(0xD800);
            var cell = new BufferLine_1.CellData();
            for (var i = 0xDC00; i <= 0xDCFF; ++i) {
                term.buffer.x = term.cols - 1;
                term.write(high + String.fromCharCode(i));
                chai_1.expect(term.buffer.lines.get(0).loadCell(term.buffer.x - 1, cell).getChars()).eql(high + String.fromCharCode(i));
                chai_1.expect(term.buffer.lines.get(0).loadCell(term.buffer.x - 1, cell).getChars().length).eql(2);
                chai_1.expect(term.buffer.lines.get(1).loadCell(0, cell).getChars()).eql('');
                term.reset();
            }
        });
        it('2 characters per cell over line end with autowrap', function () {
            var high = String.fromCharCode(0xD800);
            var cell = new BufferLine_1.CellData();
            for (var i = 0xDC00; i <= 0xDCFF; ++i) {
                term.buffer.x = term.cols - 1;
                term.wraparoundMode = true;
                term.write('a' + high + String.fromCharCode(i));
                chai_1.expect(term.buffer.lines.get(0).loadCell(term.cols - 1, cell).getChars()).eql('a');
                chai_1.expect(term.buffer.lines.get(1).loadCell(0, cell).getChars()).eql(high + String.fromCharCode(i));
                chai_1.expect(term.buffer.lines.get(1).loadCell(0, cell).getChars().length).eql(2);
                chai_1.expect(term.buffer.lines.get(1).loadCell(1, cell).getChars()).eql('');
                term.reset();
            }
        });
        it('2 characters per cell over line end without autowrap', function () {
            var high = String.fromCharCode(0xD800);
            var cell = new BufferLine_1.CellData();
            for (var i = 0xDC00; i <= 0xDCFF; ++i) {
                term.buffer.x = term.cols - 1;
                term.wraparoundMode = false;
                term.write('a' + high + String.fromCharCode(i));
                chai_1.expect(term.buffer.lines.get(0).loadCell(term.cols - 1, cell).getChars()).eql('a');
                chai_1.expect(term.buffer.lines.get(0).loadCell(term.cols - 1, cell).getChars().length).eql(1);
                chai_1.expect(term.buffer.lines.get(1).loadCell(1, cell).getChars()).eql('');
                term.reset();
            }
        });
        it('splitted surrogates', function () {
            var high = String.fromCharCode(0xD800);
            var cell = new BufferLine_1.CellData();
            for (var i = 0xDC00; i <= 0xDCFF; ++i) {
                term.write(high);
                term.write(String.fromCharCode(i));
                var tchar = term.buffer.lines.get(0).loadCell(0, cell);
                chai_1.expect(tchar.getChars()).eql(high + String.fromCharCode(i));
                chai_1.expect(tchar.getChars().length).eql(2);
                chai_1.expect(tchar.getWidth()).eql(1);
                chai_1.expect(term.buffer.lines.get(0).loadCell(1, cell).getChars()).eql('');
                term.reset();
            }
        });
    });
    describe('unicode - combining characters', function () {
        var cell = new BufferLine_1.CellData();
        it('café', function () {
            term.write('cafe\u0301');
            term.buffer.lines.get(0).loadCell(3, cell);
            chai_1.expect(cell.getChars()).eql('e\u0301');
            chai_1.expect(cell.getChars().length).eql(2);
            chai_1.expect(cell.getWidth()).eql(1);
        });
        it('café - end of line', function () {
            term.buffer.x = term.cols - 1 - 3;
            term.write('cafe\u0301');
            term.buffer.lines.get(0).loadCell(term.cols - 1, cell);
            chai_1.expect(cell.getChars()).eql('e\u0301');
            chai_1.expect(cell.getChars().length).eql(2);
            chai_1.expect(cell.getWidth()).eql(1);
            term.buffer.lines.get(0).loadCell(1, cell);
            chai_1.expect(cell.getChars()).eql('');
            chai_1.expect(cell.getChars().length).eql(0);
            chai_1.expect(cell.getWidth()).eql(1);
        });
        it('multiple combined é', function () {
            term.wraparoundMode = true;
            term.write(Array(100).join('e\u0301'));
            for (var i = 0; i < term.cols; ++i) {
                term.buffer.lines.get(0).loadCell(i, cell);
                chai_1.expect(cell.getChars()).eql('e\u0301');
                chai_1.expect(cell.getChars().length).eql(2);
                chai_1.expect(cell.getWidth()).eql(1);
            }
            term.buffer.lines.get(1).loadCell(0, cell);
            chai_1.expect(cell.getChars()).eql('e\u0301');
            chai_1.expect(cell.getChars().length).eql(2);
            chai_1.expect(cell.getWidth()).eql(1);
        });
        it('multiple surrogate with combined', function () {
            term.wraparoundMode = true;
            term.write(Array(100).join('\uD800\uDC00\u0301'));
            for (var i = 0; i < term.cols; ++i) {
                term.buffer.lines.get(0).loadCell(i, cell);
                chai_1.expect(cell.getChars()).eql('\uD800\uDC00\u0301');
                chai_1.expect(cell.getChars().length).eql(3);
                chai_1.expect(cell.getWidth()).eql(1);
            }
            term.buffer.lines.get(1).loadCell(0, cell);
            chai_1.expect(cell.getChars()).eql('\uD800\uDC00\u0301');
            chai_1.expect(cell.getChars().length).eql(3);
            chai_1.expect(cell.getWidth()).eql(1);
        });
    });
    describe('unicode - fullwidth characters', function () {
        var cell = new BufferLine_1.CellData();
        it('cursor movement even', function () {
            chai_1.expect(term.buffer.x).eql(0);
            term.write('￥');
            chai_1.expect(term.buffer.x).eql(2);
        });
        it('cursor movement odd', function () {
            term.buffer.x = 1;
            chai_1.expect(term.buffer.x).eql(1);
            term.write('￥');
            chai_1.expect(term.buffer.x).eql(3);
        });
        it('line of ￥ even', function () {
            term.wraparoundMode = true;
            term.write(Array(50).join('￥'));
            for (var i = 0; i < term.cols; ++i) {
                term.buffer.lines.get(0).loadCell(i, cell);
                if (i % 2) {
                    chai_1.expect(cell.getChars()).eql('');
                    chai_1.expect(cell.getChars().length).eql(0);
                    chai_1.expect(cell.getWidth()).eql(0);
                }
                else {
                    chai_1.expect(cell.getChars()).eql('￥');
                    chai_1.expect(cell.getChars().length).eql(1);
                    chai_1.expect(cell.getWidth()).eql(2);
                }
            }
            term.buffer.lines.get(1).loadCell(0, cell);
            chai_1.expect(cell.getChars()).eql('￥');
            chai_1.expect(cell.getChars().length).eql(1);
            chai_1.expect(cell.getWidth()).eql(2);
        });
        it('line of ￥ odd', function () {
            term.wraparoundMode = true;
            term.buffer.x = 1;
            term.write(Array(50).join('￥'));
            for (var i = 1; i < term.cols - 1; ++i) {
                term.buffer.lines.get(0).loadCell(i, cell);
                if (!(i % 2)) {
                    chai_1.expect(cell.getChars()).eql('');
                    chai_1.expect(cell.getChars().length).eql(0);
                    chai_1.expect(cell.getWidth()).eql(0);
                }
                else {
                    chai_1.expect(cell.getChars()).eql('￥');
                    chai_1.expect(cell.getChars().length).eql(1);
                    chai_1.expect(cell.getWidth()).eql(2);
                }
            }
            term.buffer.lines.get(0).loadCell(term.cols - 1, cell);
            chai_1.expect(cell.getChars()).eql('');
            chai_1.expect(cell.getChars().length).eql(0);
            chai_1.expect(cell.getWidth()).eql(1);
            term.buffer.lines.get(1).loadCell(0, cell);
            chai_1.expect(cell.getChars()).eql('￥');
            chai_1.expect(cell.getChars().length).eql(1);
            chai_1.expect(cell.getWidth()).eql(2);
        });
        it('line of ￥ with combining odd', function () {
            term.wraparoundMode = true;
            term.buffer.x = 1;
            term.write(Array(50).join('￥\u0301'));
            for (var i = 1; i < term.cols - 1; ++i) {
                term.buffer.lines.get(0).loadCell(i, cell);
                if (!(i % 2)) {
                    chai_1.expect(cell.getChars()).eql('');
                    chai_1.expect(cell.getChars().length).eql(0);
                    chai_1.expect(cell.getWidth()).eql(0);
                }
                else {
                    chai_1.expect(cell.getChars()).eql('￥\u0301');
                    chai_1.expect(cell.getChars().length).eql(2);
                    chai_1.expect(cell.getWidth()).eql(2);
                }
            }
            term.buffer.lines.get(0).loadCell(term.cols - 1, cell);
            chai_1.expect(cell.getChars()).eql('');
            chai_1.expect(cell.getChars().length).eql(0);
            chai_1.expect(cell.getWidth()).eql(1);
            term.buffer.lines.get(1).loadCell(0, cell);
            chai_1.expect(cell.getChars()).eql('￥\u0301');
            chai_1.expect(cell.getChars().length).eql(2);
            chai_1.expect(cell.getWidth()).eql(2);
        });
        it('line of ￥ with combining even', function () {
            term.wraparoundMode = true;
            term.write(Array(50).join('￥\u0301'));
            for (var i = 0; i < term.cols; ++i) {
                term.buffer.lines.get(0).loadCell(i, cell);
                if (i % 2) {
                    chai_1.expect(cell.getChars()).eql('');
                    chai_1.expect(cell.getChars().length).eql(0);
                    chai_1.expect(cell.getWidth()).eql(0);
                }
                else {
                    chai_1.expect(cell.getChars()).eql('￥\u0301');
                    chai_1.expect(cell.getChars().length).eql(2);
                    chai_1.expect(cell.getWidth()).eql(2);
                }
            }
            term.buffer.lines.get(1).loadCell(0, cell);
            chai_1.expect(cell.getChars()).eql('￥\u0301');
            chai_1.expect(cell.getChars().length).eql(2);
            chai_1.expect(cell.getWidth()).eql(2);
        });
        it('line of surrogate fullwidth with combining odd', function () {
            term.wraparoundMode = true;
            term.buffer.x = 1;
            term.write(Array(50).join('\ud843\ude6d\u0301'));
            for (var i = 1; i < term.cols - 1; ++i) {
                term.buffer.lines.get(0).loadCell(i, cell);
                if (!(i % 2)) {
                    chai_1.expect(cell.getChars()).eql('');
                    chai_1.expect(cell.getChars().length).eql(0);
                    chai_1.expect(cell.getWidth()).eql(0);
                }
                else {
                    chai_1.expect(cell.getChars()).eql('\ud843\ude6d\u0301');
                    chai_1.expect(cell.getChars().length).eql(3);
                    chai_1.expect(cell.getWidth()).eql(2);
                }
            }
            term.buffer.lines.get(0).loadCell(term.cols - 1, cell);
            chai_1.expect(cell.getChars()).eql('');
            chai_1.expect(cell.getChars().length).eql(0);
            chai_1.expect(cell.getWidth()).eql(1);
            term.buffer.lines.get(1).loadCell(0, cell);
            chai_1.expect(cell.getChars()).eql('\ud843\ude6d\u0301');
            chai_1.expect(cell.getChars().length).eql(3);
            chai_1.expect(cell.getWidth()).eql(2);
        });
        it('line of surrogate fullwidth with combining even', function () {
            term.wraparoundMode = true;
            term.write(Array(50).join('\ud843\ude6d\u0301'));
            for (var i = 0; i < term.cols; ++i) {
                term.buffer.lines.get(0).loadCell(i, cell);
                if (i % 2) {
                    chai_1.expect(cell.getChars()).eql('');
                    chai_1.expect(cell.getChars().length).eql(0);
                    chai_1.expect(cell.getWidth()).eql(0);
                }
                else {
                    chai_1.expect(cell.getChars()).eql('\ud843\ude6d\u0301');
                    chai_1.expect(cell.getChars().length).eql(3);
                    chai_1.expect(cell.getWidth()).eql(2);
                }
            }
            term.buffer.lines.get(1).loadCell(0, cell);
            chai_1.expect(cell.getChars()).eql('\ud843\ude6d\u0301');
            chai_1.expect(cell.getChars().length).eql(3);
            chai_1.expect(cell.getWidth()).eql(2);
        });
    });
    describe('insert mode', function () {
        var cell = new BufferLine_1.CellData();
        it('halfwidth - all', function () {
            term.write(Array(9).join('0123456789').slice(-80));
            term.buffer.x = 10;
            term.buffer.y = 0;
            term.insertMode = true;
            term.write('abcde');
            chai_1.expect(term.buffer.lines.get(0).length).eql(term.cols);
            chai_1.expect(term.buffer.lines.get(0).loadCell(10, cell).getChars()).eql('a');
            chai_1.expect(term.buffer.lines.get(0).loadCell(14, cell).getChars()).eql('e');
            chai_1.expect(term.buffer.lines.get(0).loadCell(15, cell).getChars()).eql('0');
            chai_1.expect(term.buffer.lines.get(0).loadCell(79, cell).getChars()).eql('4');
        });
        it('fullwidth - insert', function () {
            term.write(Array(9).join('0123456789').slice(-80));
            term.buffer.x = 10;
            term.buffer.y = 0;
            term.insertMode = true;
            term.write('￥￥￥');
            chai_1.expect(term.buffer.lines.get(0).length).eql(term.cols);
            chai_1.expect(term.buffer.lines.get(0).loadCell(10, cell).getChars()).eql('￥');
            chai_1.expect(term.buffer.lines.get(0).loadCell(11, cell).getChars()).eql('');
            chai_1.expect(term.buffer.lines.get(0).loadCell(14, cell).getChars()).eql('￥');
            chai_1.expect(term.buffer.lines.get(0).loadCell(15, cell).getChars()).eql('');
            chai_1.expect(term.buffer.lines.get(0).loadCell(79, cell).getChars()).eql('3');
        });
        it('fullwidth - right border', function () {
            term.write(Array(41).join('￥'));
            term.buffer.x = 10;
            term.buffer.y = 0;
            term.insertMode = true;
            term.write('a');
            chai_1.expect(term.buffer.lines.get(0).length).eql(term.cols);
            chai_1.expect(term.buffer.lines.get(0).loadCell(10, cell).getChars()).eql('a');
            chai_1.expect(term.buffer.lines.get(0).loadCell(11, cell).getChars()).eql('￥');
            chai_1.expect(term.buffer.lines.get(0).loadCell(79, cell).getChars()).eql('');
            term.write('b');
            chai_1.expect(term.buffer.lines.get(0).length).eql(term.cols);
            chai_1.expect(term.buffer.lines.get(0).loadCell(11, cell).getChars()).eql('b');
            chai_1.expect(term.buffer.lines.get(0).loadCell(12, cell).getChars()).eql('￥');
            chai_1.expect(term.buffer.lines.get(0).loadCell(79, cell).getChars()).eql('');
        });
    });
});
//# sourceMappingURL=Terminal.test.js.map