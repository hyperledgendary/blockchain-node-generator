import { ContainerInfo } from 'dockerode';
import { DockerHelper } from './docker-helper';
import { CA } from './nodes/ca';
import { Orderer } from './nodes/orderer';
import { Peer } from './nodes/peer';
import inquirer = require('inquirer');
import { writeFileSync } from 'fs';
import yargs = require('yargs');

const argv: any = yargs.argv;

const defaultConfig = {
    socket: '/var/run/docker.sock',
    PEER_IMAGE_NAME: 'hyperledger/fabric-peer',
    ORDERER_IMAGE_NAME: 'hyperledger/fabric-orderer',
    CA_IMAGE_NAME: 'hyperledger/fabric-ca',
    env_file: 'env.json'
};

const config = Object.assign({}, defaultConfig);

let networkId = 'No network set';

async function main(network?: string) {
    const newDocker = new DockerHelper(config.socket);
    const answers: any = await getDockerNetwork(newDocker, network);
    networkId = answers.networkId;

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
    writeFileSync(config.env_file, JSON.stringify(await Promise.all(configs)));
}

function filterByNetwork(container: ContainerInfo) {
    const networkSettings = container.NetworkSettings;
    const networks = networkSettings.Networks;
    const nodeDefault = networks.node_default;
    if (!nodeDefault) {
        throw new Error('node_default does not exist');
    }
    return nodeDefault.NetworkID === networkId;
}

function isPeer(container: ContainerInfo): boolean {
    return container.Image.indexOf(config.PEER_IMAGE_NAME) !== -1;
}

function isOrderer(container: ContainerInfo): boolean {
    return container.Image.indexOf(config.ORDERER_IMAGE_NAME) !== -1;
}

function isCA(container: ContainerInfo): boolean {
    return container.Image.indexOf(config.CA_IMAGE_NAME) !== -1;
}

async function getDockerNetwork(docker: DockerHelper, network?: string) {
    const networks = await docker.getNetworks();
    const networkMap = new Map();

    for (const net of networks) {
        networkMap.set(net.Name, net.Id);
    }
    let answers;
    if (!network) {
        answers = await inquirer.prompt({
            type: 'list',
            name: 'networkName',
            message: 'Which docker network do you want to use?',
            default: 'node_default',
            validate: (answer: string) => {
                return networkMap.has(answer);
            },
            choices: Array.from(networkMap.keys())
        } as any) as any;
        answers.networkId = networkMap.get(answers.networkId);
    } else {
        if (!networkMap.has(network)) {
            throw new Error(`Network ${network} does not exist`);
        }
        answers = {networkId: networkMap.get(network)};
    }

    return answers;
}

main(argv.networkName).catch(console.error);
