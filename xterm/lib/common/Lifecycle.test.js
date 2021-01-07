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
var chai_1 = require("chai");
var Lifecycle_1 = require("./Lifecycle");
var TestDisposable = (function (_super) {
    __extends(TestDisposable, _super);
    function TestDisposable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TestDisposable.prototype, "isDisposed", {
        get: function () {
            return this._isDisposed;
        },
        enumerable: true,
        configurable: true
    });
    return TestDisposable;
}(Lifecycle_1.Disposable));
describe('Disposable', function () {
    describe('register', function () {
        it('should register disposables', function () {
            var d = new TestDisposable();
            var d2 = {
                dispose: function () { throw new Error(); }
            };
            d.register(d2);
            chai_1.assert.throws(function () { return d.dispose(); });
        });
    });
    describe('unregister', function () {
        it('should unregister disposables', function () {
            var d = new TestDisposable();
            var d2 = {
                dispose: function () { throw new Error(); }
            };
            d.register(d2);
            d.unregister(d2);
            chai_1.assert.doesNotThrow(function () { return d.dispose(); });
        });
    });
    describe('dispose', function () {
        it('should set is disposed flag', function () {
            var d = new TestDisposable();
            chai_1.assert.isFalse(d.isDisposed);
            d.dispose();
            chai_1.assert.isTrue(d.isDisposed);
        });
    });
});
//# sourceMappingURL=Lifecycle.test.js.map