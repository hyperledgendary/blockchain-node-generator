import { Docker } from 'node-docker-api';
import { CA } from './nodes/ca';
import { Peer } from './nodes/peer';
import { Orderer } from './nodes/orderer';
import { DockerHelper } from './docker-helper';
import { ContainerInfo } from 'dockerode';

// TODO: Make this available from a configuration file
const socket = '/var/run/docker.sock';
const networkId = '692f55707a90fa9085a819b2b2cb1f6a2bb4f9ba20a79ed5d835ec47ca63d69f';
const PEER_IMAGE_NAME = 'hyperledger/fabric-peer';
const ORDERER_IMAGE_NAME = 'hyperledger/fabric-orderer';
const CA_IMAGE_NAME = 'hyperledger/fabric-ca';

async function main() {
    const newDocker = new DockerHelper(socket);

    let list = await newDocker.list();
    list = list.filter(filterByNetwork);
    const configs = [];

    const peers = list.filter(isPeer);
    const orderers = list.filter(isOrderer);
    const cas = list.filter(isCA);

    for (const containerInfo of peers) {
        const container = await newDocker.getContainer(containerInfo);
        const peer = new Peer(container, containerInfo);
        configs.push(peer.generateConfig());
    }

    for (const containerInfo of orderers) {
        const container = await newDocker.getContainer(containerInfo);
        const peer = new Orderer(container, containerInfo);
        configs.push(peer.generateConfig());
    }

    for (const containerInfo of cas) {
        const container = await newDocker.getContainer(containerInfo);
        const ca = new CA(container, containerInfo);
        configs.push(ca.generateConfig());
    }
    console.log(JSON.stringify(await Promise.all(configs)));
}

function filterByNetwork(container: ContainerInfo) {
    const networkSettings = container.NetworkSettings;
    const networks = networkSettings.Networks;
    const nodeDefault = networks.node_default;
    return nodeDefault.NetworkID === networkId;
}

function isPeer(container: ContainerInfo): boolean {
    return container.Image.indexOf(PEER_IMAGE_NAME) !== -1;
}

function isOrderer(container: ContainerInfo): boolean {
    return container.Image.indexOf(ORDERER_IMAGE_NAME) !== -1;
}

function isCA(container: ContainerInfo): boolean {
    return container.Image.indexOf(CA_IMAGE_NAME) !== -1;
}

main()
    .catch(console.error) ;
