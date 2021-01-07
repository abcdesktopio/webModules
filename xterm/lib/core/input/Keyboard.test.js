"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var Keyboard_1 = require("./Keyboard");
function testEvaluateKeyboardEvent(partialEvent, partialOptions) {
    if (partialOptions === void 0) { partialOptions = {}; }
    var event = {
        altKey: partialEvent.altKey || false,
        ctrlKey: partialEvent.ctrlKey || false,
        shiftKey: partialEvent.shiftKey || false,
        metaKey: partialEvent.metaKey || false,
        keyCode: partialEvent.keyCode !== undefined ? partialEvent.keyCode : 0,
        key: partialEvent.key || '',
        type: partialEvent.type || ''
    };
    var options = {
        applicationCursorMode: partialOptions.applicationCursorMode || false,
        isMac: partialOptions.isMac || false,
        macOptionIsMeta: partialOptions.macOptionIsMeta || false
    };
    return Keyboard_1.evaluateKeyboardEvent(event, options.applicationCursorMode, options.isMac, options.macOptionIsMeta);
}
describe('Keyboard', function () {
    describe('evaluateKeyEscapeSequence', function () {
        it('should return the correct escape sequence for unmodified keys', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 8 }).key, '\x7f');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 9 }).key, '\t');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 13 }).key, '\r');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 27 }).key, '\x1b');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 33 }).key, '\x1b[5~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 34 }).key, '\x1b[6~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 35 }).key, '\x1b[F');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 36 }).key, '\x1b[H');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 37 }).key, '\x1b[D');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 38 }).key, '\x1b[A');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 39 }).key, '\x1b[C');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 40 }).key, '\x1b[B');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 45 }).key, '\x1b[2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 46 }).key, '\x1b[3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 112 }).key, '\x1bOP');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 113 }).key, '\x1bOQ');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 114 }).key, '\x1bOR');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 115 }).key, '\x1bOS');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 116 }).key, '\x1b[15~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 117 }).key, '\x1b[17~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 118 }).key, '\x1b[18~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 119 }).key, '\x1b[19~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 120 }).key, '\x1b[20~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 121 }).key, '\x1b[21~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 122 }).key, '\x1b[23~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 123 }).key, '\x1b[24~');
        });
        it('should return \\x1b[3;5~ for ctrl+delete', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 46 }).key, '\x1b[3;5~');
        });
        it('should return \\x1b[3;2~ for shift+delete', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 46 }).key, '\x1b[3;2~');
        });
        it('should return \\x1b[3;3~ for alt+delete', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 46 }).key, '\x1b[3;3~');
        });
        it('should return \\x1b[5D for ctrl+left', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 37 }).key, '\x1b[1;5D');
        });
        it('should return \\x1b[5C for ctrl+right', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 39 }).key, '\x1b[1;5C');
        });
        it('should return \\x1b[5A for ctrl+up', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 38 }).key, '\x1b[1;5A');
        });
        it('should return \\x1b[5B for ctrl+down', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 40 }).key, '\x1b[1;5B');
        });
        describe('On non-macOS platforms', function () {
            it('should return \\x1b[5D for alt+left', function () {
                chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 37 }, { isMac: false }).key, '\x1b[1;5D');
            });
            it('should return \\x1b[5C for alt+right', function () {
                chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 39 }, { isMac: false }).key, '\x1b[1;5C');
            });
            it('should return \\x1ba for alt+a', function () {
                chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 65 }, { isMac: false }).key, '\x1ba');
            });
        });
        describe('On macOS platforms', function () {
            it('should return \\x1bb for alt+left', function () {
                chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 37 }, { isMac: true }).key, '\x1bb');
            });
            it('should return \\x1bf for alt+right', function () {
                chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 39 }, { isMac: true }).key, '\x1bf');
            });
            it('should return undefined for alt+a', function () {
                chai_1.assert.strictEqual(testEvaluateKeyboardEvent({ altKey: true, keyCode: 65 }, { isMac: true }).key, undefined), { isMac: true };
            });
        });
        describe('with macOptionIsMeta', function () {
            it('should return \\x1ba for alt+a', function () {
                chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 65 }, { isMac: true, macOptionIsMeta: true }).key, '\x1ba');
            });
        });
        it('should return \\x1b[5A for alt+up', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 38 }).key, '\x1b[1;5A');
        });
        it('should return \\x1b[5B for alt+down', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 40 }).key, '\x1b[1;5B');
        });
        it('should return the correct escape sequence for modified F1-F12 keys', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 112 }).key, '\x1b[1;2P');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 113 }).key, '\x1b[1;2Q');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 114 }).key, '\x1b[1;2R');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 115 }).key, '\x1b[1;2S');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 116 }).key, '\x1b[15;2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 117 }).key, '\x1b[17;2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 118 }).key, '\x1b[18;2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 119 }).key, '\x1b[19;2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 120 }).key, '\x1b[20;2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 121 }).key, '\x1b[21;2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 122 }).key, '\x1b[23;2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 123 }).key, '\x1b[24;2~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 112 }).key, '\x1b[1;3P');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 113 }).key, '\x1b[1;3Q');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 114 }).key, '\x1b[1;3R');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 115 }).key, '\x1b[1;3S');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 116 }).key, '\x1b[15;3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 117 }).key, '\x1b[17;3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 118 }).key, '\x1b[18;3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 119 }).key, '\x1b[19;3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 120 }).key, '\x1b[20;3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 121 }).key, '\x1b[21;3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 122 }).key, '\x1b[23;3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, keyCode: 123 }).key, '\x1b[24;3~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 112 }).key, '\x1b[1;5P');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 113 }).key, '\x1b[1;5Q');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 114 }).key, '\x1b[1;5R');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 115 }).key, '\x1b[1;5S');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 116 }).key, '\x1b[15;5~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 117 }).key, '\x1b[17;5~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 118 }).key, '\x1b[18;5~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 119 }).key, '\x1b[19;5~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 120 }).key, '\x1b[20;5~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 121 }).key, '\x1b[21;5~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 122 }).key, '\x1b[23;5~');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ ctrlKey: true, keyCode: 123 }).key, '\x1b[24;5~');
        });
        it('should return proper sequence for ctrl+alt+a', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, ctrlKey: true, keyCode: 65 }).key, '\x1b\x01');
        });
        it('should return proper sequences for alt+0', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 48 }).key, '\x1b0');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 48 }).key, '\x1b)');
        });
        it('should return proper sequences for alt+1', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 49 }).key, '\x1b1');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 49 }).key, '\x1b!');
        });
        it('should return proper sequences for alt+2', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 50 }).key, '\x1b2');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 50 }).key, '\x1b@');
        });
        it('should return proper sequences for alt+3', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 51 }).key, '\x1b3');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 51 }).key, '\x1b#');
        });
        it('should return proper sequences for alt+4', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 52 }).key, '\x1b4');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 52 }).key, '\x1b$');
        });
        it('should return proper sequences for alt+5', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 53 }).key, '\x1b5');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 53 }).key, '\x1b%');
        });
        it('should return proper sequences for alt+6', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 54 }).key, '\x1b6');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 54 }).key, '\x1b^');
        });
        it('should return proper sequences for alt+7', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 55 }).key, '\x1b7');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 55 }).key, '\x1b&');
        });
        it('should return proper sequences for alt+8', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 56 }).key, '\x1b8');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 56 }).key, '\x1b*');
        });
        it('should return proper sequences for alt+9', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 57 }).key, '\x1b9');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 57 }).key, '\x1b(');
        });
        it('should return proper sequences for alt+;', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 186 }).key, '\x1b;');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 186 }).key, '\x1b:');
        });
        it('should return proper sequences for alt+=', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 187 }).key, '\x1b=');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 187 }).key, '\x1b+');
        });
        it('should return proper sequences for alt+,', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 188 }).key, '\x1b,');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 188 }).key, '\x1b<');
        });
        it('should return proper sequences for alt+-', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 189 }).key, '\x1b-');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 189 }).key, '\x1b_');
        });
        it('should return proper sequences for alt+.', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 190 }).key, '\x1b.');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 190 }).key, '\x1b>');
        });
        it('should return proper sequences for alt+/', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 191 }).key, '\x1b/');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 191 }).key, '\x1b?');
        });
        it('should return proper sequences for alt+~', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 192 }).key, '\x1b`');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 192 }).key, '\x1b~');
        });
        it('should return proper sequences for alt+[', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 219 }).key, '\x1b[');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 219 }).key, '\x1b{');
        });
        it('should return proper sequences for alt+\\', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 220 }).key, '\x1b\\');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 220 }).key, '\x1b|');
        });
        it('should return proper sequences for alt+]', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 221 }).key, '\x1b]');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 221 }).key, '\x1b}');
        });
        it('should return proper sequences for alt+\'', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: false, keyCode: 222 }).key, '\x1b\'');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ altKey: true, shiftKey: true, keyCode: 222 }).key, '\x1b"');
        });
        it('should handle mobile arrow events', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 0, key: 'UIKeyInputUpArrow' }).key, '\x1b[A');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 0, key: 'UIKeyInputUpArrow' }, { applicationCursorMode: true }).key, '\x1bOA');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 0, key: 'UIKeyInputLeftArrow' }).key, '\x1b[D');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 0, key: 'UIKeyInputLeftArrow' }, { applicationCursorMode: true }).key, '\x1bOD');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 0, key: 'UIKeyInputRightArrow' }).key, '\x1b[C');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 0, key: 'UIKeyInputRightArrow' }, { applicationCursorMode: true }).key, '\x1bOC');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 0, key: 'UIKeyInputDownArrow' }).key, '\x1b[B');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 0, key: 'UIKeyInputDownArrow' }, { applicationCursorMode: true }).key, '\x1bOB');
        });
        it('should handle lowercase letters', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 65, key: 'a' }).key, 'a');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ keyCode: 189, key: '-' }).key, '-');
        });
        it('should handle uppercase letters', function () {
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 65, key: 'A' }).key, 'A');
            chai_1.assert.equal(testEvaluateKeyboardEvent({ shiftKey: true, keyCode: 49, key: '!' }).key, '!');
        });
    });
});
//# sourceMappingURL=Keyboard.test.js.map