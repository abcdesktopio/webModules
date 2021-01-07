"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var TypedArrayUtils_1 = require("./TypedArrayUtils");
function deepEquals(a, b) {
    chai_1.assert.equal(a.length, b.length);
    for (var i = 0; i < a.length; ++i) {
        chai_1.assert.equal(a[i], b[i]);
    }
}
describe('polyfill conformance tests', function () {
    describe('TypedArray.fill', function () {
        it('should work with all typed array types', function () {
            var u81 = new Uint8Array(5);
            var u82 = new Uint8Array(5);
            deepEquals(TypedArrayUtils_1.fillFallback(u81, 2), u82.fill(2));
            deepEquals(TypedArrayUtils_1.fillFallback(u81, -1), u82.fill(-1));
            var u161 = new Uint16Array(5);
            var u162 = new Uint16Array(5);
            deepEquals(TypedArrayUtils_1.fillFallback(u161, 2), u162.fill(2));
            deepEquals(TypedArrayUtils_1.fillFallback(u161, 65535), u162.fill(65535));
            deepEquals(TypedArrayUtils_1.fillFallback(u161, -1), u162.fill(-1));
            var u321 = new Uint32Array(5);
            var u322 = new Uint32Array(5);
            deepEquals(TypedArrayUtils_1.fillFallback(u321, 2), u322.fill(2));
            deepEquals(TypedArrayUtils_1.fillFallback(u321, 65537), u322.fill(65537));
            deepEquals(TypedArrayUtils_1.fillFallback(u321, -1), u322.fill(-1));
            var i81 = new Int8Array(5);
            var i82 = new Int8Array(5);
            deepEquals(TypedArrayUtils_1.fillFallback(i81, 2), i82.fill(2));
            deepEquals(TypedArrayUtils_1.fillFallback(i81, -1), i82.fill(-1));
            var i161 = new Int16Array(5);
            var i162 = new Int16Array(5);
            deepEquals(TypedArrayUtils_1.fillFallback(i161, 2), i162.fill(2));
            deepEquals(TypedArrayUtils_1.fillFallback(i161, 65535), i162.fill(65535));
            deepEquals(TypedArrayUtils_1.fillFallback(i161, -1), i162.fill(-1));
            var i321 = new Int32Array(5);
            var i322 = new Int32Array(5);
            deepEquals(TypedArrayUtils_1.fillFallback(i321, 2), i322.fill(2));
            deepEquals(TypedArrayUtils_1.fillFallback(i321, 65537), i322.fill(65537));
            deepEquals(TypedArrayUtils_1.fillFallback(i321, -1), i322.fill(-1));
            var f321 = new Float32Array(5);
            var f322 = new Float32Array(5);
            deepEquals(TypedArrayUtils_1.fillFallback(f321, 1.2345), f322.fill(1.2345));
            var f641 = new Float64Array(5);
            var f642 = new Float64Array(5);
            deepEquals(TypedArrayUtils_1.fillFallback(f641, 1.2345), f642.fill(1.2345));
            var u8Clamped1 = new Uint8ClampedArray(5);
            var u8Clamped2 = new Uint8ClampedArray(5);
            deepEquals(TypedArrayUtils_1.fillFallback(u8Clamped1, 2), u8Clamped2.fill(2));
            deepEquals(TypedArrayUtils_1.fillFallback(u8Clamped1, 257), u8Clamped2.fill(257));
        });
        it('start offset', function () {
            for (var i = -2; i < 10; ++i) {
                var u81 = new Uint8Array(5);
                var u83 = new Uint8Array(5);
                deepEquals(TypedArrayUtils_1.fillFallback(u81, 2, i), u83.fill(2, i));
                deepEquals(TypedArrayUtils_1.fillFallback(u81, -1, i), u83.fill(-1, i));
            }
        });
        it('end offset', function () {
            for (var i = -2; i < 10; ++i) {
                var u81 = new Uint8Array(5);
                var u83 = new Uint8Array(5);
                deepEquals(TypedArrayUtils_1.fillFallback(u81, 2, 0, i), u83.fill(2, 0, i));
                deepEquals(TypedArrayUtils_1.fillFallback(u81, -1, 0, i), u83.fill(-1, 0, i));
            }
        });
        it('start/end offset', function () {
            for (var i = -2; i < 10; ++i) {
                for (var j = -2; j < 10; ++j) {
                    var u81 = new Uint8Array(5);
                    var u83 = new Uint8Array(5);
                    deepEquals(TypedArrayUtils_1.fillFallback(u81, 2, i, j), u83.fill(2, i, j));
                    deepEquals(TypedArrayUtils_1.fillFallback(u81, -1, i, j), u83.fill(-1, i, j));
                }
            }
        });
    });
});
describe('typed array convenience functions', function () {
    it('concat', function () {
        var a = new Uint8Array([1, 2, 3, 4, 5]);
        var b = new Uint8Array([6, 7, 8, 9, 0]);
        var merged = TypedArrayUtils_1.concat(a, b);
        deepEquals(merged, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]));
    });
});
//# sourceMappingURL=TypedArrayUtils.test.js.map