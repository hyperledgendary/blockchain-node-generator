import Dockerode = require('dockerode');
import { streamLog } from './helpers';

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
}
