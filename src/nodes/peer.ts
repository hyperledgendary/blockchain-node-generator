import { Node } from './node';
import { ContainerInfo, Container } from 'dockerode';

export class Peer extends Node {
    constructor(container: Container, containerInfo: ContainerInfo) {
        super(container, containerInfo, 'CORE_PEER_LOCALMSPID', 'CORE_PEER_TLS_ENABLED', 'CORE_PEER_TLS_ROOTCERT_FILE');
    }
}
