import { Docker } from 'node-docker-api';
import { Container } from 'node-docker-api/src/container';
import { CA } from './nodes/ca';
import { Peer } from './nodes/peer';

// TODO: Make this available from a configuration file
const socket = '/var/run/docker.sock';
const networkId = '692f55707a90fa9085a819b2b2cb1f6a2bb4f9ba20a79ed5d835ec47ca63d69f';
const PEER_IMAGE_NAME = 'hyperledger/fabric-peer';
const ORDERER_IMAGE_NAME = 'hyperledger/fabric-orderer';
const CA_IMAGE_NAME = 'hyperledger/fabric-ca';

async function main() {
    const docker = new Docker({socketPath: socket});

    let list = await docker.container.list();
    list = list.filter(filterByNetwork);
    const configs = [];

    const peers = list.filter(isPeer);
    const orderers = list.filter(isOrderer);
    const cas = list.filter(isCA);

    for (const container of peers) {
        const peer = new Peer(container);
        configs.push(peer.generateConfig());
    }
    // for (const container of orderers) {
    //     configs.push(await generateConfig(container));
    // }
    for (const container of cas) {
        const ca = new CA(container);
        configs.push(ca.generateConfig());
    }
    console.log(JSON.stringify(await Promise.all(configs)));
}

function filterByNetwork(container: Container) {
    const data: any = container.data;
    const networkSettings = data.NetworkSettings;
    const networks = networkSettings.Networks;
    const nodeDefault = networks.node_default;
    return nodeDefault.NetworkID === networkId;
}

function isPeer(container: Container): boolean {
    const data: any = container.data;
    return data.Image.indexOf(PEER_IMAGE_NAME) !== -1;
}

function isOrderer(container: Container): boolean {
    const data: any = container.data;
    return data.Image.indexOf(ORDERER_IMAGE_NAME) !== -1;
}

function isCA(container: Container): boolean {
    const data: any = container.data;
    return data.Image.indexOf(CA_IMAGE_NAME) !== -1;
}

main()
    .catch(console.error) ;
