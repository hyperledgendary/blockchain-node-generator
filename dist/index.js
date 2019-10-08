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
var node_docker_api_1 = require("node-docker-api");
var peer_1 = require("./nodes/peer");
var docker_helper_1 = require("./docker-helper");
// TODO: Make this available from a configuration file
var socket = '/var/run/docker.sock';
var networkId = '692f55707a90fa9085a819b2b2cb1f6a2bb4f9ba20a79ed5d835ec47ca63d69f';
var PEER_IMAGE_NAME = 'hyperledger/fabric-peer';
var ORDERER_IMAGE_NAME = 'hyperledger/fabric-orderer';
var CA_IMAGE_NAME = 'hyperledger/fabric-ca';
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var docker, newDocker, list, configs, peers, orderers, cas, _i, peers_1, containerInfo, container, peer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    docker = new node_docker_api_1.Docker({ socketPath: socket });
                    newDocker = new docker_helper_1.DockerHelper(socket);
                    return [4 /*yield*/, newDocker.list()];
                case 1:
                    list = _a.sent();
                    list = list.filter(filterByNetwork);
                    configs = [];
                    peers = list.filter(isPeer);
                    orderers = list.filter(isOrderer);
                    cas = list.filter(isCA);
                    _i = 0, peers_1 = peers;
                    _a.label = 2;
                case 2:
                    if (!(_i < peers_1.length)) return [3 /*break*/, 5];
                    containerInfo = peers_1[_i];
                    return [4 /*yield*/, newDocker.getContainer(containerInfo)];
                case 3:
                    container = _a.sent();
                    peer = new peer_1.Peer(container, containerInfo);
                    configs.push(peer.generateConfig());
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function filterByNetwork(container) {
    var networkSettings = container.NetworkSettings;
    var networks = networkSettings.Networks;
    var nodeDefault = networks.node_default;
    return nodeDefault.NetworkID === networkId;
}
function isPeer(container) {
    return container.Image.indexOf(PEER_IMAGE_NAME) !== -1;
}
function isOrderer(container) {
    return container.Image.indexOf(ORDERER_IMAGE_NAME) !== -1;
}
function isCA(container) {
    return container.Image.indexOf(CA_IMAGE_NAME) !== -1;
}
main()
    .catch(console.error);
