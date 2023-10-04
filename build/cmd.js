"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const figlet_1 = __importDefault(require("figlet"));
const wrapper_1 = require("./wrapper");
const Config = __importStar(require("./config"));
const exec_1 = require("./exec");
const toml_1 = require("./toml");
const axios_1 = __importDefault(require("axios"));
const program = new commander_1.Command();
console.log(figlet_1.default.textSync("NodeWrap"));
program
    .version("0.0.2")
    .description("Idk some description eventually")
    .parse(process.argv);
program.command('start')
    .description('Starts tendermint node')
    .action((str, options) => {
    try {
        (0, wrapper_1.startWrapper)();
    }
    catch (e) {
        console.error('Failed to launch node instance:', e.toString());
    }
});
program.command('config')
    .description('Prints current env config')
    .action((str, options) => {
    try {
        Object.entries(Config).forEach(c => {
            console.log(`${c[0]} = ${c[1]}`);
        });
    }
    catch (e) {
        console.error('Failed to get env config:', e.toString());
    }
});
program.command('statesync')
    .description('Configure statesync for a node')
    .requiredOption('--rpc <url>', 'RPC url to use for statesync')
    .option('--reset', 'Optional. Also perform an unsafe reset of all data')
    .action(async (options, command) => {
    try {
        console.log('AAA');
        return;
        // console.log(options)
        // if (!options.rpc) command.help({error: true})
        // console.log(options.rpc)
        const { data: latest } = await axios_1.default.get(`${options.rpc}/block`);
        console.log(latest);
        if (options.reset) {
            await (0, exec_1.unsafeResetAll)();
        }
        ;
        const config = (0, toml_1.getConfig)();
        config.statesync.enable = true;
        config.statesync.rpc_servers = `${options.rpc},${options.rpc}`;
        // config.statesync.
    }
    catch (e) {
        console.error('Error:', e.toString());
    }
});
const options = program.opts();
const command = program.parse();
// if (!process.argv.slice(2).length) {
//     program.outputHelp();
// }
