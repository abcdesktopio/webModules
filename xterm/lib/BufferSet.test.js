"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var BufferSet_1 = require("./BufferSet");
var Buffer_1 = require("./Buffer");
var TestUtils_test_1 = require("./TestUtils.test");
describe('BufferSet', function () {
    var terminal;
    var bufferSet;
    beforeEach(function () {
        terminal = new TestUtils_test_1.MockTerminal();
        terminal.cols = 80;
        terminal.rows = 24;
        terminal.options.scrollback = 1000;
        bufferSet = new BufferSet_1.BufferSet(terminal);
    });
    describe('constructor', function () {
        it('should create two different buffers: alt and normal', function () {
            chai_1.assert.instanceOf(bufferSet.normal, Buffer_1.Buffer);
            chai_1.assert.instanceOf(bufferSet.alt, Buffer_1.Buffer);
            chai_1.assert.notEqual(bufferSet.normal, bufferSet.alt);
        });
    });
    describe('activateNormalBuffer', function () {
        beforeEach(function () {
            bufferSet.activateNormalBuffer();
        });
        it('should set the normal buffer as the currently active buffer', function () {
            chai_1.assert.equal(bufferSet.active, bufferSet.normal);
        });
    });
    describe('activateAltBuffer', function () {
        beforeEach(function () {
            bufferSet.activateAltBuffer();
        });
        it('should set the alt buffer as the currently active buffer', function () {
            chai_1.assert.equal(bufferSet.active, bufferSet.alt);
        });
    });
    describe('cursor handling when swapping buffers', function () {
        beforeEach(function () {
            bufferSet.normal.x = 0;
            bufferSet.normal.y = 0;
            bufferSet.alt.x = 0;
            bufferSet.alt.y = 0;
        });
        it('should keep the cursor stationary when activating alt buffer', function () {
            bufferSet.activateNormalBuffer();
            bufferSet.active.x = 30;
            bufferSet.active.y = 10;
            bufferSet.activateAltBuffer();
            chai_1.assert.equal(bufferSet.active.x, 30);
            chai_1.assert.equal(bufferSet.active.y, 10);
        });
        it('should keep the cursor stationary when activating normal buffer', function () {
            bufferSet.activateAltBuffer();
            bufferSet.active.x = 30;
            bufferSet.active.y = 10;
            bufferSet.activateNormalBuffer();
            chai_1.assert.equal(bufferSet.active.x, 30);
            chai_1.assert.equal(bufferSet.active.y, 10);
        });
    });
});
//# sourceMappingURL=BufferSet.test.js.map