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
import { Node } from './node';
import { Container, ContainerInfo } from 'dockerode';
import { executeCommand } from '../helpers';

export class CA extends Node {
    constructor(container: Container, containerInfo: ContainerInfo) {
        super(container, containerInfo, '', 'FABRIC_CA_SERVER_TLS_ENABLED', 'FABRIC_CA_SERVER_TLS_CERTFILE');
    }

    async generateConfig() {
        const def: any = await super.generateConfig();
        def['ca_name'] = await this.getCAName();
        return def;
    }

    async getMspId() {
        let name = super.getContainerName();
        name = name.substr(name.indexOf('.') + 1);
        name = name.substr(0, name.indexOf('.'));
        name = kebabToPascal(name);
        return name.substr(0, name.length - 1) + name.charAt(name.length - 1).toUpperCase();
    }

    async getCAName() {
        const command = `echo -n $FABRIC_CA_SERVER_CA_NAME`;
        const result = await executeCommand(this.container, ['/bin/bash', '-c', command]);
        return result.toString('utf8').trim();
    }
}

function kebabToPascal(str: string) {
    let strArray = str.split('-');

    strArray = strArray.map((p: string) => {
        return p.charAt(0).toUpperCase() + p.substr(1);
    });
    return strArray.join('');
}
