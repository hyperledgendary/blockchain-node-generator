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
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Container, ContainerInfo, Exec } from 'dockerode';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { Readable } from 'stream';
import * as helpers from './helpers';

chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Helpers', () => {
    let sandbox: sinon.SinonSandbox;
    let containerStub: sinon.SinonStubbedInstance<Container>;
    let execStub: sinon.SinonStubbedInstance<Exec>;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        containerStub = sandbox.createStubInstance(Container);
        execStub = sandbox.createStubInstance(Exec);
    });

    afterEach(() => {
        sandbox.reset();
    });

    describe('#isTls', () => {
        let streamStub: Readable;

        beforeEach(() => {
            streamStub = new Readable();
            streamStub._read = () => { /* do nothing */ };
        });

        it('should throw if the stream errors whilst data is being sent', async () => {
            containerStub.exec.yields(null, execStub);
            execStub.start.yields(null, streamStub);
            const promise = helpers.isTls(containerStub as Container, 'SOME_ENV_VAR');

            await sleep();
            streamStub.emit('data', Buffer.from('true'));
            streamStub.emit('error', new Error('Stream failed'));
            streamStub.emit('end');
            await expect(promise).to.be.rejectedWith('Stream failed');
            expect(containerStub.exec).to.have.been.calledWith({
                AttachStderr: false,
                AttachStdout: true,
                Cmd: ['/bin/bash', '-c', 'echo $SOME_ENV_VAR'],
                statusCodes: { 200: true, 404: 'no such exec instance', 409: 'container is paused'}
            });
        });

        it('should throw if the stream errors', async () => {
            containerStub.exec.yields(null, execStub);
            execStub.start.yields(null, streamStub);
            const promise = helpers.isTls(containerStub as Container, 'SOME_ENV_VAR');

            await sleep();
            streamStub.emit('error', new Error('Stream failed'));
            streamStub.emit('end');
            await expect(promise).to.be.rejectedWith('Stream failed');
            expect(containerStub.exec).to.have.been.calledWith({
                AttachStderr: false,
                AttachStdout: true,
                Cmd: ['/bin/bash', '-c', 'echo $SOME_ENV_VAR'],
                statusCodes: { 200: true, 404: 'no such exec instance', 409: 'container is paused'}
            });
        });

        it('should return the stringified result of a Buffer', async () => {
            containerStub.exec.yields(null, execStub);
            execStub.start.yields(null, streamStub);
            const promise = helpers.isTls(containerStub as Container, 'SOME_ENV_VAR');

            await sleep();
            streamStub.emit('data', Buffer.from('true'));
            streamStub.emit('end');
            await expect(promise).to.eventually.equal(true);
            expect(containerStub.exec).to.have.been.calledWith({
                AttachStderr: false,
                AttachStdout: true,
                Cmd: ['/bin/bash', '-c', 'echo $SOME_ENV_VAR'],
                statusCodes: { 200: true, 404: 'no such exec instance', 409: 'container is paused'}
            });
            // tslint:disable-next-line:no-unused-expression
            expect(execStub.start).to.have.been.called;
        });
    });

    describe('#getProtocol', () => {
        let tlsStreamStub: Readable;
        beforeEach(() => {
            tlsStreamStub = new Readable();
            tlsStreamStub._read = () => { /* do nothing */ };
        });

        it('should return grpcs if tls is on', async () => {
            containerStub.exec.onFirstCall().yields(null, execStub);
            execStub.start.onFirstCall().yields(null, tlsStreamStub);

            const promise = helpers.getProtocol(
                containerStub as Container,
                {Image: 'hyperledger/fabric-peer'} as ContainerInfo,
                'SOME_ENV_VAR'
            );

            await sleep();
            tlsStreamStub.emit('data', Buffer.from('true'));
            tlsStreamStub.emit('end');
            await expect(promise).to.eventually.equal('grpcs');
        });

        it('should return grpc if tls is off', async () => {
            containerStub.exec.onFirstCall().yields(null, execStub);
            execStub.start.onFirstCall().yields(null, tlsStreamStub);

            const promise = helpers.getProtocol(
                containerStub as Container,
                {Image: 'hyperledger/fabric-orderer'} as ContainerInfo,
                'SOME_ENV_VAR'
            );

            await sleep();
            tlsStreamStub.emit('data', Buffer.from('false'));
            tlsStreamStub.emit('end');
            await expect(promise).to.eventually.equal('grpc');
        });

        it('should return https if tls is on', async () => {
            containerStub.exec.onFirstCall().yields(null, execStub);
            execStub.start.onFirstCall().yields(null, tlsStreamStub);

            const promise = helpers.getProtocol(
                containerStub as Container,
                {Image: 'hyperledger/fabric-ca'} as ContainerInfo,
                'SOME_ENV_VAR'
            );

            await sleep();
            tlsStreamStub.emit('data', Buffer.from('true'));
            tlsStreamStub.emit('end');
            await expect(promise).to.eventually.equal('https');
        });

        it('should return http if tls is off', async () => {
            containerStub.exec.onFirstCall().yields(null, execStub);
            execStub.start.onFirstCall().yields(null, tlsStreamStub);

            const promise = helpers.getProtocol(
                containerStub as Container,
                {Image: 'hyperledger/fabric-ca'} as ContainerInfo,
                'SOME_ENV_VAR'
            );

            await sleep();
            tlsStreamStub.emit('data', Buffer.from('false'));
            tlsStreamStub.emit('end');
            await expect(promise).to.eventually.equal('http');
        });
    });

    describe('#getPeerTLSCert', () => {
        let stream: Readable;
        beforeEach(() => {
            stream = new Readable();
            stream._read = () => { /* do nothing */ };
        });

        it('should call execute with the correct parameters', async () => {
            containerStub.exec.onFirstCall().yields(null, execStub);
            execStub.start.onFirstCall().yields(null, stream);

            const promise = helpers.getPeerTLSCert(containerStub as Container, 'THIS_ENV_VAR');
            await sleep();
            const cert = Buffer.from('CERT');
            stream.emit('data', cert);
            stream.emit('end');
            await expect(promise).to.eventually.equal(cert.toString('base64'));

            expect(containerStub.exec).to.have.been.calledWith({
                AttachStderr: false,
                AttachStdout: true,
                Cmd: ['/bin/bash', '-c', 'cat $THIS_ENV_VAR'],
                statusCodes: { 200: true, 404: 'no such exec instance', 409: 'container is paused'}
            });
        });

        it('should throw if no certificate file is read', async () => {
            containerStub.exec.onFirstCall().yields(null, execStub);
            execStub.start.onFirstCall().yields(null, stream);

            const promise = helpers.getPeerTLSCert(containerStub as Container, 'THIS_ENV_VAR');
            await sleep();
            const cert = Buffer.from('');
            stream.emit('data', cert);
            stream.emit('end');
            await expect(promise).to.be.rejectedWith('No cert file read');
        });
    });

    describe('#getMspId', () => {
        let stream: Readable;
        beforeEach(() => {
            stream = new Readable();
            stream._read = () => { /* do nothing */ };
        });

        it('should call execute with the correct parameters', async () => {
            containerStub.exec.onFirstCall().yields(null, execStub);
            execStub.start.onFirstCall().yields(null, stream);

            const promise = helpers.getPeerTLSCert(containerStub as Container, 'MSP_ENV');
            await sleep();
            const cert = Buffer.from('MSPID');
            stream.emit('data', cert);
            stream.emit('end');
            await expect(promise).to.eventually.equal(cert.toString('base64'));

            expect(containerStub.exec).to.have.been.calledWith({
                AttachStderr: false,
                AttachStdout: true,
                Cmd: ['/bin/bash', '-c', 'cat $MSP_ENV'],
                statusCodes: { 200: true, 404: 'no such exec instance', 409: 'container is paused'}
            });
        });
    });

    describe('#getContainerImageType', () => {
        it('should get the image type', () => {
            const containerInfo = {Image: 'fabric-peer:1.4.4'} as ContainerInfo;
            expect(helpers.getContainerImageType(containerInfo)).to.equal('fabric-peer');
        });
    });

    describe('#getContainerName', () => {
        it('should get the container name', () => {
            // Docker adds random character before the name
            const containerInfo = {Names: ['*ContainerName']} as ContainerInfo;
            expect(helpers.getContainerName(containerInfo)).to.equal('ContainerName');
        });

        it('should get the first container name', () => {
            const containerInfo = {Names: ['*ContainerName0', '*ContainerName1']} as ContainerInfo;
            expect(helpers.getContainerName(containerInfo)).to.equal('ContainerName0');
        });
    });

    describe('#getNodeType', () => {
        it('should return the correct node type', () => {
            const containerInfo = {Image: 'hyperledger/fabric-peer:1.4.4'} as ContainerInfo;
            expect(helpers.getNodeType(containerInfo)).to.equal('fabric-peer');
        });
    });

    describe('#getExec', () => {
        it('should throw if getting the exec fails', async () => {
            containerStub.exec.onFirstCall().yields(new Error('Exec fail'), null);

            await expect(helpers.getPeerTLSCert(containerStub as Container, 'MSP_ENV')).to.be.rejectedWith('Exec fail');
        });
    });

    describe('#getData', () => {
        it('should throw if starting exec fails', async () => {
            containerStub.exec.onFirstCall().yields(null, execStub);
            execStub.start.onFirstCall().yields(new Error('Start fail'), null);

            await expect(helpers.getPeerTLSCert(containerStub as Container, 'MSP_ENV')).to.be.rejectedWith('Start fail');
        });
    });
});

async function sleep(n = 1) {
    return new Promise((res: any) => setTimeout(res, n));
}
