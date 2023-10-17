#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import { startWrapper } from '../wrapper';
import execShellCommand, { unsafeResetAll } from '../exec';
import { getApp, getConfig, getWrapConfig, saveApp, saveConfig, saveWrapConfig } from '../toml';
import axios from 'axios';
import { getBlock, getChainRegistry } from '../getters';
import { findGoodRpc } from '../helpers';
import { setupCommand } from './setup';
import { seedsCommand } from './seeds';
import { peersCommand } from './peers';
import { statesyncCommand } from './statesync';

const program = new Command();

console.log(figlet.textSync("NodeWrap"));

program 
    .version("0.0.4")
    .description("Idk some description eventually")

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
    .option('--chain <name>', 'Configure based on cosmos directory chain')
    .option('--cosmovisor', 'Use cosmovisor for the binary')
    .action(async (options, command: Command) => {
        try {
            const config = getWrapConfig(false);

            if (!options.chain) {
                console.table(config)
                return;
            }

            const registry = await getChainRegistry(options.chain);
            const location = await execShellCommand(`which ${registry.daemon_name}`)
            
            config.app_binary = registry.daemon_name
            config.app_start_subcommand = 'start'
            config.app_binary_path = location.stdout.replace('\n', '')
            config.app_home = registry.node_home.replace('$HOME', process.env.HOME)

            if (options.cosmovisor){
                const cLocation = await execShellCommand(`which ${registry.daemon_name}`)

                config.app_binary = 'cosmovisor'
                config.app_start_subcommand = 'run start'
                config.app_binary_path = cLocation.stdout.replace('\n', '')
            }

            saveWrapConfig(config);
            console.table(config);
        } catch(e: any) {
            console.error('Failed to get config:', e.toString())
        }
    });


program.addCommand(setupCommand)
program.addCommand(seedsCommand)
program.addCommand(peersCommand)
program.addCommand(statesyncCommand)

const command = program.parse();
