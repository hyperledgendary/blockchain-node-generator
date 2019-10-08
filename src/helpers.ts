import { Container } from 'node-docker-api/src/container';

const PEER_IMAGE_NAME = 'hyperledger/fabric-peer';
const ORDERER_IMAGE_NAME = 'hyperledger/fabric-orderer';
const CA_IMAGE_NAME = 'hyperledger/fabric-ca';

const nodeTypes: any = {
    [PEER_IMAGE_NAME]: 'fabric-peer',
    [ORDERER_IMAGE_NAME]: 'fabric-orderer',
    [CA_IMAGE_NAME]: 'fabric-ca'
};

export async function isTls(container: Container, isTLSEnvVar: string): Promise<string> {
    const command = `echo $${isTLSEnvVar}`;
    const result = await executeCommand(container, ['/bin/bash', '-c', command]);
    return result.toString('utf8');
}

export async function getProtocol(container: Container, isTLSEnvVar: string) {
    const isTLS = await isTls(container, isTLSEnvVar);
    const containerImageType = getContainerImageType(container);

    switch (containerImageType) {
        case PEER_IMAGE_NAME:
        case ORDERER_IMAGE_NAME:
            return isTLS ? 'grpcs' : 'grpc';
        case CA_IMAGE_NAME:
            return isTls ? 'https' : 'http';
    }
}

export async function getPeerTLSCert(container: Container, tlsRootCertEnvVar: string): Promise<string> {
    const command = `cat $${tlsRootCertEnvVar}`;
    const file = await executeCommand(container, ['/bin/bash', '-c', command]);
    if (file.length === 0) {
        throw new Error('No cert file read');
    }
    const pem = file.toString('base64');
    return pem;
}

export async function getMspId(container: Container, mspIDEnvVar: string): Promise<string> {
    const command = `echo $${mspIDEnvVar}`;
    const result = await executeCommand(container, ['/bin/bash', '-c', command]);
    return result.toString('utf8').trim();
}

export function getContainerImageType(container: Container): string {
    return (container.data as any).Image.split(':')[0];
}

export function getContainerAddress(container: Container): string {
    const data: any = container.data;
    const ports = data.Ports;
    const port = ports[0];
    let parts: string[] = [];
    if (port) {
        parts = [port.IP, port.PublicPort];
    }
    return parts.join(':');
}

export function getContainerName(container: Container): string {
    const data = (container.data as any);
    const names: string[] = data.Names;
    const name: string = names[0];
    return name.substr(1);
}

export function getNodeType(container: Container): string {
    const name = getContainerImageType(container);
    return nodeTypes[name];
}

async function streamLog(stream: any): Promise<Buffer> {
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

async function executeCommand(container: Container, command: string[]): Promise<Buffer> {
    const exec = await container.exec.create({
        AttachStdout: true,
        AttachStderr: false,
        Cmd: command
    });
    const stream = await exec.start({Detach: false});
    return streamLog(stream);
}
