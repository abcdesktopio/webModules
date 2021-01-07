"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var Terminal_1 = require("./Terminal");
var attach = require("../addons/attach/attach");
describe('Terminal', function () {
    it('should apply addons with Terminal.applyAddon', function () {
        Terminal_1.Terminal.applyAddon(attach);
        chai_1.assert.equal(typeof Terminal_1.Terminal.prototype.attach, 'function');
    });
});
//# sourceMappingURL=Terminal.test.js.map