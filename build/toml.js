"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApp = exports.getClient = exports.getConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const config_1 = require("./config");
const toml_1 = require("@iarna/toml");
const getConfig = () => {
    const toml = fs_1.default.readFileSync(`${config_1.DAEMON_HOME}/config/config.toml`);
    const parsed = (0, toml_1.parse)(toml.toString());
    return parsed;
};
exports.getConfig = getConfig;
const getClient = () => {
    const toml = fs_1.default.readFileSync(`${config_1.DAEMON_HOME}/config/client.toml`);
    const parsed = (0, toml_1.parse)(toml.toString());
    return parsed;
};
exports.getClient = getClient;
const getApp = () => {
    const toml = fs_1.default.readFileSync(`${config_1.DAEMON_HOME}/config/app.toml`);
    const parsed = (0, toml_1.parse)(toml.toString());
    return parsed;
};
exports.getApp = getApp;
