"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var node_1 = require("./node");
var Peer = /** @class */ (function (_super) {
    __extends(Peer, _super);
    function Peer(container, containerInfo) {
        return _super.call(this, container, containerInfo, 'CORE_PEER_LOCALMSPID', 'CORE_PEER_TLS_ENABLED', 'CORE_PEER_TLS_ROOTCERT_FILE') || this;
    }
    return Peer;
}(node_1.Node));
exports.Peer = Peer;
