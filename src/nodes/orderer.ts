import { Container, ContainerInfo } from 'dockerode';
import { Node } from './node';

export class Orderer extends Node {
    constructor(container: Container, containerInfo: ContainerInfo) {
        super(container, containerInfo, 'ORDERER_GENERAL_LOCALMSPID', 'ORDERER_GENERAL_TLS_ENABLED', 'ORDERER_GENERAL_TLS_CERTIFICATE');
    }
}
