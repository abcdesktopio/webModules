"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsdom = require("jsdom");
var chai_1 = require("chai");
var DomRendererRowFactory_1 = require("./DomRendererRowFactory");
var Buffer_1 = require("../../Buffer");
var BufferLine_1 = require("../../BufferLine");
describe('DomRendererRowFactory', function () {
    var dom;
    var options = {};
    var rowFactory;
    var lineData;
    beforeEach(function () {
        dom = new jsdom.JSDOM('');
        options.enableBold = true;
        options.drawBoldTextInBrightColors = true;
        rowFactory = new DomRendererRowFactory_1.DomRendererRowFactory(options, dom.window.document);
        lineData = createEmptyLineData(2);
    });
    describe('createRow', function () {
        it('should not create anything for an empty row', function () {
            var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
            chai_1.assert.equal(getFragmentHtml(fragment), '');
        });
        it('should set correct attributes for double width characters', function () {
            lineData.setCell(0, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, '語', 2, '語'.charCodeAt(0)]));
            lineData.setCell(1, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, '', 0, undefined]));
            var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
            chai_1.assert.equal(getFragmentHtml(fragment), '<span style="width: 10px;">語</span>');
        });
        it('should add class for cursor and cursor style', function () {
            for (var _i = 0, _a = ['block', 'bar', 'underline']; _i < _a.length; _i++) {
                var style = _a[_i];
                var fragment = rowFactory.createRow(lineData, true, style, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), "<span class=\"xterm-cursor xterm-cursor-" + style + "\"> </span>");
            }
        });
        it('should add class for cursor blink', function () {
            var fragment = rowFactory.createRow(lineData, true, 'block', 0, true, 5, 20);
            chai_1.assert.equal(getFragmentHtml(fragment), "<span class=\"xterm-cursor xterm-cursor-blink xterm-cursor-block\"> </span>");
        });
        it('should not render cells that go beyond the terminal\'s columns', function () {
            lineData.setCell(0, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, 'a', 1, 'a'.charCodeAt(0)]));
            lineData.setCell(1, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, 'b', 1, 'b'.charCodeAt(0)]));
            var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 1);
            chai_1.assert.equal(getFragmentHtml(fragment), '<span>a</span>');
        });
        describe('attributes', function () {
            it('should add class for bold', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg = Buffer_1.DEFAULT_ATTR_DATA.fg | 134217728;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span class="xterm-bold">a</span>');
            });
            it('should add class for italic', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.bg = Buffer_1.DEFAULT_ATTR_DATA.bg | 67108864;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span class="xterm-italic">a</span>');
            });
            it('should add class for dim', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.bg = Buffer_1.DEFAULT_ATTR_DATA.bg | 134217728;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span class="xterm-dim">a</span>');
            });
            it('should add class for underline', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg = Buffer_1.DEFAULT_ATTR_DATA.fg | 268435456;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span class="xterm-underline">a</span>');
            });
            it('should add classes for 256 foreground colors', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg |= 33554432;
                for (var i = 0; i < 256; i++) {
                    cell.fg &= ~255;
                    cell.fg |= i;
                    lineData.setCell(0, cell);
                    var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                    chai_1.assert.equal(getFragmentHtml(fragment), "<span class=\"xterm-fg-" + i + "\">a</span>");
                }
            });
            it('should add classes for 256 background colors', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.bg |= 33554432;
                for (var i = 0; i < 256; i++) {
                    cell.bg &= ~255;
                    cell.bg |= i;
                    lineData.setCell(0, cell);
                    var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                    chai_1.assert.equal(getFragmentHtml(fragment), "<span class=\"xterm-bg-" + i + "\">a</span>");
                }
            });
            it('should correctly invert colors', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg |= 16777216 | 2 | 67108864;
                cell.bg |= 16777216 | 1;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span class="xterm-bg-2 xterm-fg-1">a</span>');
            });
            it('should correctly invert default fg color', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg |= 67108864;
                cell.bg |= 16777216 | 1;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span class="xterm-bg-257 xterm-fg-1">a</span>');
            });
            it('should correctly invert default bg color', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg |= 16777216 | 1 | 67108864;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span class="xterm-bg-1 xterm-fg-257">a</span>');
            });
            it('should turn bold fg text bright', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg |= 134217728 | 16777216;
                for (var i = 0; i < 8; i++) {
                    cell.fg &= ~255;
                    cell.fg |= i;
                    lineData.setCell(0, cell);
                    var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                    chai_1.assert.equal(getFragmentHtml(fragment), "<span class=\"xterm-bold xterm-fg-" + (i + 8) + "\">a</span>");
                }
            });
            it('should set style attribute for RBG', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg |= 50331648 | 1 << 16 | 2 << 8 | 3;
                cell.bg |= 50331648 | 4 << 16 | 5 << 8 | 6;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span style="color:rgb(1,2,3);background-color:rgb(4,5,6);">a</span>');
            });
            it('should correctly invert RGB colors', function () {
                var cell = BufferLine_1.CellData.fromCharData([0, 'a', 1, 'a'.charCodeAt(0)]);
                cell.fg |= 50331648 | 1 << 16 | 2 << 8 | 3 | 67108864;
                cell.bg |= 50331648 | 4 << 16 | 5 << 8 | 6;
                lineData.setCell(0, cell);
                var fragment = rowFactory.createRow(lineData, false, undefined, 0, false, 5, 20);
                chai_1.assert.equal(getFragmentHtml(fragment), '<span style="background-color:rgb(1,2,3);color:rgb(4,5,6);">a</span>');
            });
        });
    });
    function getFragmentHtml(fragment) {
        var element = dom.window.document.createElement('div');
        element.appendChild(fragment);
        return element.innerHTML;
    }
    function createEmptyLineData(cols) {
        var lineData = new BufferLine_1.BufferLine(cols);
        for (var i = 0; i < cols; i++) {
            lineData.setCell(i, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]));
        }
        return lineData;
    }
});
//# sourceMappingURL=DomRendererRowFactory.test.js.map