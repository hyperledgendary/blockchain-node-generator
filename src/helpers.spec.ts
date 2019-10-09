import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import Sinon, * as sinon from 'sinon';
import * as helpers from './helpers';
import { Container, Exec, ContainerInfo } from 'dockerode';
import { Readable } from 'stream';

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
});

async function sleep(n = 1) {
    return new Promise((res: any) => setTimeout(res, n));
}
