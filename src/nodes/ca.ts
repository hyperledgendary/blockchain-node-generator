import { Container } from 'node-docker-api/lib/container';
import { Node } from './node';

export class CA extends Node {
    constructor(container: Container) {
        super(container, '', 'FABRIC_CA_SERVER_TLS_ENABLED', 'FABRIC_CA_SERVER_TLS_CERTFILE');
    }

    async generateConfig() {
        const def: any = await super.generateConfig();
        def['ca_name'] = this.getContainerName();
        return def;
    }

    async getMspId() {
        let name = super.getContainerName();
        name = name.substr(name.indexOf('.') + 1);
        name = name.substr(0, name.indexOf('.'));
        name = kebabToPascal(name);
        return name.substr(0, name.length - 1) + name.charAt(name.length - 1).toUpperCase();
    }
}

function kebabToPascal(str: string) {
    let strArray = str.split('-');

    strArray = strArray.map((p: string) => {
        return p.charAt(0).toUpperCase() + p.substr(1);
    });
    return strArray.join('');
}
