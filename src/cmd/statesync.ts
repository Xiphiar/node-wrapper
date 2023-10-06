import axios from "axios";
import { Command } from "commander";
import { unsafeResetAll } from "../exec";
import { getBlock } from "../getters";
import { findGoodRpc } from "../helpers";
import { getConfig, saveConfig } from "../toml";

export const statesyncCommand = new Command('statesync')
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