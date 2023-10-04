import fs from 'fs'
import { DAEMON_HOME } from "./config";
import { parse, stringify } from '@iarna/toml';
import { AppToml, ConfigToml } from './toml.types';


export const getConfig = (): ConfigToml => {
    const toml = fs.readFileSync(`${DAEMON_HOME}/config/config.toml`)
    const parsed = parse(toml.toString());
    return parsed as ConfigToml;
}

export const saveConfig = (newConfig: ConfigToml) => {
    const toml = stringify(newConfig);
    fs.writeFileSync(`${DAEMON_HOME}/config/config.toml`, toml);
}

export const getClient = () => {
    const toml = fs.readFileSync(`${DAEMON_HOME}/config/client.toml`)
    const parsed = parse(toml.toString());
    return parsed;
}

export const getApp = (): AppToml => {
    const toml = fs.readFileSync(`${DAEMON_HOME}/config/app.toml`)
    const parsed = parse(toml.toString());
    console.log(JSON.stringify(parsed))
    return parsed as AppToml;
}

export const saveApp = (newApp: AppToml) => {
    const toml = stringify(newApp);
    fs.writeFileSync(`${DAEMON_HOME}/config/app.toml`, toml);
}