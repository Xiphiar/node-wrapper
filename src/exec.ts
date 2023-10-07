
import { promisify } from 'node:util'
import { ChildProcessWithoutNullStreams, exec as _exec, spawn } from "node:child_process";
//@ts-ignore
import debreader from 'deb-reader';
import { getWrapConfig } from './toml';

export const exec = promisify(_exec);

export default function execShellCommand(cmd: string): Promise<{stdout: string, stderr: string}> {
    return new Promise((resolve, reject) => {
        _exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve({stdout, stderr});
        });
    });
}

export const readDeb = (path: string): Promise<{controlFile: any, fileList: string[]}> => {
    return new Promise((resolve, reject) => {
        debreader.read(path, (err: any, res: any)=>{
            if (err) {
                console.warn(err);
            }
            resolve(res);
        });
    });
}

const runApp = (onStdOut: (data: string)=>void, onStdErr: (data: string)=>void) => {
    const config = getWrapConfig();
    const bin = config.app_binary
    const args = config.app_args ? config.app_args.split(' ') : []

    const processStdOut = (data: Buffer) => {
        console.log(data.toString().trim())
        onStdOut(data.toString().trim())
    }

    const processStdErr = (data: Buffer) => {
        console.error(data.toString().trim())
        onStdOut(data.toString().trim())
    }

    console.log('Starting App', bin, args.join(' '))
    const app = spawn(bin, ['start', ...args]);

    app.stdout.on('data', processStdOut);
    app.stderr.on('data', processStdErr);

    app.on('exit', (code)=>{
        if (!code) return;

        console.error('App exited with code:', code)
        process.exit(code || 999)
    })

    return app;
}

export class RunApp {
    private child: ChildProcessWithoutNullStreams;
    private onStdOut: (data: string)=>void;
    private onStdErr: (data: string)=>void;

    constructor(onStdOut: (data: string)=>void, onStdErr: (data: string)=>void) {
        this.child = runApp(onStdOut, onStdErr)
        this.onStdOut = onStdOut;
        this.onStdErr = onStdErr;

        this.start = this.start.bind(this)
        this.restart = this.restart.bind(this)
    }

    private start() {
        this.child = runApp(this.onStdOut, this.onStdErr)
    }

    restart() {
        this.child.kill()
        this.start()
    }
}

export const getVersion = async (path: string = getWrapConfig().app_binary) => {
    const {stdout} = await exec(`${path} version`)
    return stdout.trim()
}

export const getLongVersion = async (path: string = getWrapConfig().app_binary) => {
    const {stdout} = await exec(`${path} version --long --output json`)
    return JSON.parse(stdout);
}

export const getClientConfig = async () => {
    const {stdout, stderr} = await exec(`${getWrapConfig().app_binary} config`)
    console.log(stdout, stderr)

    // idfk
    return JSON.parse(stderr.replace('node', '_node'));
}

export const unsafeResetAll = async () => {
    const {stdout, stderr} = await exec(`${getWrapConfig().app_binary} tendermint unsafe-reset-all --keep-addr-book`)
    console.log(stdout, stderr)

    // idfk
    return stdout;
}