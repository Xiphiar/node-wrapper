"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsafeResetAll = exports.getClientConfig = exports.getLongVersion = exports.getVersion = exports.RunApp = exports.readDeb = exports.exec = void 0;
const node_util_1 = require("node:util");
const node_child_process_1 = require("node:child_process");
const config_1 = require("./config");
//@ts-ignore
const deb_reader_1 = __importDefault(require("deb-reader"));
exports.exec = (0, node_util_1.promisify)(node_child_process_1.exec);
function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
        (0, node_child_process_1.exec)(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve({ stdout, stderr });
        });
    });
}
exports.default = execShellCommand;
const readDeb = (path) => {
    return new Promise((resolve, reject) => {
        deb_reader_1.default.read(path, (err, res) => {
            if (err) {
                console.warn(err);
            }
            resolve(res);
        });
    });
};
exports.readDeb = readDeb;
const runApp = (onStdOut, onStdErr) => {
    const bin = config_1.APP_BINARY;
    const args = config_1.APP_ARGS ? config_1.APP_ARGS.split(' ') : [];
    const processStdOut = (data) => {
        console.log(data.toString().trim());
        onStdOut(data.toString().trim());
    };
    const processStdErr = (data) => {
        console.error(data.toString().trim());
        onStdOut(data.toString().trim());
    };
    console.log('Starting App', bin, args.join(' '));
    const app = (0, node_child_process_1.spawn)(bin, ['start', ...args]);
    app.stdout.on('data', processStdOut);
    app.stderr.on('data', processStdErr);
    app.on('exit', (code) => {
        if (!code)
            return;
        console.error('App exited with code:', code);
        process.exit(code || 999);
    });
    return app;
};
class RunApp {
    child;
    onStdOut;
    onStdErr;
    constructor(onStdOut, onStdErr) {
        this.child = runApp(onStdOut, onStdErr);
        this.onStdOut = onStdOut;
        this.onStdErr = onStdErr;
        this.start = this.start.bind(this);
        this.restart = this.restart.bind(this);
    }
    start() {
        this.child = runApp(this.onStdOut, this.onStdErr);
    }
    restart() {
        this.child.kill();
        this.start();
    }
}
exports.RunApp = RunApp;
const getVersion = async (path = config_1.APP_BINARY) => {
    const { stdout } = await (0, exports.exec)(`${path} version`);
    return stdout.trim();
};
exports.getVersion = getVersion;
const getLongVersion = async (path = config_1.APP_BINARY) => {
    const { stdout } = await (0, exports.exec)(`${path} version --long --output json`);
    return JSON.parse(stdout);
};
exports.getLongVersion = getLongVersion;
const getClientConfig = async () => {
    const { stdout, stderr } = await (0, exports.exec)(`${config_1.APP_BINARY} config`);
    console.log(stdout, stderr);
    // idfk
    return JSON.parse(stderr.replace('node', '_node'));
};
exports.getClientConfig = getClientConfig;
const unsafeResetAll = async () => {
    const { stdout, stderr } = await (0, exports.exec)(`${config_1.APP_BINARY} tendermint unsafe-reset-all --keep-addr-book`);
    console.log(stdout, stderr);
    // idfk
    return stdout;
};
exports.unsafeResetAll = unsafeResetAll;
