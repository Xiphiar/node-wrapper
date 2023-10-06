import { Command } from "commander";
import { getChainRegistry } from "../getters";
import { getConfig, saveConfig } from "../toml";

export const seedsCommand = new Command('seeds')
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