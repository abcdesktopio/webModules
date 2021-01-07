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
var EscapeSequenceParser_1 = require("./EscapeSequenceParser");
var chai = require("chai");
var TextDecoder_1 = require("./core/input/TextDecoder");
function r(a, b) {
    var c = b - a;
    var arr = new Array(c);
    while (c--) {
        arr[c] = String.fromCharCode(--b);
    }
    return arr;
}
var TestEscapeSequenceParser = (function (_super) {
    __extends(TestEscapeSequenceParser, _super);
    function TestEscapeSequenceParser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TestEscapeSequenceParser.prototype, "osc", {
        get: function () {
            return this._osc;
        },
        set: function (value) {
            this._osc = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestEscapeSequenceParser.prototype, "params", {
        get: function () {
            return this._params;
        },
        set: function (value) {
            this._params = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestEscapeSequenceParser.prototype, "collect", {
        get: function () {
            return this._collect;
        },
        set: function (value) {
            this._collect = value;
        },
        enumerable: true,
        configurable: true
    });
    TestEscapeSequenceParser.prototype.mockActiveDcsHandler = function () {
        this._activeDcsHandler = this._dcsHandlerFb;
    };
    return TestEscapeSequenceParser;
}(EscapeSequenceParser_1.EscapeSequenceParser));
var testTerminal = {
    calls: [],
    clear: function () {
        this.calls = [];
    },
    compare: function (value) {
        chai.expect(this.calls.slice()).eql(value);
    },
    print: function (data, start, end) {
        var s = '';
        for (var i = start; i < end; ++i) {
            s += TextDecoder_1.stringFromCodePoint(data[i]);
        }
        this.calls.push(['print', s]);
    },
    actionOSC: function (s) {
        this.calls.push(['osc', s]);
    },
    actionExecute: function (flag) {
        this.calls.push(['exe', flag]);
    },
    actionCSI: function (collect, params, flag) {
        this.calls.push(['csi', collect, params, flag]);
    },
    actionESC: function (collect, flag) {
        this.calls.push(['esc', collect, flag]);
    },
    actionDCSHook: function (collect, params, flag) {
        this.calls.push(['dcs hook', collect, params, flag]);
    },
    actionDCSPrint: function (data, start, end) {
        var s = '';
        for (var i = start; i < end; ++i) {
            s += TextDecoder_1.stringFromCodePoint(data[i]);
        }
        this.calls.push(['dcs put', s]);
    },
    actionDCSUnhook: function () {
        this.calls.push(['dcs unhook']);
    }
};
var DcsTest = (function () {
    function DcsTest() {
    }
    DcsTest.prototype.hook = function (collect, params, flag) {
        testTerminal.actionDCSHook(collect, params, String.fromCharCode(flag));
    };
    DcsTest.prototype.put = function (data, start, end) {
        testTerminal.actionDCSPrint(data, start, end);
    };
    DcsTest.prototype.unhook = function () {
        testTerminal.actionDCSUnhook();
    };
    return DcsTest;
}());
var states = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13
];
var state;
var parserUint = new TestEscapeSequenceParser(EscapeSequenceParser_1.VT500_TRANSITION_TABLE);
parserUint.setPrintHandler(testTerminal.print.bind(testTerminal));
parserUint.setCsiHandlerFallback(function (collect, params, flag) {
    testTerminal.actionCSI(collect, params, String.fromCharCode(flag));
});
parserUint.setEscHandlerFallback(function (collect, flag) {
    testTerminal.actionESC(collect, String.fromCharCode(flag));
});
parserUint.setExecuteHandlerFallback(function (code) {
    testTerminal.actionExecute(String.fromCharCode(code));
});
parserUint.setOscHandlerFallback(function (identifier, data) {
    if (identifier === -1)
        testTerminal.actionOSC(data);
    else
        testTerminal.actionOSC('' + identifier + ';' + data);
});
parserUint.setDcsHandlerFallback(new DcsTest());
var VT500_TRANSITION_TABLE_ARRAY = new EscapeSequenceParser_1.TransitionTable(EscapeSequenceParser_1.VT500_TRANSITION_TABLE.table.length);
VT500_TRANSITION_TABLE_ARRAY.table = new Array(EscapeSequenceParser_1.VT500_TRANSITION_TABLE.table.length);
for (var i = 0; i < EscapeSequenceParser_1.VT500_TRANSITION_TABLE.table.length; ++i) {
    VT500_TRANSITION_TABLE_ARRAY.table[i] = EscapeSequenceParser_1.VT500_TRANSITION_TABLE.table[i];
}
var parserArray = new TestEscapeSequenceParser(VT500_TRANSITION_TABLE_ARRAY);
parserArray.setPrintHandler(testTerminal.print.bind(testTerminal));
parserArray.setCsiHandlerFallback(function (collect, params, flag) {
    testTerminal.actionCSI(collect, params, String.fromCharCode(flag));
});
parserArray.setEscHandlerFallback(function (collect, flag) {
    testTerminal.actionESC(collect, String.fromCharCode(flag));
});
parserArray.setExecuteHandlerFallback(function (code) {
    testTerminal.actionExecute(String.fromCharCode(code));
});
parserArray.setOscHandlerFallback(function (identifier, data) {
    if (identifier === -1)
        testTerminal.actionOSC(data);
    else
        testTerminal.actionOSC('' + identifier + ';' + data);
});
parserArray.setDcsHandlerFallback(new DcsTest());
function parse(parser, data) {
    var container = new Uint32Array(data.length);
    var decoder = new TextDecoder_1.StringToUtf32();
    parser.parse(container, decoder.decode(data, container));
}
describe('EscapeSequenceParser', function () {
    var parser = null;
    var runs = [
        { tableType: 'Uint8Array', parser: parserUint },
        { tableType: 'Array', parser: parserArray }
    ];
    runs.forEach(function (run) {
        describe('Parser init and methods / ' + run.tableType, function () {
            before(function () {
                parser = run.parser;
            });
            it('constructor', function () {
                var p = new EscapeSequenceParser_1.EscapeSequenceParser();
                chai.expect(p.TRANSITIONS).equal(EscapeSequenceParser_1.VT500_TRANSITION_TABLE);
                p = new EscapeSequenceParser_1.EscapeSequenceParser(EscapeSequenceParser_1.VT500_TRANSITION_TABLE);
                chai.expect(p.TRANSITIONS).equal(EscapeSequenceParser_1.VT500_TRANSITION_TABLE);
                var tansitions = new EscapeSequenceParser_1.TransitionTable(10);
                p = new EscapeSequenceParser_1.EscapeSequenceParser(tansitions);
                chai.expect(p.TRANSITIONS).equal(tansitions);
            });
            it('inital states', function () {
                chai.expect(parser.initialState).equal(0);
                chai.expect(parser.currentState).equal(0);
                chai.expect(parser.osc).equal('');
                chai.expect(parser.params).eql([0]);
                chai.expect(parser.collect).equal('');
            });
            it('reset states', function () {
                parser.currentState = 124;
                parser.osc = '#';
                parser.params = [123];
                parser.collect = '#';
                parser.reset();
                chai.expect(parser.currentState).equal(0);
                chai.expect(parser.osc).equal('');
                chai.expect(parser.params).eql([0]);
                chai.expect(parser.collect).equal('');
            });
        });
    });
    runs.forEach(function (run) {
        describe('state transitions and actions / ' + run.tableType, function () {
            before(function () {
                parser = run.parser;
            });
            it('state GROUND execute action', function () {
                parser.reset();
                testTerminal.clear();
                var exes = r(0x00, 0x18);
                exes = exes.concat(['\x19']);
                exes = exes.concat(r(0x1c, 0x20));
                for (var i = 0; i < exes.length; ++i) {
                    parser.currentState = 0;
                    parse(parser, exes[i]);
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare([['exe', exes[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state GROUND print action', function () {
                parser.reset();
                testTerminal.clear();
                var printables = r(0x20, 0x7f);
                for (var i = 0; i < printables.length; ++i) {
                    parser.currentState = 0;
                    parse(parser, printables[i]);
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare([['print', printables[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans ANYWHERE --> GROUND with actions', function () {
                var exes = [
                    '\x18', '\x1a',
                    '\x80', '\x81', '\x82', '\x83', '\x84', '\x85', '\x86', '\x87', '\x88',
                    '\x89', '\x8a', '\x8b', '\x8c', '\x8d', '\x8e', '\x8f',
                    '\x91', '\x92', '\x93', '\x94', '\x95', '\x96', '\x97', '\x99', '\x9a'
                ];
                var exceptions = {
                    8: { '\x18': [], '\x1a': [] }
                };
                parser.reset();
                testTerminal.clear();
                for (state in states) {
                    for (var i = 0; i < exes.length; ++i) {
                        parser.currentState = state;
                        parse(parser, exes[i]);
                        chai.expect(parser.currentState).equal(0);
                        testTerminal.compare((state in exceptions ? exceptions[state][exes[i]] : 0) || [['exe', exes[i]]]);
                        parser.reset();
                        testTerminal.clear();
                    }
                    parse(parser, '\x9c');
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare([]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans ANYWHERE --> ESCAPE with clear', function () {
                parser.reset();
                for (state in states) {
                    parser.currentState = state;
                    parser.osc = '#';
                    parser.params = [23];
                    parser.collect = '#';
                    parse(parser, '\x1b');
                    chai.expect(parser.currentState).equal(1);
                    chai.expect(parser.osc).equal('');
                    chai.expect(parser.params).eql([0]);
                    chai.expect(parser.collect).equal('');
                    parser.reset();
                }
            });
            it('state ESCAPE execute rules', function () {
                parser.reset();
                testTerminal.clear();
                var exes = r(0x00, 0x18);
                exes = exes.concat(['\x19']);
                exes = exes.concat(r(0x1c, 0x20));
                for (var i = 0; i < exes.length; ++i) {
                    parser.currentState = 1;
                    parse(parser, exes[i]);
                    chai.expect(parser.currentState).equal(1);
                    testTerminal.compare([['exe', exes[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state ESCAPE ignore', function () {
                parser.reset();
                testTerminal.clear();
                parser.currentState = 1;
                parse(parser, '\x7f');
                chai.expect(parser.currentState).equal(1);
                testTerminal.compare([]);
                parser.reset();
                testTerminal.clear();
            });
            it('trans ESCAPE --> GROUND with ecs_dispatch action', function () {
                parser.reset();
                testTerminal.clear();
                var dispatches = r(0x30, 0x50);
                dispatches = dispatches.concat(r(0x51, 0x58));
                dispatches = dispatches.concat(['\x59', '\x5a']);
                dispatches = dispatches.concat(r(0x60, 0x7f));
                for (var i = 0; i < dispatches.length; ++i) {
                    parser.currentState = 1;
                    parse(parser, dispatches[i]);
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare([['esc', '', dispatches[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans ESCAPE --> ESCAPE_INTERMEDIATE with collect action', function () {
                parser.reset();
                var collect = r(0x20, 0x30);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 1;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(2);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('state ESCAPE_INTERMEDIATE execute rules', function () {
                parser.reset();
                testTerminal.clear();
                var exes = r(0x00, 0x18);
                exes = exes.concat(['\x19']);
                exes = exes.concat(r(0x1c, 0x20));
                for (var i = 0; i < exes.length; ++i) {
                    parser.currentState = 2;
                    parse(parser, exes[i]);
                    chai.expect(parser.currentState).equal(2);
                    testTerminal.compare([['exe', exes[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state ESCAPE_INTERMEDIATE ignore', function () {
                parser.reset();
                testTerminal.clear();
                parser.currentState = 2;
                parse(parser, '\x7f');
                chai.expect(parser.currentState).equal(2);
                testTerminal.compare([]);
                parser.reset();
                testTerminal.clear();
            });
            it('state ESCAPE_INTERMEDIATE collect action', function () {
                parser.reset();
                var collect = r(0x20, 0x30);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 2;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(2);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('trans ESCAPE_INTERMEDIATE --> GROUND with esc_dispatch action', function () {
                parser.reset();
                testTerminal.clear();
                var collect = r(0x30, 0x7f);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 2;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare((collect[i] === '\x5c') ? [] : [['esc', '', collect[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans ANYWHERE/ESCAPE --> CSI_ENTRY with clear', function () {
                parser.reset();
                parser.currentState = 1;
                parser.osc = '#';
                parser.params = [123];
                parser.collect = '#';
                parse(parser, '[');
                chai.expect(parser.currentState).equal(3);
                chai.expect(parser.osc).equal('');
                chai.expect(parser.params).eql([0]);
                chai.expect(parser.collect).equal('');
                parser.reset();
                for (state in states) {
                    parser.currentState = state;
                    parser.osc = '#';
                    parser.params = [123];
                    parser.collect = '#';
                    parse(parser, '\x9b');
                    chai.expect(parser.currentState).equal(3);
                    chai.expect(parser.osc).equal('');
                    chai.expect(parser.params).eql([0]);
                    chai.expect(parser.collect).equal('');
                    parser.reset();
                }
            });
            it('state CSI_ENTRY execute rules', function () {
                parser.reset();
                testTerminal.clear();
                var exes = r(0x00, 0x18);
                exes = exes.concat(['\x19']);
                exes = exes.concat(r(0x1c, 0x20));
                for (var i = 0; i < exes.length; ++i) {
                    parser.currentState = 3;
                    parse(parser, exes[i]);
                    chai.expect(parser.currentState).equal(3);
                    testTerminal.compare([['exe', exes[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state CSI_ENTRY ignore', function () {
                parser.reset();
                testTerminal.clear();
                parser.currentState = 3;
                parse(parser, '\x7f');
                chai.expect(parser.currentState).equal(3);
                testTerminal.compare([]);
                parser.reset();
                testTerminal.clear();
            });
            it('trans CSI_ENTRY --> GROUND with csi_dispatch action', function () {
                parser.reset();
                var dispatches = r(0x40, 0x7f);
                for (var i = 0; i < dispatches.length; ++i) {
                    parser.currentState = 3;
                    parse(parser, dispatches[i]);
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare([['csi', '', [0], dispatches[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans CSI_ENTRY --> CSI_PARAM with param/collect actions', function () {
                parser.reset();
                var params = ['\x30', '\x31', '\x32', '\x33', '\x34', '\x35', '\x36', '\x37', '\x38', '\x39'];
                var collect = ['\x3c', '\x3d', '\x3e', '\x3f'];
                for (var i = 0; i < params.length; ++i) {
                    parser.currentState = 3;
                    parse(parser, params[i]);
                    chai.expect(parser.currentState).equal(4);
                    chai.expect(parser.params).eql([params[i].charCodeAt(0) - 48]);
                    parser.reset();
                }
                parser.currentState = 3;
                parse(parser, '\x3b');
                chai.expect(parser.currentState).equal(4);
                chai.expect(parser.params).eql([0, 0]);
                parser.reset();
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 3;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(4);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('state CSI_PARAM execute rules', function () {
                parser.reset();
                testTerminal.clear();
                var exes = r(0x00, 0x18);
                exes = exes.concat(['\x19']);
                exes = exes.concat(r(0x1c, 0x20));
                for (var i = 0; i < exes.length; ++i) {
                    parser.currentState = 4;
                    parse(parser, exes[i]);
                    chai.expect(parser.currentState).equal(4);
                    testTerminal.compare([['exe', exes[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state CSI_PARAM param action', function () {
                parser.reset();
                var params = ['\x30', '\x31', '\x32', '\x33', '\x34', '\x35', '\x36', '\x37', '\x38', '\x39'];
                for (var i = 0; i < params.length; ++i) {
                    parser.currentState = 4;
                    parse(parser, params[i]);
                    chai.expect(parser.currentState).equal(4);
                    chai.expect(parser.params).eql([params[i].charCodeAt(0) - 48]);
                    parser.reset();
                }
                parser.currentState = 4;
                parse(parser, '\x3b');
                chai.expect(parser.currentState).equal(4);
                chai.expect(parser.params).eql([0, 0]);
                parser.reset();
            });
            it('state CSI_PARAM ignore', function () {
                parser.reset();
                testTerminal.clear();
                parser.currentState = 4;
                parse(parser, '\x7f');
                chai.expect(parser.currentState).equal(4);
                testTerminal.compare([]);
                parser.reset();
                testTerminal.clear();
            });
            it('trans CSI_PARAM --> GROUND with csi_dispatch action', function () {
                parser.reset();
                var dispatches = r(0x40, 0x7f);
                for (var i = 0; i < dispatches.length; ++i) {
                    parser.currentState = 4;
                    parser.params = [0, 1];
                    parse(parser, dispatches[i]);
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare([['csi', '', [0, 1], dispatches[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans CSI_ENTRY --> CSI_INTERMEDIATE with collect action', function () {
                parser.reset();
                var collect = r(0x20, 0x30);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 3;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(5);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('trans CSI_PARAM --> CSI_INTERMEDIATE with collect action', function () {
                parser.reset();
                var collect = r(0x20, 0x30);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 4;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(5);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('state CSI_INTERMEDIATE execute rules', function () {
                parser.reset();
                testTerminal.clear();
                var exes = r(0x00, 0x18);
                exes = exes.concat(['\x19']);
                exes = exes.concat(r(0x1c, 0x20));
                for (var i = 0; i < exes.length; ++i) {
                    parser.currentState = 5;
                    parse(parser, exes[i]);
                    chai.expect(parser.currentState).equal(5);
                    testTerminal.compare([['exe', exes[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state CSI_INTERMEDIATE collect', function () {
                parser.reset();
                var collect = r(0x20, 0x30);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 5;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(5);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('state CSI_INTERMEDIATE ignore', function () {
                parser.reset();
                testTerminal.clear();
                parser.currentState = 5;
                parse(parser, '\x7f');
                chai.expect(parser.currentState).equal(5);
                testTerminal.compare([]);
                parser.reset();
                testTerminal.clear();
            });
            it('trans CSI_INTERMEDIATE --> GROUND with csi_dispatch action', function () {
                parser.reset();
                var dispatches = r(0x40, 0x7f);
                for (var i = 0; i < dispatches.length; ++i) {
                    parser.currentState = 5;
                    parser.params = [0, 1];
                    parse(parser, dispatches[i]);
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare([['csi', '', [0, 1], dispatches[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans CSI_ENTRY --> CSI_IGNORE', function () {
                parser.reset();
                parser.currentState = 3;
                parse(parser, '\x3a');
                chai.expect(parser.currentState).equal(6);
                parser.reset();
            });
            it('trans CSI_PARAM --> CSI_IGNORE', function () {
                parser.reset();
                var chars = ['\x3a', '\x3c', '\x3d', '\x3e', '\x3f'];
                for (var i = 0; i < chars.length; ++i) {
                    parser.currentState = 4;
                    parse(parser, '\x3b' + chars[i]);
                    chai.expect(parser.currentState).equal(6);
                    chai.expect(parser.params).eql([0, 0]);
                    parser.reset();
                }
            });
            it('trans CSI_INTERMEDIATE --> CSI_IGNORE', function () {
                parser.reset();
                var chars = r(0x30, 0x40);
                for (var i = 0; i < chars.length; ++i) {
                    parser.currentState = 5;
                    parse(parser, chars[i]);
                    chai.expect(parser.currentState).equal(6);
                    chai.expect(parser.params).eql([0]);
                    parser.reset();
                }
            });
            it('state CSI_IGNORE execute rules', function () {
                parser.reset();
                testTerminal.clear();
                var exes = r(0x00, 0x18);
                exes = exes.concat(['\x19']);
                exes = exes.concat(r(0x1c, 0x20));
                for (var i = 0; i < exes.length; ++i) {
                    parser.currentState = 6;
                    parse(parser, exes[i]);
                    chai.expect(parser.currentState).equal(6);
                    testTerminal.compare([['exe', exes[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state CSI_IGNORE ignore', function () {
                parser.reset();
                testTerminal.clear();
                var ignored = r(0x20, 0x40);
                ignored = ignored.concat(['\x7f']);
                for (var i = 0; i < ignored.length; ++i) {
                    parser.currentState = 6;
                    parse(parser, ignored[i]);
                    chai.expect(parser.currentState).equal(6);
                    testTerminal.compare([]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans CSI_IGNORE --> GROUND', function () {
                parser.reset();
                var dispatches = r(0x40, 0x7f);
                for (var i = 0; i < dispatches.length; ++i) {
                    parser.currentState = 6;
                    parser.params = [0, 1];
                    parse(parser, dispatches[i]);
                    chai.expect(parser.currentState).equal(0);
                    testTerminal.compare([]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans ANYWHERE/ESCAPE --> SOS_PM_APC_STRING', function () {
                parser.reset();
                var initializers = ['\x58', '\x5e', '\x5f'];
                for (var i = 0; i < initializers.length; ++i) {
                    parse(parser, '\x1b' + initializers[i]);
                    chai.expect(parser.currentState).equal(7);
                    parser.reset();
                }
                for (state in states) {
                    parser.currentState = state;
                    initializers = ['\x98', '\x9e', '\x9f'];
                    for (var i = 0; i < initializers.length; ++i) {
                        parse(parser, initializers[i]);
                        chai.expect(parser.currentState).equal(7);
                        parser.reset();
                    }
                }
            });
            it('state SOS_PM_APC_STRING ignore rules', function () {
                parser.reset();
                var ignored = r(0x00, 0x18);
                ignored = ignored.concat(['\x19']);
                ignored = ignored.concat(r(0x1c, 0x20));
                ignored = ignored.concat(r(0x20, 0x80));
                for (var i = 0; i < ignored.length; ++i) {
                    parser.currentState = 7;
                    parse(parser, ignored[i]);
                    chai.expect(parser.currentState).equal(7);
                    parser.reset();
                }
            });
            it('trans ANYWHERE/ESCAPE --> OSC_STRING', function () {
                parser.reset();
                parse(parser, '\x1b]');
                chai.expect(parser.currentState).equal(8);
                parser.reset();
                for (state in states) {
                    parser.currentState = state;
                    parse(parser, '\x9d');
                    chai.expect(parser.currentState).equal(8);
                    parser.reset();
                }
            });
            it('state OSC_STRING ignore rules', function () {
                parser.reset();
                var ignored = [
                    '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x08',
                    '\x09', '\x0a', '\x0b', '\x0c', '\x0d', '\x0e', '\x0f', '\x10', '\x11',
                    '\x12', '\x13', '\x14', '\x15', '\x16', '\x17', '\x19', '\x1c', '\x1d', '\x1e', '\x1f'
                ];
                for (var i = 0; i < ignored.length; ++i) {
                    parser.currentState = 8;
                    parse(parser, ignored[i]);
                    chai.expect(parser.currentState).equal(8);
                    chai.expect(parser.osc).equal('');
                    parser.reset();
                }
            });
            it('state OSC_STRING put action', function () {
                parser.reset();
                var puts = r(0x20, 0x80);
                for (var i = 0; i < puts.length; ++i) {
                    parser.currentState = 8;
                    parse(parser, puts[i]);
                    chai.expect(parser.currentState).equal(8);
                    chai.expect(parser.osc).equal(puts[i]);
                    parser.reset();
                }
            });
            it('state DCS_ENTRY', function () {
                parser.reset();
                parse(parser, '\x1bP');
                chai.expect(parser.currentState).equal(9);
                parser.reset();
                for (state in states) {
                    parser.currentState = state;
                    parse(parser, '\x90');
                    chai.expect(parser.currentState).equal(9);
                    parser.reset();
                }
            });
            it('state DCS_ENTRY ignore rules', function () {
                parser.reset();
                var ignored = [
                    '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\x08',
                    '\x09', '\x0a', '\x0b', '\x0c', '\x0d', '\x0e', '\x0f', '\x10', '\x11',
                    '\x12', '\x13', '\x14', '\x15', '\x16', '\x17', '\x19', '\x1c', '\x1d', '\x1e', '\x1f', '\x7f'
                ];
                for (var i = 0; i < ignored.length; ++i) {
                    parser.currentState = 9;
                    parse(parser, ignored[i]);
                    chai.expect(parser.currentState).equal(9);
                    parser.reset();
                }
            });
            it('state DCS_ENTRY --> DCS_PARAM with param/collect actions', function () {
                parser.reset();
                var params = ['\x30', '\x31', '\x32', '\x33', '\x34', '\x35', '\x36', '\x37', '\x38', '\x39'];
                var collect = ['\x3c', '\x3d', '\x3e', '\x3f'];
                for (var i = 0; i < params.length; ++i) {
                    parser.currentState = 9;
                    parse(parser, params[i]);
                    chai.expect(parser.currentState).equal(10);
                    chai.expect(parser.params).eql([params[i].charCodeAt(0) - 48]);
                    parser.reset();
                }
                parser.currentState = 9;
                parse(parser, '\x3b');
                chai.expect(parser.currentState).equal(10);
                chai.expect(parser.params).eql([0, 0]);
                parser.reset();
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 9;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(10);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('state DCS_PARAM ignore rules', function () {
                parser.reset();
                var ignored = [
                    '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\x08',
                    '\x09', '\x0a', '\x0b', '\x0c', '\x0d', '\x0e', '\x0f', '\x10', '\x11',
                    '\x12', '\x13', '\x14', '\x15', '\x16', '\x17', '\x19', '\x1c', '\x1d', '\x1e', '\x1f', '\x7f'
                ];
                for (var i = 0; i < ignored.length; ++i) {
                    parser.currentState = 10;
                    parse(parser, ignored[i]);
                    chai.expect(parser.currentState).equal(10);
                    parser.reset();
                }
            });
            it('state DCS_PARAM param action', function () {
                parser.reset();
                var params = ['\x30', '\x31', '\x32', '\x33', '\x34', '\x35', '\x36', '\x37', '\x38', '\x39'];
                for (var i = 0; i < params.length; ++i) {
                    parser.currentState = 10;
                    parse(parser, params[i]);
                    chai.expect(parser.currentState).equal(10);
                    chai.expect(parser.params).eql([params[i].charCodeAt(0) - 48]);
                    parser.reset();
                }
                parser.currentState = 10;
                parse(parser, '\x3b');
                chai.expect(parser.currentState).equal(10);
                chai.expect(parser.params).eql([0, 0]);
                parser.reset();
            });
            it('trans DCS_ENTRY --> DCS_IGNORE', function () {
                parser.reset();
                parser.currentState = 9;
                parse(parser, '\x3a');
                chai.expect(parser.currentState).equal(11);
                parser.reset();
            });
            it('trans DCS_PARAM --> DCS_IGNORE', function () {
                parser.reset();
                var chars = ['\x3a', '\x3c', '\x3d', '\x3e', '\x3f'];
                for (var i = 0; i < chars.length; ++i) {
                    parser.currentState = 10;
                    parse(parser, '\x3b' + chars[i]);
                    chai.expect(parser.currentState).equal(11);
                    chai.expect(parser.params).eql([0, 0]);
                    parser.reset();
                }
            });
            it('trans DCS_INTERMEDIATE --> DCS_IGNORE', function () {
                parser.reset();
                var chars = r(0x30, 0x40);
                for (var i = 0; i < chars.length; ++i) {
                    parser.currentState = 12;
                    parse(parser, chars[i]);
                    chai.expect(parser.currentState).equal(11);
                    parser.reset();
                }
            });
            it('state DCS_IGNORE ignore rules', function () {
                parser.reset();
                var ignored = [
                    '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\x08',
                    '\x09', '\x0a', '\x0b', '\x0c', '\x0d', '\x0e', '\x0f', '\x10', '\x11',
                    '\x12', '\x13', '\x14', '\x15', '\x16', '\x17', '\x19', '\x1c', '\x1d', '\x1e', '\x1f', '\x7f'
                ];
                ignored = ignored.concat(r(0x20, 0x80));
                for (var i = 0; i < ignored.length; ++i) {
                    parser.currentState = 11;
                    parse(parser, ignored[i]);
                    chai.expect(parser.currentState).equal(11);
                    parser.reset();
                }
            });
            it('trans DCS_ENTRY --> DCS_INTERMEDIATE with collect action', function () {
                parser.reset();
                var collect = r(0x20, 0x30);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 9;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(12);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('trans DCS_PARAM --> DCS_INTERMEDIATE with collect action', function () {
                parser.reset();
                var collect = r(0x20, 0x30);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 10;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(12);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('state DCS_INTERMEDIATE ignore rules', function () {
                parser.reset();
                var ignored = [
                    '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\x08',
                    '\x09', '\x0a', '\x0b', '\x0c', '\x0d', '\x0e', '\x0f', '\x10', '\x11',
                    '\x12', '\x13', '\x14', '\x15', '\x16', '\x17', '\x19', '\x1c', '\x1d', '\x1e', '\x1f', '\x7f'
                ];
                for (var i = 0; i < ignored.length; ++i) {
                    parser.currentState = 12;
                    parse(parser, ignored[i]);
                    chai.expect(parser.currentState).equal(12);
                    parser.reset();
                }
            });
            it('state DCS_INTERMEDIATE collect action', function () {
                parser.reset();
                var collect = r(0x20, 0x30);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 12;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(12);
                    chai.expect(parser.collect).equal(collect[i]);
                    parser.reset();
                }
            });
            it('trans DCS_INTERMEDIATE --> DCS_IGNORE', function () {
                parser.reset();
                var chars = r(0x30, 0x40);
                for (var i = 0; i < chars.length; ++i) {
                    parser.currentState = 12;
                    parse(parser, '\x20' + chars[i]);
                    chai.expect(parser.currentState).equal(11);
                    chai.expect(parser.collect).equal('\x20');
                    parser.reset();
                }
            });
            it('trans DCS_ENTRY --> DCS_PASSTHROUGH with hook', function () {
                parser.reset();
                testTerminal.clear();
                var collect = r(0x40, 0x7f);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 9;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(13);
                    testTerminal.compare([['dcs hook', '', [0], collect[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans DCS_PARAM --> DCS_PASSTHROUGH with hook', function () {
                parser.reset();
                testTerminal.clear();
                var collect = r(0x40, 0x7f);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 10;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(13);
                    testTerminal.compare([['dcs hook', '', [0], collect[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('trans DCS_INTERMEDIATE --> DCS_PASSTHROUGH with hook', function () {
                parser.reset();
                testTerminal.clear();
                var collect = r(0x40, 0x7f);
                for (var i = 0; i < collect.length; ++i) {
                    parser.currentState = 12;
                    parse(parser, collect[i]);
                    chai.expect(parser.currentState).equal(13);
                    testTerminal.compare([['dcs hook', '', [0], collect[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state DCS_PASSTHROUGH put action', function () {
                parser.reset();
                testTerminal.clear();
                var puts = r(0x00, 0x18);
                puts = puts.concat(['\x19']);
                puts = puts.concat(r(0x1c, 0x20));
                puts = puts.concat(r(0x20, 0x7f));
                for (var i = 0; i < puts.length; ++i) {
                    parser.currentState = 13;
                    parser.mockActiveDcsHandler();
                    parse(parser, puts[i]);
                    chai.expect(parser.currentState).equal(13);
                    testTerminal.compare([['dcs put', puts[i]]]);
                    parser.reset();
                    testTerminal.clear();
                }
            });
            it('state DCS_PASSTHROUGH ignore', function () {
                parser.reset();
                testTerminal.clear();
                parser.currentState = 13;
                parse(parser, '\x7f');
                chai.expect(parser.currentState).equal(13);
                testTerminal.compare([]);
                parser.reset();
                testTerminal.clear();
            });
        });
    });
    runs.forEach(function (run) {
        var test = null;
        describe('escape sequence examples / ' + run.tableType, function () {
            before(function () {
                parser = run.parser;
                test = function (s, value, noReset) {
                    if (!noReset) {
                        parser.reset();
                        testTerminal.clear();
                    }
                    parse(parser, s);
                    testTerminal.compare(value);
                };
            });
            it('CSI with print and execute', function () {
                test('\x1b[<31;5mHello World! öäü€\nabc', [
                    ['csi', '<', [31, 5], 'm'],
                    ['print', 'Hello World! öäü€'],
                    ['exe', '\n'],
                    ['print', 'abc']
                ], null);
            });
            it('OSC', function () {
                test('\x1b]0;abc123€öäü\x07', [
                    ['osc', '0;abc123€öäü']
                ], null);
            });
            it('single DCS', function () {
                test('\x1bP1;2;3+$abc;de\x9c', [
                    ['dcs hook', '+$', [1, 2, 3], 'a'],
                    ['dcs put', 'bc;de'],
                    ['dcs unhook']
                ], null);
            });
            it('multi DCS', function () {
                test('\x1bP1;2;3+$abc;de', [
                    ['dcs hook', '+$', [1, 2, 3], 'a'],
                    ['dcs put', 'bc;de']
                ], null);
                testTerminal.clear();
                test('abc\x9c', [
                    ['dcs put', 'abc'],
                    ['dcs unhook']
                ], true);
            });
            it('print + DCS(C1)', function () {
                test('abc\x901;2;3+$abc;de\x9c', [
                    ['print', 'abc'],
                    ['dcs hook', '+$', [1, 2, 3], 'a'],
                    ['dcs put', 'bc;de'],
                    ['dcs unhook']
                ], null);
            });
            it('print + PM(C1) + print', function () {
                test('abc\x98123tzf\x9cdefg', [
                    ['print', 'abc'],
                    ['print', 'defg']
                ], null);
            });
            it('print + OSC(C1) + print', function () {
                test('abc\x9d123tzf\x9cdefg', [
                    ['print', 'abc'],
                    ['osc', '123tzf'],
                    ['print', 'defg']
                ], null);
            });
            it('error recovery', function () {
                test('\x1b[1€abcdefg\x9b<;c', [
                    ['print', 'abcdefg'],
                    ['csi', '<', [0, 0], 'c']
                ], null);
            });
            it('7bit ST should be swallowed', function () {
                test('abc\x9d123tzf\x1b\\defg', [
                    ['print', 'abc'],
                    ['osc', '123tzf'],
                    ['print', 'defg']
                ], null);
            });
        });
    });
    describe('coverage tests', function () {
        it('CSI_IGNORE error', function () {
            parser.reset();
            testTerminal.clear();
            parser.currentState = 6;
            parse(parser, '€öäü');
            chai.expect(parser.currentState).equal(6);
            testTerminal.compare([]);
            parser.reset();
            testTerminal.clear();
        });
        it('DCS_IGNORE error', function () {
            parser.reset();
            testTerminal.clear();
            parser.currentState = 11;
            parse(parser, '€öäü');
            chai.expect(parser.currentState).equal(11);
            testTerminal.compare([]);
            parser.reset();
            testTerminal.clear();
        });
        it('DCS_PASSTHROUGH error', function () {
            parser.reset();
            testTerminal.clear();
            parser.currentState = 13;
            parse(parser, '\x901;2;3+$a€öäü');
            chai.expect(parser.currentState).equal(13);
            testTerminal.compare([['dcs hook', '+$', [1, 2, 3], 'a'], ['dcs put', '€öäü']]);
            parser.reset();
            testTerminal.clear();
        });
        it('error else of if (code > 159)', function () {
            parser.reset();
            testTerminal.clear();
            parser.currentState = 0;
            parse(parser, '\x9c');
            chai.expect(parser.currentState).equal(0);
            testTerminal.compare([]);
            parser.reset();
            testTerminal.clear();
        });
    });
    describe('set/clear handler', function () {
        var INPUT = '\x1b[1;31mhello \x1b%Gwor\x1bEld!\x1b[0m\r\n$>\x1b]1;foo=bar\x1b\\';
        var parser2 = null;
        var print = '';
        var esc = [];
        var csi = [];
        var exe = [];
        var osc = [];
        var dcs = [];
        function clearAccu() {
            print = '';
            esc.length = 0;
            csi.length = 0;
            exe.length = 0;
            osc.length = 0;
            dcs.length = 0;
        }
        beforeEach(function () {
            parser2 = new TestEscapeSequenceParser();
            clearAccu();
        });
        it('print handler', function () {
            parser2.setPrintHandler(function (data, start, end) {
                for (var i = start; i < end; ++i) {
                    print += TextDecoder_1.stringFromCodePoint(data[i]);
                }
            });
            parse(parser2, INPUT);
            chai.expect(print).equal('hello world!$>');
            parser2.clearPrintHandler();
            parser2.clearPrintHandler();
            clearAccu();
            parse(parser2, INPUT);
            chai.expect(print).equal('');
        });
        it('ESC handler', function () {
            parser2.setEscHandler('%G', function () {
                esc.push('%G');
            });
            parser2.setEscHandler('E', function () {
                esc.push('E');
            });
            parse(parser2, INPUT);
            chai.expect(esc).eql(['%G', 'E']);
            parser2.clearEscHandler('%G');
            parser2.clearEscHandler('%G');
            clearAccu();
            parse(parser2, INPUT);
            chai.expect(esc).eql(['E']);
            parser2.clearEscHandler('E');
            clearAccu();
            parse(parser2, INPUT);
            chai.expect(esc).eql([]);
        });
        it('CSI handler', function () {
            parser2.setCsiHandler('m', function (params, collect) {
                csi.push(['m', params, collect]);
            });
            parse(parser2, INPUT);
            chai.expect(csi).eql([['m', [1, 31], ''], ['m', [0], '']]);
            parser2.clearCsiHandler('m');
            parser2.clearCsiHandler('m');
            clearAccu();
            parse(parser2, INPUT);
            chai.expect(csi).eql([]);
        });
        describe('CSI custom handlers', function () {
            it('Prevent fallback', function () {
                var csiCustom = [];
                parser2.setCsiHandler('m', function (params, collect) { return csi.push(['m', params, collect]); });
                parser2.addCsiHandler('m', function (params, collect) { csiCustom.push(['m', params, collect]); return true; });
                parse(parser2, INPUT);
                chai.expect(csi).eql([], 'Should not fallback to original handler');
                chai.expect(csiCustom).eql([['m', [1, 31], ''], ['m', [0], '']]);
            });
            it('Allow fallback', function () {
                var csiCustom = [];
                parser2.setCsiHandler('m', function (params, collect) { return csi.push(['m', params, collect]); });
                parser2.addCsiHandler('m', function (params, collect) { csiCustom.push(['m', params, collect]); return false; });
                parse(parser2, INPUT);
                chai.expect(csi).eql([['m', [1, 31], ''], ['m', [0], '']], 'Should fallback to original handler');
                chai.expect(csiCustom).eql([['m', [1, 31], ''], ['m', [0], '']]);
            });
            it('Multiple custom handlers fallback once', function () {
                var csiCustom = [];
                var csiCustom2 = [];
                parser2.setCsiHandler('m', function (params, collect) { return csi.push(['m', params, collect]); });
                parser2.addCsiHandler('m', function (params, collect) { csiCustom.push(['m', params, collect]); return true; });
                parser2.addCsiHandler('m', function (params, collect) { csiCustom2.push(['m', params, collect]); return false; });
                parse(parser2, INPUT);
                chai.expect(csi).eql([], 'Should not fallback to original handler');
                chai.expect(csiCustom).eql([['m', [1, 31], ''], ['m', [0], '']]);
                chai.expect(csiCustom2).eql([['m', [1, 31], ''], ['m', [0], '']]);
            });
            it('Multiple custom handlers no fallback', function () {
                var csiCustom = [];
                var csiCustom2 = [];
                parser2.setCsiHandler('m', function (params, collect) { return csi.push(['m', params, collect]); });
                parser2.addCsiHandler('m', function (params, collect) { csiCustom.push(['m', params, collect]); return true; });
                parser2.addCsiHandler('m', function (params, collect) { csiCustom2.push(['m', params, collect]); return true; });
                parse(parser2, INPUT);
                chai.expect(csi).eql([], 'Should not fallback to original handler');
                chai.expect(csiCustom).eql([], 'Should not fallback once');
                chai.expect(csiCustom2).eql([['m', [1, 31], ''], ['m', [0], '']]);
            });
            it('Execution order should go from latest handler down to the original', function () {
                var order = [];
                parser2.setCsiHandler('m', function () { return order.push(1); });
                parser2.addCsiHandler('m', function () { order.push(2); return false; });
                parser2.addCsiHandler('m', function () { order.push(3); return false; });
                parse(parser2, '\x1b[0m');
                chai.expect(order).eql([3, 2, 1]);
            });
            it('Dispose should work', function () {
                var csiCustom = [];
                parser2.setCsiHandler('m', function (params, collect) { return csi.push(['m', params, collect]); });
                var customHandler = parser2.addCsiHandler('m', function (params, collect) { csiCustom.push(['m', params, collect]); return true; });
                customHandler.dispose();
                parse(parser2, INPUT);
                chai.expect(csi).eql([['m', [1, 31], ''], ['m', [0], '']]);
                chai.expect(csiCustom).eql([], 'Should not use custom handler as it was disposed');
            });
            it('Should not corrupt the parser when dispose is called twice', function () {
                var csiCustom = [];
                parser2.setCsiHandler('m', function (params, collect) { return csi.push(['m', params, collect]); });
                var customHandler = parser2.addCsiHandler('m', function (params, collect) { csiCustom.push(['m', params, collect]); return true; });
                customHandler.dispose();
                customHandler.dispose();
                parse(parser2, INPUT);
                chai.expect(csi).eql([['m', [1, 31], ''], ['m', [0], '']]);
                chai.expect(csiCustom).eql([], 'Should not use custom handler as it was disposed');
            });
        });
        it('EXECUTE handler', function () {
            parser2.setExecuteHandler('\n', function () {
                exe.push('\n');
            });
            parser2.setExecuteHandler('\r', function () {
                exe.push('\r');
            });
            parse(parser2, INPUT);
            chai.expect(exe).eql(['\r', '\n']);
            parser2.clearExecuteHandler('\r');
            parser2.clearExecuteHandler('\r');
            clearAccu();
            parse(parser2, INPUT);
            chai.expect(exe).eql(['\n']);
        });
        it('OSC handler', function () {
            parser2.setOscHandler(1, function (data) {
                osc.push([1, data]);
            });
            parse(parser2, INPUT);
            chai.expect(osc).eql([[1, 'foo=bar']]);
            parser2.clearOscHandler(1);
            parser2.clearOscHandler(1);
            clearAccu();
            parse(parser2, INPUT);
            chai.expect(osc).eql([]);
        });
        describe('OSC custom handlers', function () {
            it('Prevent fallback', function () {
                var oscCustom = [];
                parser2.setOscHandler(1, function (data) { return osc.push([1, data]); });
                parser2.addOscHandler(1, function (data) { oscCustom.push([1, data]); return true; });
                parse(parser2, INPUT);
                chai.expect(osc).eql([], 'Should not fallback to original handler');
                chai.expect(oscCustom).eql([[1, 'foo=bar']]);
            });
            it('Allow fallback', function () {
                var oscCustom = [];
                parser2.setOscHandler(1, function (data) { return osc.push([1, data]); });
                parser2.addOscHandler(1, function (data) { oscCustom.push([1, data]); return false; });
                parse(parser2, INPUT);
                chai.expect(osc).eql([[1, 'foo=bar']], 'Should fallback to original handler');
                chai.expect(oscCustom).eql([[1, 'foo=bar']]);
            });
            it('Multiple custom handlers fallback once', function () {
                var oscCustom = [];
                var oscCustom2 = [];
                parser2.setOscHandler(1, function (data) { return osc.push([1, data]); });
                parser2.addOscHandler(1, function (data) { oscCustom.push([1, data]); return true; });
                parser2.addOscHandler(1, function (data) { oscCustom2.push([1, data]); return false; });
                parse(parser2, INPUT);
                chai.expect(osc).eql([], 'Should not fallback to original handler');
                chai.expect(oscCustom).eql([[1, 'foo=bar']]);
                chai.expect(oscCustom2).eql([[1, 'foo=bar']]);
            });
            it('Multiple custom handlers no fallback', function () {
                var oscCustom = [];
                var oscCustom2 = [];
                parser2.setOscHandler(1, function (data) { return osc.push([1, data]); });
                parser2.addOscHandler(1, function (data) { oscCustom.push([1, data]); return true; });
                parser2.addOscHandler(1, function (data) { oscCustom2.push([1, data]); return true; });
                parse(parser2, INPUT);
                chai.expect(osc).eql([], 'Should not fallback to original handler');
                chai.expect(oscCustom).eql([], 'Should not fallback once');
                chai.expect(oscCustom2).eql([[1, 'foo=bar']]);
            });
            it('Execution order should go from latest handler down to the original', function () {
                var order = [];
                parser2.setOscHandler(1, function () { return order.push(1); });
                parser2.addOscHandler(1, function () { order.push(2); return false; });
                parser2.addOscHandler(1, function () { order.push(3); return false; });
                parse(parser2, '\x1b]1;foo=bar\x1b\\');
                chai.expect(order).eql([3, 2, 1]);
            });
            it('Dispose should work', function () {
                var oscCustom = [];
                parser2.setOscHandler(1, function (data) { return osc.push([1, data]); });
                var customHandler = parser2.addOscHandler(1, function (data) { oscCustom.push([1, data]); return true; });
                customHandler.dispose();
                parse(parser2, INPUT);
                chai.expect(osc).eql([[1, 'foo=bar']]);
                chai.expect(oscCustom).eql([], 'Should not use custom handler as it was disposed');
            });
            it('Should not corrupt the parser when dispose is called twice', function () {
                var oscCustom = [];
                parser2.setOscHandler(1, function (data) { return osc.push([1, data]); });
                var customHandler = parser2.addOscHandler(1, function (data) { oscCustom.push([1, data]); return true; });
                customHandler.dispose();
                customHandler.dispose();
                parse(parser2, INPUT);
                chai.expect(osc).eql([[1, 'foo=bar']]);
                chai.expect(oscCustom).eql([], 'Should not use custom handler as it was disposed');
            });
        });
        it('DCS handler', function () {
            parser2.setDcsHandler('+p', {
                hook: function (collect, params, flag) {
                    dcs.push(['hook', collect, params, flag]);
                },
                put: function (data, start, end) {
                    var s = '';
                    for (var i = start; i < end; ++i) {
                        s += TextDecoder_1.stringFromCodePoint(data[i]);
                    }
                    dcs.push(['put', s]);
                },
                unhook: function () {
                    dcs.push(['unhook']);
                }
            });
            parse(parser2, '\x1bP1;2;3+pabc');
            parse(parser2, ';de\x9c');
            chai.expect(dcs).eql([
                ['hook', '+', [1, 2, 3], 'p'.charCodeAt(0)],
                ['put', 'abc'], ['put', ';de'],
                ['unhook']
            ]);
            parser2.clearDcsHandler('+p');
            parser2.clearDcsHandler('+p');
            clearAccu();
            parse(parser2, '\x1bP1;2;3+pabc');
            parse(parser2, ';de\x9c');
            chai.expect(dcs).eql([]);
        });
        it('ERROR handler', function () {
            var errorState = null;
            parser2.setErrorHandler(function (state) {
                errorState = state;
                return state;
            });
            parse(parser2, '\x1b[1;2;€;3m');
            chai.expect(errorState).eql({
                position: 6,
                code: '€'.charCodeAt(0),
                currentState: 4,
                print: -1,
                dcs: -1,
                osc: '',
                collect: '',
                params: [1, 2, 0],
                abort: false
            });
            parser2.clearErrorHandler();
            parser2.clearErrorHandler();
            errorState = null;
            parse(parser2, '\x1b[1;2;a;3m');
            chai.expect(errorState).eql(null);
        });
    });
});
//# sourceMappingURL=EscapeSequenceParser.test.js.map