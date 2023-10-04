import { Command } from 'commander';
import figlet from 'figlet';
import { startWrapper } from './wrapper';
import {config} from './config'
import { unsafeResetAll } from './exec';
import { getApp, getConfig, getWrapConfig, saveApp, saveConfig } from './toml';
import axios from 'axios';
import { getBlock, getChainRegistry } from './getters';
import { findGoodRpc } from './helpers';

const program = new Command();

console.log(figlet.textSync("NodeWrap"));

program 
    .version("0.0.2")
    .description("Idk some description eventually")
    // .parse(process.argv);

program.command('start')
    .description('Starts tendermint node')
    .action((str, options) => {
        try {
            startWrapper();
        } catch(e: any) {
            console.error('Failed to launch node instance:', e.toString())
        }
    });

program.command('config')
    .description('Prints current config')
    .action((str, options) => {
        try {
            console.table(config)
        } catch(e: any) {
            console.error('Failed to get config:', e.toString())
        }
    });

program.command('statesync')
    .description('Configure statesync for a node')
    .option('--rpc <url>', 'RPC url to use for statesync')
    .option('--chain <name>', 'Cosmos Directory chain name to use if RPC is not defined')
    .option('--reset', 'Optional. Also perform an unsafe reset of all data')
    .action(async (options, command: Command) => {
        if (!options.rpc && !options.chain) {
            console.error('Either --rpc or --chain is required.\n')
            command.help({error: true})
        }
        try {
            let rpc = options.rpc;
            if (!rpc) {
                rpc = await findGoodRpc(options.chain)
                console.log('RPC!', rpc)
            }

            const latest = await getBlock(rpc);

            const latestHeight = parseInt(latest.result.block.header.height)
            const ssHeight = Math.round((latestHeight - 1000)/1000)*1000
            const {data: ssBlock} = await axios.get(`${rpc.replace(/\/$/, '')}/block?height=${ssHeight}`);
            const ssHash = ssBlock.result.block_id.hash

            if (options.reset) {
                await unsafeResetAll()
            };

            const config = getConfig();

            config.statesync.enable = true;
            config.statesync.rpc_servers = `${rpc},${rpc}`
            config.statesync.trust_height = ssHeight;
            config.statesync.trust_hash = ssHash;
            config.statesync.discovery_time = '30s';

            saveConfig(config);
            console.log(`Trust Height: ${ssHeight}`)
            console.log(`Trust Hash: ${ssHash}`)
            console.log(`Statesync configured, ready to start!`)

        } catch(e: any) {
            console.error('Error:', e.toString())
        }
    })

program.command('seeds')
    .description('Configure seeds for a node')
    .requiredOption('--chain <name>', 'Cosmos Directory chain name to use')
    .action(async (options, command: Command) => {
        try {

            const registry = await getChainRegistry(options.chain)
            const seeds = registry.peers.seeds.map((s: any)=>`${s.id}@${s.address}`);
            const peers = registry.peers.persistent_peers.map((s: any)=>`${s.id}@${s.address}`);
            console.log(`Found ${seeds.length} seeds and ${peers.length} peers`)
            const config = getConfig();
            console.log(seeds)
            if (seeds.length){
                config.p2p.seeds = seeds.join(',')
                console.log(`Seeds configured!`)
            } else if (peers.length) {
                config.p2p.persistent_peers = peers.join(',')
                console.log(`Peers configured!`)
            }

            saveConfig(config);
            

        } catch(e: any) {
            console.error('Error:', e.toString())
        }
    })

program.command('setup')
    .description('Setup config for an API node')
    .requiredOption('--ip <ip>', 'External IP to bind to')
    .option('--prefix <prefix>', 'Optional prefix to use for bound ports. Default ports will be used is undefined')
    .action(async (options, command: Command) => {
        try {
            const BIND_ADDR = options.ip
            const P2P = `${options.prefix || 26}656`
            const RPC = `${options.prefix || 26}657`
            const METRICS = `${options.prefix || 26}660`
            const LCD = options.prefix ? `${options.prefix}317` : '1317'
            const GRPC = options.prefix ? `${options.prefix}090` : '9090'
            const GRPCW = options.prefix ? `${options.prefix}091` : '9091'

            // config.toml
            const config = getConfig();

            config.rpc.laddr = `tcp://${BIND_ADDR}:${RPC}`

            config.p2p.laddr = `tcp://${BIND_ADDR}:${P2P}`
            config.p2p.max_num_inbound_peers = 100
            config.p2p.max_num_outbound_peers = 25

            config.instrumentation.prometheus_listen_addr = `:${METRICS}`

            saveConfig(config);

            // app.toml
            const app = getApp()

            app.pruning = "custom"
            app['pruning-keep-recent'] = '1000'
            app['pruning-interval'] = '71'

            app['iavl-disable-fastnode'] = true

            app.api.enable = true
            app.api.address = `tcp://${BIND_ADDR}:${LCD}`
            app.api['enabled-unsafe-cors'] = false
            
            app.grpc.enable = true
            app.grpc.address = `${BIND_ADDR}:${GRPC}`

            app['grpc-web'].enable = true
            app['grpc-web'].address = `${BIND_ADDR}:${GRPCW}`
            app['grpc-web']['enable-unsafe-cors'] = false

            saveApp(app)

            console.log(`Node configured as API node on IP ${BIND_ADDR}\nReady to start!`)

        } catch(e: any) {
            console.error('Error:', e.toString())
        }
    })

// const options = program.opts();
const command = program.parse();

// if (!process.argv.slice(2).length) {
//     program.outputHelp();
// }