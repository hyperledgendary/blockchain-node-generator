import Dockerode = require('dockerode');

export class DockerHelper {
    docker: Dockerode;

    constructor(socketPath: string) {
        this.docker = new Dockerode({socketPath});
    }

    async list(): Promise<Dockerode.ContainerInfo[]> {
        return new Promise((resolve, reject) => {
            this.docker.listContainers({all: true}, async (err, containerInfos) => {
                if (err) {
                    return reject(err);
                }
                return resolve(containerInfos);
            });
        });
    }

    async getContainer(info: Dockerode.ContainerInfo) {
        return this.docker.getContainer(info.Id);
    }

    async getNetworks(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.docker.listNetworks({}, (err, networks: any) => {
                if (err) {
                    return reject(err);
                }
                return resolve(networks);
            });
        });
    }
}
