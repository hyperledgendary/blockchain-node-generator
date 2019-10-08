"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("../helpers");
var Node = /** @class */ (function () {
    function Node(container, containerInfo, mspIDEnvVar, isTLSEnabledEnvVar, tlsCertPathEnvVar) {
        this.container = container;
        this.containerInfo = containerInfo;
        this.isTLSEnabledEnvVar = isTLSEnabledEnvVar;
        this.tlsCertPathEnvVar = tlsCertPathEnvVar;
        this.mspIDEnvVar = mspIDEnvVar;
    }
    Node.prototype.isTlsEnabled = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, helpers_1.isTls(this.container, this.isTLSEnabledEnvVar)];
            });
        });
    };
    Node.prototype.getTlsRootCertificate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, helpers_1.getPeerTLSCert(this.container, this.tlsCertPathEnvVar)];
            });
        });
    };
    Node.prototype.getMspId = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, helpers_1.getMspId(this.container, this.mspIDEnvVar)];
            });
        });
    };
    Node.prototype.getWalletName = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mspId, mspIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMspId()];
                    case 1:
                        mspId = _a.sent();
                        mspIndex = mspId.indexOf('MSP');
                        if (mspIndex !== -1) {
                            if (mspIndex > 0) {
                                mspId = mspId.substr(0, mspIndex);
                            }
                            else {
                                mspId = mspId.substr(mspIndex, mspId.length - 1);
                            }
                        }
                        return [2 /*return*/, mspId];
                }
            });
        });
    };
    Node.prototype.getIdentity = function () {
        return 'admin';
    };
    Node.prototype.getContainerName = function () {
        return helpers_1.getContainerName(this.containerInfo);
    };
    Node.prototype.getContainerImageType = function () {
        return helpers_1.getContainerImageType(this.containerInfo);
    };
    Node.prototype.getContainerAddress = function () {
        return helpers_1.getContainerAddress(this.containerInfo);
    };
    Node.prototype.getProtocol = function () {
        return helpers_1.getProtocol(this.container, this.containerInfo, this.isTLSEnabledEnvVar);
    };
    Node.prototype.getNodeType = function () {
        return helpers_1.getNodeType(this.containerInfo);
    };
    Node.prototype.isRunningLocally = function () {
        var addressInfo = this.getContainerAddress();
        if (addressInfo.indexOf('0.0.0.0') !== -1) {
            return true;
        }
        else {
            return false;
        }
    };
    Node.prototype.generateConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var protocol, addressInfo, fullAddress, def, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getProtocol()];
                    case 1:
                        protocol = _b.sent();
                        addressInfo = this.getContainerAddress();
                        fullAddress = protocol + '://' + addressInfo;
                        _a = {
                            name: this.getContainerName(),
                            api_url: fullAddress,
                            type: this.getNodeType()
                        };
                        return [4 /*yield*/, this.getMspId()];
                    case 2:
                        _a.msp_id = _b.sent();
                        return [4 /*yield*/, this.getTlsRootCertificate()];
                    case 3:
                        _a.pem = _b.sent();
                        return [4 /*yield*/, this.getWalletName()];
                    case 4:
                        def = (_a.wallet = _b.sent(),
                            _a.identity = this.getIdentity(),
                            _a);
                        if (this.isRunningLocally()) {
                            def['ssl_target_name_override'] = this.getContainerName();
                        }
                        return [2 /*return*/, def];
                }
            });
        });
    };
    return Node;
}());
exports.Node = Node;
