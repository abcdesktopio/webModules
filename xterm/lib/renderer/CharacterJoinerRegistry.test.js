"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var TestUtils_test_1 = require("../TestUtils.test");
var CircularList_1 = require("../common/CircularList");
var CharacterJoinerRegistry_1 = require("./CharacterJoinerRegistry");
var BufferLine_1 = require("../BufferLine");
describe('CharacterJoinerRegistry', function () {
    var registry;
    beforeEach(function () {
        var terminal = new TestUtils_test_1.MockTerminal();
        terminal.cols = 16;
        terminal.buffer = new TestUtils_test_1.MockBuffer();
        var lines = new CircularList_1.CircularList(7);
        lines.set(0, lineData([['a -> b -> c -> d']]));
        lines.set(1, lineData([['a -> b => c -> d']]));
        lines.set(2, lineData([['a -> b -', 0xFFFFFFFF], ['> c -> d', 0]]));
        lines.set(3, lineData([['no joined ranges']]));
        lines.set(4, new BufferLine_1.BufferLine(0));
        lines.set(5, lineData([['a', 0x11111111], [' -> b -> c -> '], ['d', 0x22222222]]));
        var line6 = lineData([['wi']]);
        line6.resize(line6.length + 1, BufferLine_1.CellData.fromCharData([0, '￥', 2, '￥'.charCodeAt(0)]));
        line6.resize(line6.length + 1, BufferLine_1.CellData.fromCharData([0, '', 0, null]));
        var sub = lineData([['deemo']]);
        var oldSize = line6.length;
        line6.resize(oldSize + sub.length, BufferLine_1.CellData.fromCharData([0, '', 0, 0]));
        for (var i = 0; i < sub.length; ++i)
            line6.setCell(i + oldSize, sub.loadCell(i, new BufferLine_1.CellData()));
        line6.resize(line6.length + 1, BufferLine_1.CellData.fromCharData([0, '\xf0\x9f\x98\x81', 1, 128513]));
        line6.resize(line6.length + 1, BufferLine_1.CellData.fromCharData([0, ' ', 1, ' '.charCodeAt(0)]));
        sub = lineData([['jiabc']]);
        oldSize = line6.length;
        line6.resize(oldSize + sub.length, BufferLine_1.CellData.fromCharData([0, '', 0, 0]));
        for (var i = 0; i < sub.length; ++i)
            line6.setCell(i + oldSize, sub.loadCell(i, new BufferLine_1.CellData()));
        lines.set(6, line6);
        terminal.buffer.setLines(lines);
        terminal.buffer.ydisp = 0;
        registry = new CharacterJoinerRegistry_1.CharacterJoinerRegistry(terminal);
    });
    it('has no joiners upon creation', function () {
        chai_1.assert.deepEqual(registry.getJoinedCharacters(0), []);
    });
    it('returns ranges matched by the registered joiners', function () {
        registry.registerCharacterJoiner(substringJoiner('->'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[2, 4], [7, 9], [12, 14]]);
    });
    it('processes the input using all provided joiners', function () {
        registry.registerCharacterJoiner(substringJoiner('->'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(1), [[2, 4], [12, 14]]);
        registry.registerCharacterJoiner(substringJoiner('=>'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(1), [[2, 4], [7, 9], [12, 14]]);
    });
    it('removes deregistered joiners from future calls', function () {
        var joiner1 = registry.registerCharacterJoiner(substringJoiner('->'));
        var joiner2 = registry.registerCharacterJoiner(substringJoiner('=>'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(1), [[2, 4], [7, 9], [12, 14]]);
        registry.deregisterCharacterJoiner(joiner1);
        chai_1.assert.deepEqual(registry.getJoinedCharacters(1), [[7, 9]]);
        registry.deregisterCharacterJoiner(joiner2);
        chai_1.assert.deepEqual(registry.getJoinedCharacters(1), []);
    });
    it('doesn\'t process joins on differently-styled characters', function () {
        registry.registerCharacterJoiner(substringJoiner('->'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(2), [[2, 4], [12, 14]]);
    });
    it('returns an empty list of ranges if there is nothing to be joined', function () {
        registry.registerCharacterJoiner(substringJoiner('->'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(3), []);
    });
    it('returns an empty list of ranges if the line is empty', function () {
        registry.registerCharacterJoiner(substringJoiner('->'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(4), []);
    });
    it('returns false when trying to deregister a joiner that does not exist', function () {
        registry.registerCharacterJoiner(substringJoiner('->'));
        chai_1.assert.deepEqual(registry.deregisterCharacterJoiner(123), false);
        chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[2, 4], [7, 9], [12, 14]]);
    });
    it('doesn\'t process same-styled ranges that only have one character', function () {
        registry.registerCharacterJoiner(substringJoiner('a'));
        registry.registerCharacterJoiner(substringJoiner('b'));
        registry.registerCharacterJoiner(substringJoiner('d'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(5), [[5, 6]]);
    });
    it('handles ranges that extend all the way to the end of the line', function () {
        registry.registerCharacterJoiner(substringJoiner('-> d'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(2), [[12, 16]]);
    });
    it('handles adjacent ranges', function () {
        registry.registerCharacterJoiner(substringJoiner('->'));
        registry.registerCharacterJoiner(substringJoiner('> c '));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(2), [[2, 4], [8, 12], [12, 14]]);
    });
    it('handles fullwidth characters in the middle of ranges', function () {
        registry.registerCharacterJoiner(substringJoiner('wi￥de'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(6), [[0, 6]]);
    });
    it('handles fullwidth characters at the end of ranges', function () {
        registry.registerCharacterJoiner(substringJoiner('wi￥'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(6), [[0, 4]]);
    });
    it('handles emojis in the middle of ranges', function () {
        registry.registerCharacterJoiner(substringJoiner('emo\xf0\x9f\x98\x81 ji'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(6), [[6, 13]]);
    });
    it('handles emojis at the end of ranges', function () {
        registry.registerCharacterJoiner(substringJoiner('emo\xf0\x9f\x98\x81 '));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(6), [[6, 11]]);
    });
    it('handles ranges after wide and emoji characters', function () {
        registry.registerCharacterJoiner(substringJoiner('abc'));
        chai_1.assert.deepEqual(registry.getJoinedCharacters(6), [[13, 16]]);
    });
    describe('range merging', function () {
        it('inserts a new range before the existing ones', function () {
            registry.registerCharacterJoiner(function () { return [[1, 2], [2, 3]]; });
            registry.registerCharacterJoiner(function () { return [[0, 1]]; });
            chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[0, 1], [1, 2], [2, 3]]);
        });
        it('inserts in between two ranges', function () {
            registry.registerCharacterJoiner(function () { return [[0, 2], [4, 6]]; });
            registry.registerCharacterJoiner(function () { return [[2, 4]]; });
            chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[0, 2], [2, 4], [4, 6]]);
        });
        it('inserts after the last range', function () {
            registry.registerCharacterJoiner(function () { return [[0, 2], [4, 6]]; });
            registry.registerCharacterJoiner(function () { return [[6, 8]]; });
            chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[0, 2], [4, 6], [6, 8]]);
        });
        it('extends the beginning of a range', function () {
            registry.registerCharacterJoiner(function () { return [[0, 2], [4, 6]]; });
            registry.registerCharacterJoiner(function () { return [[3, 5]]; });
            chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[0, 2], [3, 6]]);
        });
        it('extends the end of a range', function () {
            registry.registerCharacterJoiner(function () { return [[0, 2], [4, 6]]; });
            registry.registerCharacterJoiner(function () { return [[1, 4]]; });
            chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[0, 4], [4, 6]]);
        });
        it('extends the last range', function () {
            registry.registerCharacterJoiner(function () { return [[0, 2], [4, 6]]; });
            registry.registerCharacterJoiner(function () { return [[5, 7]]; });
            chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[0, 2], [4, 7]]);
        });
        it('connects two ranges', function () {
            registry.registerCharacterJoiner(function () { return [[0, 2], [4, 6]]; });
            registry.registerCharacterJoiner(function () { return [[1, 5]]; });
            chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[0, 6]]);
        });
        it('connects more than two ranges', function () {
            registry.registerCharacterJoiner(function () { return [[0, 2], [4, 6], [8, 10], [12, 14]]; });
            registry.registerCharacterJoiner(function () { return [[1, 10]]; });
            chai_1.assert.deepEqual(registry.getJoinedCharacters(0), [[0, 10], [12, 14]]);
        });
    });
});
function lineData(data) {
    var tline = new BufferLine_1.BufferLine(0);
    var _loop_1 = function (i) {
        var line = data[i][0];
        var attr = (data[i][1] || 0);
        var offset = tline.length;
        tline.resize(tline.length + line.split('').length, BufferLine_1.CellData.fromCharData([0, '', 0, 0]));
        line.split('').map(function (char, idx) { return tline.setCell(idx + offset, BufferLine_1.CellData.fromCharData([attr, char, 1, char.charCodeAt(0)])); });
    };
    for (var i = 0; i < data.length; ++i) {
        _loop_1(i);
    }
    return tline;
}
function substringJoiner(substring) {
    return function (sequence) {
        var ranges = [];
        var searchIndex = 0;
        var matchIndex = -1;
        while ((matchIndex = sequence.indexOf(substring, searchIndex)) !== -1) {
            var matchEndIndex = matchIndex + substring.length;
            searchIndex = matchEndIndex;
            ranges.push([matchIndex, matchEndIndex]);
        }
        return ranges;
    };
}
//# sourceMappingURL=CharacterJoinerRegistry.test.js.map