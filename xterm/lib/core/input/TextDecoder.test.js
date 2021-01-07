"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var TextDecoder_1 = require("./TextDecoder");
describe('text encodings', function () {
    it('stringFromCodePoint/utf32ToString', function () {
        var s = 'abcdefg';
        var data = new Uint32Array(s.length);
        for (var i = 0; i < s.length; ++i) {
            data[i] = s.charCodeAt(i);
            chai_1.assert.equal(TextDecoder_1.stringFromCodePoint(data[i]), s[i]);
        }
        chai_1.assert.equal(TextDecoder_1.utf32ToString(data), s);
    });
    describe('StringToUtf32 Decoder', function () {
        describe('full codepoint test', function () {
            it('0..65535', function () {
                var decoder = new TextDecoder_1.StringToUtf32();
                var target = new Uint32Array(5);
                for (var i = 0; i < 65536; ++i) {
                    if (i >= 0xD800 && i <= 0xDFFF) {
                        continue;
                    }
                    var length_1 = decoder.decode(String.fromCharCode(i), target);
                    chai_1.assert.equal(length_1, 1);
                    chai_1.assert.equal(target[0], i);
                    chai_1.assert.equal(TextDecoder_1.utf32ToString(target, 0, length_1), String.fromCharCode(i));
                    decoder.clear();
                }
            });
            it('65536..0x10FFFF (surrogates)', function () {
                this.timeout(20000);
                var decoder = new TextDecoder_1.StringToUtf32();
                var target = new Uint32Array(5);
                for (var i = 65536; i < 0x10FFFF; ++i) {
                    var codePoint = i - 0x10000;
                    var s = String.fromCharCode((codePoint >> 10) + 0xD800) + String.fromCharCode((codePoint % 0x400) + 0xDC00);
                    var length_2 = decoder.decode(s, target);
                    chai_1.assert.equal(length_2, 1);
                    chai_1.assert.equal(target[0], i);
                    chai_1.assert.equal(TextDecoder_1.utf32ToString(target, 0, length_2), s);
                    decoder.clear();
                }
            });
        });
        describe('stream handling', function () {
            it('surrogates mixed advance by 1', function () {
                var decoder = new TextDecoder_1.StringToUtf32();
                var target = new Uint32Array(5);
                var input = 'Ä€𝄞Ö𝄞€Ü𝄞€';
                var decoded = '';
                for (var i = 0; i < input.length; ++i) {
                    var written = decoder.decode(input[i], target);
                    decoded += TextDecoder_1.utf32ToString(target, written);
                }
                chai_1.assert(decoded, 'Ä€𝄞Ö𝄞€Ü𝄞€');
            });
        });
    });
});
//# sourceMappingURL=TextDecoder.test.js.map