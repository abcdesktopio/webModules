"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var BufferLine_1 = require("./BufferLine");
var BufferReflow_1 = require("./BufferReflow");
var Buffer_1 = require("./Buffer");
describe('BufferReflow', function () {
    describe('reflowSmallerGetNewLineLengths', function () {
        it('should return correct line lengths for a small line with wide characters', function () {
            var line = new BufferLine_1.BufferLine(4);
            line.set(0, [null, '汉', 2, '汉'.charCodeAt(0)]);
            line.set(1, [null, '', 0, undefined]);
            line.set(2, [null, '语', 2, '语'.charCodeAt(0)]);
            line.set(3, [null, '', 0, undefined]);
            chai_1.assert.equal(line.translateToString(true), '汉语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 4, 3), [2, 2], 'line: 汉, 语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 4, 2), [2, 2], 'line: 汉, 语');
        });
        it('should return correct line lengths for a large line with wide characters', function () {
            var line = new BufferLine_1.BufferLine(12);
            for (var i = 0; i < 12; i += 4) {
                line.set(i, [null, '汉', 2, '汉'.charCodeAt(0)]);
                line.set(i + 2, [null, '语', 2, '语'.charCodeAt(0)]);
            }
            for (var i = 1; i < 12; i += 2) {
                line.set(i, [null, '', 0, undefined]);
                line.set(i, [null, '', 0, undefined]);
            }
            chai_1.assert.equal(line.translateToString(), '汉语汉语汉语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 11), [10, 2], 'line: 汉语汉语汉, 语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 10), [10, 2], 'line: 汉语汉语汉, 语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 9), [8, 4], 'line: 汉语汉语, 汉语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 8), [8, 4], 'line: 汉语汉语, 汉语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 7), [6, 6], 'line: 汉语汉, 语汉语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 6), [6, 6], 'line: 汉语汉, 语汉语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 5), [4, 4, 4], 'line: 汉语, 汉语, 汉语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 4), [4, 4, 4], 'line: 汉语, 汉语, 汉语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 3), [2, 2, 2, 2, 2, 2], 'line: 汉, 语, 汉, 语, 汉, 语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 12, 2), [2, 2, 2, 2, 2, 2], 'line: 汉, 语, 汉, 语, 汉, 语');
        });
        it('should return correct line lengths for a string with wide and single characters', function () {
            var line = new BufferLine_1.BufferLine(6);
            line.set(0, [null, 'a', 1, 'a'.charCodeAt(0)]);
            line.set(1, [null, '汉', 2, '汉'.charCodeAt(0)]);
            line.set(2, [null, '', 0, undefined]);
            line.set(3, [null, '语', 2, '语'.charCodeAt(0)]);
            line.set(4, [null, '', 0, undefined]);
            line.set(5, [null, 'b', 1, 'b'.charCodeAt(0)]);
            chai_1.assert.equal(line.translateToString(), 'a汉语b');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 6, 5), [5, 1], 'line: a汉语b');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 6, 4), [3, 3], 'line: a汉, 语b');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 6, 3), [3, 3], 'line: a汉, 语b');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 6, 2), [1, 2, 2, 1], 'line: a, 汉, 语, b');
        });
        it('should return correct line lengths for a wrapped line with wide and single characters', function () {
            var line1 = new BufferLine_1.BufferLine(6);
            line1.set(0, [null, 'a', 1, 'a'.charCodeAt(0)]);
            line1.set(1, [null, '汉', 2, '汉'.charCodeAt(0)]);
            line1.set(2, [null, '', 0, undefined]);
            line1.set(3, [null, '语', 2, '语'.charCodeAt(0)]);
            line1.set(4, [null, '', 0, undefined]);
            line1.set(5, [null, 'b', 1, 'b'.charCodeAt(0)]);
            var line2 = new BufferLine_1.BufferLine(6, undefined, true);
            line2.set(0, [null, 'a', 1, 'a'.charCodeAt(0)]);
            line2.set(1, [null, '汉', 2, '汉'.charCodeAt(0)]);
            line2.set(2, [null, '', 0, undefined]);
            line2.set(3, [null, '语', 2, '语'.charCodeAt(0)]);
            line2.set(4, [null, '', 0, undefined]);
            line2.set(5, [null, 'b', 1, 'b'.charCodeAt(0)]);
            chai_1.assert.equal(line1.translateToString(), 'a汉语b');
            chai_1.assert.equal(line2.translateToString(), 'a汉语b');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line1, line2], 6, 5), [5, 4, 3], 'lines: a汉语, ba汉, 语b');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line1, line2], 6, 4), [3, 4, 4, 1], 'lines: a汉, 语ba, 汉语, b');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line1, line2], 6, 3), [3, 3, 3, 3], 'lines: a汉, 语b, a汉, 语b');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line1, line2], 6, 2), [1, 2, 2, 2, 2, 2, 1], 'lines: a, 汉, 语, ba, 汉, 语, b');
        });
        it('should work on lines ending in null space', function () {
            var line = new BufferLine_1.BufferLine(5);
            line.set(0, [null, '汉', 2, '汉'.charCodeAt(0)]);
            line.set(1, [null, '', 0, undefined]);
            line.set(2, [null, '语', 2, '语'.charCodeAt(0)]);
            line.set(3, [null, '', 0, undefined]);
            line.set(4, [null, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
            chai_1.assert.equal(line.translateToString(true), '汉语');
            chai_1.assert.equal(line.translateToString(false), '汉语 ');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 4, 3), [2, 2], 'line: 汉, 语');
            chai_1.assert.deepEqual(BufferReflow_1.reflowSmallerGetNewLineLengths([line], 4, 2), [2, 2], 'line: 汉, 语');
        });
    });
});
//# sourceMappingURL=BufferReflow.test.js.map