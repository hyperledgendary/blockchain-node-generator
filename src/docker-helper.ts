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
