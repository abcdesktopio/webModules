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
var chai = require("chai");
var BufferLine_1 = require("./BufferLine");
var Buffer_1 = require("./Buffer");
var TestBufferLine = (function (_super) {
    __extends(TestBufferLine, _super);
    function TestBufferLine() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TestBufferLine.prototype, "combined", {
        get: function () {
            return this._combined;
        },
        enumerable: true,
        configurable: true
    });
    TestBufferLine.prototype.toArray = function () {
        var result = [];
        for (var i = 0; i < this.length; ++i) {
            result.push(this.loadCell(i, new BufferLine_1.CellData()).getAsCharData());
        }
        return result;
    };
    return TestBufferLine;
}(BufferLine_1.BufferLine));
describe('CellData', function () {
    it('CharData <--> CellData equality', function () {
        var cell = new BufferLine_1.CellData();
        cell.setFromCharData([123, 'a', 1, 'a'.charCodeAt(0)]);
        chai.assert.deepEqual(cell.getAsCharData(), [123, 'a', 1, 'a'.charCodeAt(0)]);
        chai.assert.equal(cell.isCombined(), 0);
        cell.setFromCharData([123, 'e\u0301', 1, '\u0301'.charCodeAt(0)]);
        chai.assert.deepEqual(cell.getAsCharData(), [123, 'e\u0301', 1, '\u0301'.charCodeAt(0)]);
        chai.assert.equal(cell.isCombined(), 2097152);
        cell.setFromCharData([123, '𝄞', 1, 0x1D11E]);
        chai.assert.deepEqual(cell.getAsCharData(), [123, '𝄞', 1, 0x1D11E]);
        chai.assert.equal(cell.isCombined(), 0);
        cell.setFromCharData([123, '𓂀\u0301', 1, '𓂀\u0301'.charCodeAt(2)]);
        chai.assert.deepEqual(cell.getAsCharData(), [123, '𓂀\u0301', 1, '𓂀\u0301'.charCodeAt(2)]);
        chai.assert.equal(cell.isCombined(), 2097152);
        cell.setFromCharData([123, '１', 2, '１'.charCodeAt(0)]);
        chai.assert.deepEqual(cell.getAsCharData(), [123, '１', 2, '１'.charCodeAt(0)]);
        chai.assert.equal(cell.isCombined(), 0);
    });
});
describe('BufferLine', function () {
    it('ctor', function () {
        var line = new TestBufferLine(0);
        chai.expect(line.length).equals(0);
        chai.expect(line.isWrapped).equals(false);
        line = new TestBufferLine(10);
        chai.expect(line.length).equals(10);
        chai.expect(line.loadCell(0, new BufferLine_1.CellData()).getAsCharData()).eql([0, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
        chai.expect(line.isWrapped).equals(false);
        line = new TestBufferLine(10, null, true);
        chai.expect(line.length).equals(10);
        chai.expect(line.loadCell(0, new BufferLine_1.CellData()).getAsCharData()).eql([0, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
        chai.expect(line.isWrapped).equals(true);
        line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([123, 'a', 456, 'a'.charCodeAt(0)]), true);
        chai.expect(line.length).equals(10);
        chai.expect(line.loadCell(0, new BufferLine_1.CellData()).getAsCharData()).eql([123, 'a', 456, 'a'.charCodeAt(0)]);
        chai.expect(line.isWrapped).equals(true);
    });
    it('insertCells', function () {
        var line = new TestBufferLine(3);
        line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
        line.setCell(1, BufferLine_1.CellData.fromCharData([2, 'b', 0, 'b'.charCodeAt(0)]));
        line.setCell(2, BufferLine_1.CellData.fromCharData([3, 'c', 0, 'c'.charCodeAt(0)]));
        line.insertCells(1, 3, BufferLine_1.CellData.fromCharData([4, 'd', 0, 'd'.charCodeAt(0)]));
        chai.expect(line.toArray()).eql([
            [1, 'a', 0, 'a'.charCodeAt(0)],
            [4, 'd', 0, 'd'.charCodeAt(0)],
            [4, 'd', 0, 'd'.charCodeAt(0)]
        ]);
    });
    it('deleteCells', function () {
        var line = new TestBufferLine(5);
        line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
        line.setCell(1, BufferLine_1.CellData.fromCharData([2, 'b', 0, 'b'.charCodeAt(0)]));
        line.setCell(2, BufferLine_1.CellData.fromCharData([3, 'c', 0, 'c'.charCodeAt(0)]));
        line.setCell(3, BufferLine_1.CellData.fromCharData([4, 'd', 0, 'd'.charCodeAt(0)]));
        line.setCell(4, BufferLine_1.CellData.fromCharData([5, 'e', 0, 'e'.charCodeAt(0)]));
        line.deleteCells(1, 2, BufferLine_1.CellData.fromCharData([6, 'f', 0, 'f'.charCodeAt(0)]));
        chai.expect(line.toArray()).eql([
            [1, 'a', 0, 'a'.charCodeAt(0)],
            [4, 'd', 0, 'd'.charCodeAt(0)],
            [5, 'e', 0, 'e'.charCodeAt(0)],
            [6, 'f', 0, 'f'.charCodeAt(0)],
            [6, 'f', 0, 'f'.charCodeAt(0)]
        ]);
    });
    it('replaceCells', function () {
        var line = new TestBufferLine(5);
        line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
        line.setCell(1, BufferLine_1.CellData.fromCharData([2, 'b', 0, 'b'.charCodeAt(0)]));
        line.setCell(2, BufferLine_1.CellData.fromCharData([3, 'c', 0, 'c'.charCodeAt(0)]));
        line.setCell(3, BufferLine_1.CellData.fromCharData([4, 'd', 0, 'd'.charCodeAt(0)]));
        line.setCell(4, BufferLine_1.CellData.fromCharData([5, 'e', 0, 'e'.charCodeAt(0)]));
        line.replaceCells(2, 4, BufferLine_1.CellData.fromCharData([6, 'f', 0, 'f'.charCodeAt(0)]));
        chai.expect(line.toArray()).eql([
            [1, 'a', 0, 'a'.charCodeAt(0)],
            [2, 'b', 0, 'b'.charCodeAt(0)],
            [6, 'f', 0, 'f'.charCodeAt(0)],
            [6, 'f', 0, 'f'.charCodeAt(0)],
            [5, 'e', 0, 'e'.charCodeAt(0)]
        ]);
    });
    it('fill', function () {
        var line = new TestBufferLine(5);
        line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
        line.setCell(1, BufferLine_1.CellData.fromCharData([2, 'b', 0, 'b'.charCodeAt(0)]));
        line.setCell(2, BufferLine_1.CellData.fromCharData([3, 'c', 0, 'c'.charCodeAt(0)]));
        line.setCell(3, BufferLine_1.CellData.fromCharData([4, 'd', 0, 'd'.charCodeAt(0)]));
        line.setCell(4, BufferLine_1.CellData.fromCharData([5, 'e', 0, 'e'.charCodeAt(0)]));
        line.fill(BufferLine_1.CellData.fromCharData([123, 'z', 0, 'z'.charCodeAt(0)]));
        chai.expect(line.toArray()).eql([
            [123, 'z', 0, 'z'.charCodeAt(0)],
            [123, 'z', 0, 'z'.charCodeAt(0)],
            [123, 'z', 0, 'z'.charCodeAt(0)],
            [123, 'z', 0, 'z'.charCodeAt(0)],
            [123, 'z', 0, 'z'.charCodeAt(0)]
        ]);
    });
    it('clone', function () {
        var line = new TestBufferLine(5, null, true);
        line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
        line.setCell(1, BufferLine_1.CellData.fromCharData([2, 'b', 0, 'b'.charCodeAt(0)]));
        line.setCell(2, BufferLine_1.CellData.fromCharData([3, 'c', 0, 'c'.charCodeAt(0)]));
        line.setCell(3, BufferLine_1.CellData.fromCharData([4, 'd', 0, 'd'.charCodeAt(0)]));
        line.setCell(4, BufferLine_1.CellData.fromCharData([5, 'e', 0, 'e'.charCodeAt(0)]));
        var line2 = line.clone();
        chai.expect(TestBufferLine.prototype.toArray.apply(line2)).eql(line.toArray());
        chai.expect(line2.length).equals(line.length);
        chai.expect(line2.isWrapped).equals(line.isWrapped);
    });
    it('copyFrom', function () {
        var line = new TestBufferLine(5);
        line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
        line.setCell(1, BufferLine_1.CellData.fromCharData([2, 'b', 0, 'b'.charCodeAt(0)]));
        line.setCell(2, BufferLine_1.CellData.fromCharData([3, 'c', 0, 'c'.charCodeAt(0)]));
        line.setCell(3, BufferLine_1.CellData.fromCharData([4, 'd', 0, 'd'.charCodeAt(0)]));
        line.setCell(4, BufferLine_1.CellData.fromCharData([5, 'e', 0, 'e'.charCodeAt(0)]));
        var line2 = new TestBufferLine(5, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]), true);
        line2.copyFrom(line);
        chai.expect(line2.toArray()).eql(line.toArray());
        chai.expect(line2.length).equals(line.length);
        chai.expect(line2.isWrapped).equals(line.isWrapped);
    });
    it('should support combining chars', function () {
        var line = new TestBufferLine(2, BufferLine_1.CellData.fromCharData([1, 'e\u0301', 0, '\u0301'.charCodeAt(0)]));
        chai.expect(line.toArray()).eql([[1, 'e\u0301', 0, '\u0301'.charCodeAt(0)], [1, 'e\u0301', 0, '\u0301'.charCodeAt(0)]]);
        var line2 = new TestBufferLine(5, BufferLine_1.CellData.fromCharData([1, 'a', 0, '\u0301'.charCodeAt(0)]), true);
        line2.copyFrom(line);
        chai.expect(line2.toArray()).eql(line.toArray());
        var line3 = line.clone();
        chai.expect(TestBufferLine.prototype.toArray.apply(line3)).eql(line.toArray());
    });
    describe('resize', function () {
        it('enlarge(false)', function () {
            var line = new TestBufferLine(5, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]), false);
            line.resize(10, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
            chai.expect(line.toArray()).eql(Array(10).fill([1, 'a', 0, 'a'.charCodeAt(0)]));
        });
        it('enlarge(true)', function () {
            var line = new TestBufferLine(5, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]), false);
            line.resize(10, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
            chai.expect(line.toArray()).eql(Array(10).fill([1, 'a', 0, 'a'.charCodeAt(0)]));
        });
        it('shrink(true) - should apply new size', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]), false);
            line.resize(5, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
            chai.expect(line.toArray()).eql(Array(5).fill([1, 'a', 0, 'a'.charCodeAt(0)]));
        });
        it('shrink to 0 length', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]), false);
            line.resize(0, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
            chai.expect(line.toArray()).eql(Array(0).fill([1, 'a', 0, 'a'.charCodeAt(0)]));
        });
        it('should remove combining data on replaced cells after shrinking then enlarging', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]), false);
            line.set(2, [null, '😁', 1, '😁'.charCodeAt(0)]);
            line.set(9, [null, '😁', 1, '😁'.charCodeAt(0)]);
            chai.expect(line.translateToString()).eql('aa😁aaaaaa😁');
            chai.expect(Object.keys(line.combined).length).eql(2);
            line.resize(5, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
            chai.expect(line.translateToString()).eql('aa😁aa');
            line.resize(10, BufferLine_1.CellData.fromCharData([1, 'a', 0, 'a'.charCodeAt(0)]));
            chai.expect(line.translateToString()).eql('aa😁aaaaaaa');
            chai.expect(Object.keys(line.combined).length).eql(1);
        });
    });
    describe('getTrimLength', function () {
        it('empty line', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            chai.expect(line.getTrimmedLength()).equal(0);
        });
        it('ASCII', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            chai.expect(line.getTrimmedLength()).equal(3);
        });
        it('surrogate', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, '𝄞', 1, '𝄞'.charCodeAt(0)]));
            chai.expect(line.getTrimmedLength()).equal(3);
        });
        it('combining', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, 'e\u0301', 1, '\u0301'.charCodeAt(0)]));
            chai.expect(line.getTrimmedLength()).equal(3);
        });
        it('fullwidth', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, '１', 2, '１'.charCodeAt(0)]));
            line.setCell(3, BufferLine_1.CellData.fromCharData([0, '', 0, undefined]));
            chai.expect(line.getTrimmedLength()).equal(4);
        });
    });
    describe('translateToString with and w\'o trimming', function () {
        it('empty line', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            chai.expect(line.translateToString(false)).equal('          ');
            chai.expect(line.translateToString(true)).equal('');
        });
        it('ASCII', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(4, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(5, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            chai.expect(line.translateToString(false)).equal('a a aa    ');
            chai.expect(line.translateToString(true)).equal('a a aa');
            chai.expect(line.translateToString(false, 0, 5)).equal('a a a');
            chai.expect(line.translateToString(false, 0, 4)).equal('a a ');
            chai.expect(line.translateToString(false, 0, 3)).equal('a a');
            chai.expect(line.translateToString(true, 0, 5)).equal('a a a');
            chai.expect(line.translateToString(true, 0, 4)).equal('a a ');
            chai.expect(line.translateToString(true, 0, 3)).equal('a a');
        });
        it('surrogate', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, '𝄞', 1, '𝄞'.charCodeAt(0)]));
            line.setCell(4, BufferLine_1.CellData.fromCharData([1, '𝄞', 1, '𝄞'.charCodeAt(0)]));
            line.setCell(5, BufferLine_1.CellData.fromCharData([1, '𝄞', 1, '𝄞'.charCodeAt(0)]));
            chai.expect(line.translateToString(false)).equal('a 𝄞 𝄞𝄞    ');
            chai.expect(line.translateToString(true)).equal('a 𝄞 𝄞𝄞');
            chai.expect(line.translateToString(false, 0, 5)).equal('a 𝄞 𝄞');
            chai.expect(line.translateToString(false, 0, 4)).equal('a 𝄞 ');
            chai.expect(line.translateToString(false, 0, 3)).equal('a 𝄞');
            chai.expect(line.translateToString(true, 0, 5)).equal('a 𝄞 𝄞');
            chai.expect(line.translateToString(true, 0, 4)).equal('a 𝄞 ');
            chai.expect(line.translateToString(true, 0, 3)).equal('a 𝄞');
        });
        it('combining', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, 'e\u0301', 1, '\u0301'.charCodeAt(0)]));
            line.setCell(4, BufferLine_1.CellData.fromCharData([1, 'e\u0301', 1, '\u0301'.charCodeAt(0)]));
            line.setCell(5, BufferLine_1.CellData.fromCharData([1, 'e\u0301', 1, '\u0301'.charCodeAt(0)]));
            chai.expect(line.translateToString(false)).equal('a e\u0301 e\u0301e\u0301    ');
            chai.expect(line.translateToString(true)).equal('a e\u0301 e\u0301e\u0301');
            chai.expect(line.translateToString(false, 0, 5)).equal('a e\u0301 e\u0301');
            chai.expect(line.translateToString(false, 0, 4)).equal('a e\u0301 ');
            chai.expect(line.translateToString(false, 0, 3)).equal('a e\u0301');
            chai.expect(line.translateToString(true, 0, 5)).equal('a e\u0301 e\u0301');
            chai.expect(line.translateToString(true, 0, 4)).equal('a e\u0301 ');
            chai.expect(line.translateToString(true, 0, 3)).equal('a e\u0301');
        });
        it('fullwidth', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, '１', 2, '１'.charCodeAt(0)]));
            line.setCell(3, BufferLine_1.CellData.fromCharData([0, '', 0, undefined]));
            line.setCell(5, BufferLine_1.CellData.fromCharData([1, '１', 2, '１'.charCodeAt(0)]));
            line.setCell(6, BufferLine_1.CellData.fromCharData([0, '', 0, undefined]));
            line.setCell(7, BufferLine_1.CellData.fromCharData([1, '１', 2, '１'.charCodeAt(0)]));
            line.setCell(8, BufferLine_1.CellData.fromCharData([0, '', 0, undefined]));
            chai.expect(line.translateToString(false)).equal('a １ １１ ');
            chai.expect(line.translateToString(true)).equal('a １ １１');
            chai.expect(line.translateToString(false, 0, 7)).equal('a １ １');
            chai.expect(line.translateToString(false, 0, 6)).equal('a １ １');
            chai.expect(line.translateToString(false, 0, 5)).equal('a １ ');
            chai.expect(line.translateToString(false, 0, 4)).equal('a １');
            chai.expect(line.translateToString(false, 0, 3)).equal('a １');
            chai.expect(line.translateToString(false, 0, 2)).equal('a ');
            chai.expect(line.translateToString(true, 0, 7)).equal('a １ １');
            chai.expect(line.translateToString(true, 0, 6)).equal('a １ １');
            chai.expect(line.translateToString(true, 0, 5)).equal('a １ ');
            chai.expect(line.translateToString(true, 0, 4)).equal('a １');
            chai.expect(line.translateToString(true, 0, 3)).equal('a １');
            chai.expect(line.translateToString(true, 0, 2)).equal('a ');
        });
        it('space at end', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(2, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(4, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(5, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            line.setCell(6, BufferLine_1.CellData.fromCharData([1, ' ', 1, ' '.charCodeAt(0)]));
            chai.expect(line.translateToString(false)).equal('a a aa    ');
            chai.expect(line.translateToString(true)).equal('a a aa ');
        });
        it('should always return some sane value', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, 0, Buffer_1.NULL_CELL_CODE]), false);
            chai.expect(line.translateToString(false)).equal('          ');
            chai.expect(line.translateToString(true)).equal('');
        });
        it('should work with endCol=0', function () {
            var line = new TestBufferLine(10, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, 0, Buffer_1.NULL_CELL_CODE]), false);
            line.setCell(0, BufferLine_1.CellData.fromCharData([1, 'a', 1, 'a'.charCodeAt(0)]));
            chai.expect(line.translateToString(true, 0, 0)).equal('');
        });
    });
    describe('addCharToCell', function () {
        it('should set width to 1 for empty cell', function () {
            var line = new TestBufferLine(3, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            line.addCodepointToCell(0, '\u0301'.charCodeAt(0));
            var cell = line.loadCell(0, new BufferLine_1.CellData());
            chai.assert.deepEqual(cell.getAsCharData(), [Buffer_1.DEFAULT_ATTR, '\u0301', 1, 0x0301]);
            chai.assert.equal(cell.isCombined(), 0);
        });
        it('should add char to combining string in cell', function () {
            var line = new TestBufferLine(3, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            var cell = line.loadCell(0, new BufferLine_1.CellData());
            cell.setFromCharData([123, 'e\u0301', 1, 'e\u0301'.charCodeAt(1)]);
            line.setCell(0, cell);
            line.addCodepointToCell(0, '\u0301'.charCodeAt(0));
            line.loadCell(0, cell);
            chai.assert.deepEqual(cell.getAsCharData(), [123, 'e\u0301\u0301', 1, 0x0301]);
            chai.assert.equal(cell.isCombined(), 2097152);
        });
        it('should create combining string on taken cell', function () {
            var line = new TestBufferLine(3, BufferLine_1.CellData.fromCharData([Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]), false);
            var cell = line.loadCell(0, new BufferLine_1.CellData());
            cell.setFromCharData([123, 'e', 1, 'e'.charCodeAt(1)]);
            line.setCell(0, cell);
            line.addCodepointToCell(0, '\u0301'.charCodeAt(0));
            line.loadCell(0, cell);
            chai.assert.deepEqual(cell.getAsCharData(), [123, 'e\u0301', 1, 0x0301]);
            chai.assert.equal(cell.isCombined(), 2097152);
        });
    });
});
//# sourceMappingURL=BufferLine.test.js.map