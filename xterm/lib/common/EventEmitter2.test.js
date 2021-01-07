"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var EventEmitter2_1 = require("./EventEmitter2");
describe('EventEmitter2', function () {
    it('should fire listeners multiple times', function () {
        var order = [];
        var emitter = new EventEmitter2_1.EventEmitter2();
        emitter.event(function (data) { return order.push(data + 'a'); });
        emitter.event(function (data) { return order.push(data + 'b'); });
        emitter.fire(1);
        emitter.fire(2);
        chai_1.assert.deepEqual(order, ['1a', '1b', '2a', '2b']);
    });
    it('should not fire listeners once disposed', function () {
        var order = [];
        var emitter = new EventEmitter2_1.EventEmitter2();
        emitter.event(function (data) { return order.push(data + 'a'); });
        var disposeB = emitter.event(function (data) { return order.push(data + 'b'); });
        emitter.event(function (data) { return order.push(data + 'c'); });
        emitter.fire(1);
        disposeB.dispose();
        emitter.fire(2);
        chai_1.assert.deepEqual(order, ['1a', '1b', '1c', '2a', '2c']);
    });
});
//# sourceMappingURL=EventEmitter2.test.js.map