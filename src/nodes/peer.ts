import { Node } from './node';
import { Container } from 'node-docker-api/src/container';

export class Peer extends Node {
    constructor(container: Container) {
        super(container, 'CORE_PEER_LOCALMSPID', 'CORE_PEER_TLS_ENABLED', 'CORE_PEER_TLS_ROOTCERT_FILE');
    }
}
