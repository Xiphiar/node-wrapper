import {config} from 'dotenv';
config();

if (!process.env.API_PORT) throw new Error('API_PORT is undefined')
if (!process.env.APP_BINARY) throw new Error('APP_BINARY is undefined')
if (!process.env.DAEMON_HOME) throw new Error('DAEMON_HOME is undefined')

export const API_PORT = process.env.API_PORT;
export const APP_BINARY = process.env.APP_BINARY;
export const APP_ARGS = process.env.APP_ARGS;
export const DAEMON_HOME = process.env.DAEMON_HOME;
export const SRC_DIR = process.env.SRC_DIR;
export const BUILD_CMD = process.env.BUILD_CMD || 'make install';
export const BUILD_OUTPUT = process.env.BUILD_OUTPUT || `${process.env.HOME}/go/bin/${APP_BINARY}`