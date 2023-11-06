
import { promisify } from 'node:util'
import { ChildProcessWithoutNullStreams, exec as _exec, spawn } from "node:child_process";
//@ts-ignore
import debreader from 'deb-reader';
import { getWrapConfig } from './toml';
import { setupStatesync } from './cmd/statesync';

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

const isP2p = (str: string) => {
    return /INF.*module.....p2p/.test(str)
}

const runApp = (onLog: (data: string)=>void) => {
    const config = getWrapConfig();
    const bin = config.app_binary_path
    const command = config.app_start_subcommand || 'start'
    const args = config.app_args ? config.app_args.split(' ') : []

    const processLog = (data: Buffer) => {
        const entry = data.toString().trim()

        if (config.hide_log_p2p_info && isP2p(entry)) return;

        console.log(entry)
        onLog(entry)
    }

    console.log('Starting App', bin, args.join(' '))
    const app = spawn(bin, [command, ...args]);

    // All node output is on stderr 🤷 
    app.stdout.on('data', processLog);
    app.stderr.on('data', processLog);

    app.on('exit', (code)=>{
        if (!code) return;

        console.error('App exited with code:', code)
        process.exit(code || 999)
    })

    return app;
}

export class RunApp {
    private child: ChildProcessWithoutNullStreams;
    private onLog: (data: string)=>void;
    private wrapConfig = getWrapConfig();

    constructor(onLog: (data: string)=>void) {
        this.onLog = onLog;

        this.start = this.start.bind(this)
        this.stop = this.stop.bind(this)
        this.restart = this.restart.bind(this)

        this.child = runApp(this.handleLog)

    }

    private handleLog = (logEntry: string) => {
        this.onLog(logEntry)

        if ((this.wrapConfig.auto_recover || false) && logEntry.includes('ERR CONSENSUS FAILURE!!!')) {
            console.log('Found consensus failure, starting reset and statesync.');
            this.stop();
            (async (registryId: string, startCmd: ()=>any)=>{
                await setupStatesync(registryId, undefined, true)
                startCmd()
            })(this.wrapConfig.registry_id, this.start)
        }
    }

    private start() {
        this.child = runApp(this.handleLog)
    }

    private stop() {
        this.child.kill()
    }

    restart() {
        this.stop()
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