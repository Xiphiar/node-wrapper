import { Command } from "commander";
import { getChainRegistry } from "../getters";
import { getConfig, saveConfig } from "../toml";

export const peersCommand = new Command('peers')
    .description('Configure persistent peers queries from an RPC node')
    .requiredOption('--rpc <address>', 'RPC address to use')
    .action(async (options, command: Command) => {
        try {
            console.log('TODO')
        } catch(e: any) {
            console.error('Error:', e.toString())
        }
    })