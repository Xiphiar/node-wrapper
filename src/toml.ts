import fs from 'fs'
import { Config, config } from "./config";
import { parse, stringify } from '@iarna/toml';
import { AppToml, ConfigToml } from './toml.types';


export const getConfig = (): ConfigToml => {
    const toml = fs.readFileSync(`${config.app_home}/config/config.toml`)
    const parsed = parse(toml.toString());
    return parsed as ConfigToml;
}

export const saveConfig = (newConfig: ConfigToml) => {
    const toml = stringify(newConfig);
    fs.writeFileSync(`${config.app_home}/config/config.toml`, toml);
}

export const getClient = () => {
    const toml = fs.readFileSync(`${config.app_home}/config/client.toml`)
    const parsed = parse(toml.toString());
    return parsed;
}

export const getApp = (): AppToml => {
    const toml = fs.readFileSync(`${config.app_home}/config/app.toml`)
    const parsed = parse(toml.toString());
    return parsed as AppToml;
}

export const saveApp = (newApp: AppToml) => {
    const toml = stringify(newApp);
    fs.writeFileSync(`${config.app_home}/config/app.toml`, toml);
}


const configDir = `${process.env.HOME}/.nodewrap`
const configToml = `${configDir}/config.toml`

export const getWrapConfig = () => {
    if (!fs.existsSync(configDir)){
        fs.mkdirSync(configDir);
    }

    if (!fs.existsSync(configToml)) {
        const config = new Config();
        //@ts-ignore
        const toml = stringify(config);
        fs.writeFileSync(configToml, toml);
        return config;
    } else {
        const toml = fs.readFileSync(configToml)
        const parsed = parse(toml.toString());
        return parsed as unknown as Config;
    }
}

export const saveWrapConfig = (newConfig: Config) => {
    //@ts-ignore
    const toml = stringify(newConfig);
    fs.writeFileSync(configToml, toml);
}