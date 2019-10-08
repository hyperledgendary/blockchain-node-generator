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
var _a;
var PEER_IMAGE_NAME = 'hyperledger/fabric-peer';
var ORDERER_IMAGE_NAME = 'hyperledger/fabric-orderer';
var CA_IMAGE_NAME = 'hyperledger/fabric-ca';
var nodeTypes = (_a = {},
    _a[PEER_IMAGE_NAME] = 'fabric-peer',
    _a[ORDERER_IMAGE_NAME] = 'fabric-orderer',
    _a[CA_IMAGE_NAME] = 'fabric-ca',
    _a);
function isTls(container, isTLSEnvVar) {
    return __awaiter(this, void 0, void 0, function () {
        var command, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    command = "echo $" + isTLSEnvVar;
                    return [4 /*yield*/, executeCommand(container, ['/bin/bash', '-c', command])];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.toString('utf8')];
            }
        });
    });
}
exports.isTls = isTls;
function getProtocol(container, containerInfo, isTLSEnvVar) {
    return __awaiter(this, void 0, void 0, function () {
        var isTLS, containerImageType;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, isTls(container, isTLSEnvVar)];
                case 1:
                    isTLS = _a.sent();
                    containerImageType = getContainerImageType(containerInfo);
                    switch (containerImageType) {
                        case PEER_IMAGE_NAME:
                        case ORDERER_IMAGE_NAME:
                            return [2 /*return*/, isTLS ? 'grpcs' : 'grpc'];
                        case CA_IMAGE_NAME:
                            return [2 /*return*/, isTls ? 'https' : 'http'];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.getProtocol = getProtocol;
function getPeerTLSCert(container, tlsRootCertEnvVar) {
    return __awaiter(this, void 0, void 0, function () {
        var command, file, pem;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    command = "cat $" + tlsRootCertEnvVar;
                    return [4 /*yield*/, executeCommand(container, ['/bin/bash', '-c', command])];
                case 1:
                    file = _a.sent();
                    if (file.length === 0) {
                        throw new Error('No cert file read');
                    }
                    pem = file.toString('base64');
                    return [2 /*return*/, pem];
            }
        });
    });
}
exports.getPeerTLSCert = getPeerTLSCert;
function getMspId(container, mspIDEnvVar) {
    return __awaiter(this, void 0, void 0, function () {
        var command, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    command = "echo $" + mspIDEnvVar;
                    return [4 /*yield*/, executeCommand(container, ['/bin/bash', '-c', command])];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.toString('utf8').trim()];
            }
        });
    });
}
exports.getMspId = getMspId;
function getContainerImageType(container) {
    return container.Image.split(':')[0];
}
exports.getContainerImageType = getContainerImageType;
function getContainerAddress(container) {
    var ports = container.Ports;
    var port = ports[0];
    var parts = [];
    if (port) {
        parts = [port.IP, port.PublicPort];
    }
    return parts.join(':');
}
exports.getContainerAddress = getContainerAddress;
function getContainerName(container) {
    var names = container.Names;
    var name = names[0];
    return name.substr(1);
}
exports.getContainerName = getContainerName;
function getNodeType(container) {
    var name = getContainerImageType(container);
    return nodeTypes[name];
}
exports.getNodeType = getNodeType;
function streamLog(stream) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            data = '';
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    stream.on('data', function (d) {
                        d = d.filter(function (n) {
                            if ((n > 0x20 && n < 0x7F) || (n > 0xA1) || n === 0x0D || n === 0xA0 || n === 0x0A || n === 0x20) {
                                return true;
                            }
                            else {
                                return false;
                            }
                        });
                        data += d.toString('utf8');
                    });
                    stream.on('end', function () {
                        if (!data) {
                            resolve(Buffer.alloc(0));
                        }
                        else {
                            resolve(Buffer.from(data));
                        }
                    });
                    stream.on('error', reject);
                })];
        });
    });
}
exports.streamLog = streamLog;
function executeCommand(container, command) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // const exec = await container.exec.create({
            //     AttachStdout: true,
            //     AttachStderr: false,
            //     Cmd: command
            // });
            // const stream = await exec.start({Detach: false});
            // return streamLog(stream);
            return [2 /*return*/, Buffer.from('')];
        });
    });
}
exports.executeCommand = executeCommand;
