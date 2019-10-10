#!/usr/bin/env node
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
import { writeFileSync } from 'fs';
import { DockerHelper } from './docker-helper';
import { CA } from './nodes/ca';
import { Orderer } from './nodes/orderer';
import { Peer } from './nodes/peer';
import inquirer = require('inquirer');
import yargs = require('yargs');
import { join } from 'path';

const argv: any = yargs.argv;

const defaultConfig = {
    socket: '/var/run/docker.sock',
    PEER_IMAGE_NAME: 'hyperledger/fabric-peer',
    ORDERER_IMAGE_NAME: 'hyperledger/fabric-orderer',
    CA_IMAGE_NAME: 'hyperledger/fabric-ca',
    env_path: argv.envFilePath ? argv.envFilePath : './',
    env_name: argv.envName ? argv.envName : 'env.json',
    networkName: argv.networkName ? argv.networkName : 'node_default'
};

const config = Object.assign({}, defaultConfig);

async function main() {
    const newDocker = new DockerHelper(config.socket);
    await getDockerNetwork(newDocker);

    let list = await newDocker.list();
    console.log(`\x1b[32m\u2714\x1b[0m Found ${list.length} docker containers.`);
    list = list.filter(filterByNetwork);
    const configs = [];

    const peers = list.filter(isPeer);
    const orderers = list.filter(isOrderer);
    const cas = list.filter(isCA);

    console.log(`\x1b[32m\u2714\x1b[0m Found ${peers.length} Peers.`);
    for (const containerInfo of peers) {
        const container = await newDocker.getContainer(containerInfo);
        const peer = new Peer(container, containerInfo);
        configs.push(peer.generateConfig());
    }

    console.log(`\x1b[32m\u2714\x1b[0m Found ${orderers.length} Orderers.`);
    for (const containerInfo of orderers) {
        const container = await newDocker.getContainer(containerInfo);
        const peer = new Orderer(container, containerInfo);
        configs.push(peer.generateConfig());
    }

    console.log(`\x1b[32m\u2714\x1b[0m Found ${cas.length} CAs.`);
    for (const containerInfo of cas) {
        const container = await newDocker.getContainer(containerInfo);
        const ca = new CA(container, containerInfo);
        configs.push(ca.generateConfig());
    }
    const fullPath = buildFilePath();
    console.debug('Waiting for promises to complete');
    const nodes = await Promise.all(configs);
    console.log(`\x1b[32m\u2714\x1b[0m Promises complete. Writing to ${fullPath}`);

    writeFileSync(fullPath, JSON.stringify(nodes));
    console.log(`\x1b[32m\u2714\x1b[0m ${fullPath} created`);
}

function filterByNetwork(container: ContainerInfo) {
    const networkSettings = container.NetworkSettings;
    const networks = networkSettings.Networks;
    if (container.State !== 'running') {
        return false;
    }
    return !!networks[config.networkName];
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

function buildFilePath() {
    return join(config.env_path, config.env_name);
}

async function getDockerNetwork(docker: DockerHelper) {
    const networks = await docker.getNetworks();
    const networkMap = new Map();

    for (const net of networks) {
        networkMap.set(net.Name, net.Id);
    }
    let answers;
    if (!argv.networkName) {
        answers = await inquirer.prompt({
            type: 'list',
            name: 'networkName',
            message: 'Which docker network do you want to use?',
            default: config.networkName,
            validate: (answer: string) => {
                return networkMap.has(answer);
            },
            choices: Array.from(networkMap.keys())
        } as any) as any;
        config.networkName = answers.networkName;
    } else {
        if (!networkMap.has(argv.networkName)) {
            throw new Error(`Network ${argv.networkName} does not exist`);
        }
        config.networkName = argv.networkName;
    }

    return answers;
}

main().catch(console.error);
