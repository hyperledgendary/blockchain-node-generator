import { ContainerInfo } from 'dockerode';
import Dockerode = require('dockerode');
import { ECANCELED } from 'constants';

const PEER_IMAGE_NAME = 'hyperledger/fabric-peer';
const ORDERER_IMAGE_NAME = 'hyperledger/fabric-orderer';
const CA_IMAGE_NAME = 'hyperledger/fabric-ca';

const nodeTypes: any = {
    [PEER_IMAGE_NAME]: 'fabric-peer',
    [ORDERER_IMAGE_NAME]: 'fabric-orderer',
    [CA_IMAGE_NAME]: 'fabric-ca'
};

export async function isTls(container: Dockerode.Container, isTLSEnvVar: string): Promise<string> {
    const command = `echo $${isTLSEnvVar}`;
    const result = await executeCommand(container, ['/bin/bash', '-c', command]);
    return result.toString('utf8');
}

export async function getProtocol(container: Dockerode.Container, containerInfo: ContainerInfo, isTLSEnvVar: string) {
    const isTLS = await isTls(container, isTLSEnvVar);
    const containerImageType = getContainerImageType(containerInfo);

    switch (containerImageType) {
        case PEER_IMAGE_NAME:
        case ORDERER_IMAGE_NAME:
            return isTLS ? 'grpcs' : 'grpc';
        case CA_IMAGE_NAME:
            return isTls ? 'https' : 'http';
    }
}

export async function getPeerTLSCert(container: Dockerode.Container, tlsRootCertEnvVar: string): Promise<string> {
    const command = `cat $${tlsRootCertEnvVar}`;
    const file = await executeCommand(container, ['/bin/bash', '-c', command]);
    if (file.length === 0) {
        throw new Error('No cert file read');
    }
    const pem = file.toString('base64');
    return pem;
}

export async function getMspId(container: Dockerode.Container, mspIDEnvVar: string): Promise<string> {
    const command = `echo $${mspIDEnvVar}`;
    const result = await executeCommand(container, ['/bin/bash', '-c', command]);
    return result.toString('utf8').trim();
}

export function getContainerImageType(container: ContainerInfo): string {
    return (container as any).Image.split(':')[0];
}

export function getContainerAddress(container: ContainerInfo): string {
    const ports = container.Ports;
    const port = ports[0];
    let parts: string[] = [];
    if (port) {
        parts = [port.IP, port.PublicPort as any];
    }
    return parts.join(':');
}

export function getContainerName(container: ContainerInfo): string {
    const names: string[] = container.Names;
    const name: string = names[0];
    return name.substr(1);
}

export function getNodeType(container: ContainerInfo): string {
    const name = getContainerImageType(container);
    return nodeTypes[name];
}

export async function streamLog(stream: any): Promise<Buffer> {
    let data: string = '';
    return new Promise((resolve, reject) => {
        stream.on('data', (d: any) => {
            d = d.filter((n: number) => {
                if ((n > 0x20 && n < 0x7F) || (n > 0xA1) || n === 0x0D || n === 0xA0 || n === 0x0A || n === 0x20) {
                    return true;
                } else {
                    return false;
                }
            });
            data += d.toString('utf8');
        });
        stream.on('end', () => {
            if (!data) {
                resolve(Buffer.alloc(0));
            } else {
                resolve(Buffer.from(data));
            }
        });
        stream.on('error', reject);
    });
}

export async function executeCommand(container: Dockerode.Container, command: string[]): Promise <Buffer > {
    // const exec = await container.exec.create({
    //     AttachStdout: true,
    //     AttachStderr: false,
    //     Cmd: command
    // });
    // const stream = await exec.start({Detach: false});
    // return streamLog(stream);
    const options = {
        Cmd: command,
        AttachStdout: true,
        AttachStderr: false,
        statusCodes: {
            200: true,
            404: 'no such exec instance',
            409: 'container is paused'
        }
    };
    const data = await getData(container, options);

    return streamLog(data);
}

async function getExec(container: Dockerode.Container, options: any) {
    const exec: Dockerode.Exec = await new Promise((resolve, reject) => {
        container.exec(options, (err, ex) => {
            if (err) {
                return reject(err);
            }
            return resolve(ex);
        });
    });
    return exec;
}

async function getData(container: Dockerode.Container, options: any) {
    const exec = await getExec(container, options);
    const data = await new Promise((resolve, reject) => {
        // tslint:disable-next-line: no-floating-promises
        exec.start((err: any, stream: any) => {
            if (err) {
                return reject(err);
            }
            resolve(stream);
        });
    });
    return data;
}
