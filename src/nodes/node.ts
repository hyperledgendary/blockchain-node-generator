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
import { getContainerImageType, getContainerName, getMspId, getPeerTLSCert, isTls, getContainerAddress, getProtocol, getNodeType } from '../helpers';
import { ContainerInfo, Container } from 'dockerode';

export class Node {
    container: Container;
    containerInfo: ContainerInfo;
    mspIDEnvVar: string;
    isTLSEnabledEnvVar: string;
    tlsCertPathEnvVar: string;

    constructor(container: Container, containerInfo: ContainerInfo, mspIDEnvVar: string, isTLSEnabledEnvVar: string, tlsCertPathEnvVar: string) {
        this.container = container;
        this.containerInfo = containerInfo;
        this.isTLSEnabledEnvVar = isTLSEnabledEnvVar;
        this.tlsCertPathEnvVar = tlsCertPathEnvVar;
        this.mspIDEnvVar = mspIDEnvVar;
    }

    async isTlsEnabled() {
        return isTls(this.container, this.isTLSEnabledEnvVar);
    }

    async getTlsRootCertificate() {
        return getPeerTLSCert(this.container, this.tlsCertPathEnvVar);
    }

    async getMspId() {
        return getMspId(this.container, this.mspIDEnvVar);
    }

    async getWalletName() {
        let mspId = await this.getMspId();
        const mspIndex = mspId.indexOf('MSP');
        if (mspIndex !== -1) {
            if (mspIndex > 0) {
                mspId = mspId.substr(0, mspIndex);
            } else {
                mspId = mspId.substr(mspIndex, mspId.length - 1);
            }
        }
        return mspId;
    }

    getIdentity() {
        return 'admin';
    }

    getContainerName() {
        return getContainerName(this.containerInfo);
    }

    getContainerImageType() {
        return getContainerImageType(this.containerInfo);
    }

    getContainerAddress() {
        return getContainerAddress(this.containerInfo);
    }

    getProtocol() {
        return getProtocol(this.container, this.containerInfo, this.isTLSEnabledEnvVar);
    }

    getNodeType() {
        return getNodeType(this.containerInfo);
    }

    isRunningLocally() {
        const addressInfo = this.getContainerAddress();
        if (addressInfo.indexOf('0.0.0.0') !== -1 || addressInfo.indexOf('localhost') !== -1) {
            return true;
        } else {
            return false;
        }
    }

    async generateConfig() {
        const protocol = await this.getProtocol();
        const addressInfo: any = this.getContainerAddress();
        const fullAddress = protocol + '://' + addressInfo;
        const def: any = {
            name: this.getContainerName(),
            api_url: fullAddress,
            type: this.getNodeType(),
            msp_id: await this.getMspId(),
            pem: await this.getTlsRootCertificate(),
            wallet: await this.getWalletName(),
            identity: this.getIdentity()
        };
        if (this.isRunningLocally()) {
            def['ssl_target_name_override'] = this.getContainerName();
        }
        return def;
    }
}
