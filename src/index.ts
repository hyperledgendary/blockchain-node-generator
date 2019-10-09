/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
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

let networkName = 'No network set';

async function main(network?: string) {
    const newDocker = new DockerHelper(config.socket);
    const answers: any = await getDockerNetwork(newDocker, network);
    networkName = answers.networkName;

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
    if (container.State !== 'running') {
        return false;
    }

    return !!networks[networkName];
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
    } else {
        if (!networkMap.has(network)) {
            throw new Error(`Network ${network} does not exist`);
        }
        answers = {networkName: network};
    }

    return answers;
}

main(argv.networkName).catch(console.error);
