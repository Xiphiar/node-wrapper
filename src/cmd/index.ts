#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import { startWrapper } from '../wrapper';
import {config} from '../config'
import { unsafeResetAll } from '../exec';
import { getApp, getConfig, getWrapConfig, saveApp, saveConfig } from '../toml';
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
    .action((str, options) => {
        try {
            console.table(config)
        } catch(e: any) {
            console.error('Failed to get config:', e.toString())
        }
    });



program.addCommand(setupCommand)
program.addCommand(seedsCommand)
program.addCommand(peersCommand)
program.addCommand(statesyncCommand)

const command = program.parse();
