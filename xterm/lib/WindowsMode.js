"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("./Buffer");
function applyWindowsMode(terminal) {
    return terminal.onLineFeed(function () {
        var line = terminal.buffer.lines.get(terminal.buffer.ybase + terminal.buffer.y - 1);
        var lastChar = line.get(terminal.cols - 1);
        if (lastChar[Buffer_1.CHAR_DATA_CODE_INDEX] !== Buffer_1.NULL_CELL_CODE && lastChar[Buffer_1.CHAR_DATA_CODE_INDEX] !== Buffer_1.WHITESPACE_CELL_CODE) {
            var nextLine = terminal.buffer.lines.get(terminal.buffer.ybase + terminal.buffer.y);
            nextLine.isWrapped = true;
        }
    });
}
exports.applyWindowsMode = applyWindowsMode;
//# sourceMappingURL=WindowsMode.js.map