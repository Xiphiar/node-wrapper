"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILD_OUTPUT = exports.BUILD_CMD = exports.SRC_DIR = exports.DAEMON_HOME = exports.APP_ARGS = exports.APP_BINARY = exports.API_PORT = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
if (!process.env.API_PORT)
    throw new Error('API_PORT is undefined');
if (!process.env.APP_BINARY)
    throw new Error('APP_BINARY is undefined');
if (!process.env.DAEMON_HOME)
    throw new Error('DAEMON_HOME is undefined');
exports.API_PORT = process.env.API_PORT;
exports.APP_BINARY = process.env.APP_BINARY;
exports.APP_ARGS = process.env.APP_ARGS;
exports.DAEMON_HOME = process.env.DAEMON_HOME;
exports.SRC_DIR = process.env.SRC_DIR;
exports.BUILD_CMD = process.env.BUILD_CMD || 'make install';
exports.BUILD_OUTPUT = process.env.BUILD_OUTPUT || `${process.env.HOME}/go/bin/${exports.APP_BINARY}`;
