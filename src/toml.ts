import fs from 'fs'
import { Config } from "./config";
import { parse, stringify } from '@iarna/toml';
import { AppToml, ConfigToml } from './toml.types';


export const getConfig = (): ConfigToml => {
    const config = getWrapConfig();
    const toml = fs.readFileSync(`${config.app_home}/config/config.toml`)
    const parsed = parse(toml.toString());
    return parsed as ConfigToml;
}

export const saveConfig = (newConfig: ConfigToml) => {
    const config = getWrapConfig();
    const toml = stringify(newConfig);
    fs.writeFileSync(`${config.app_home}/config/config.toml`, toml);
}

export const getClient = () => {
    const config = getWrapConfig();
    const toml = fs.readFileSync(`${config.app_home}/config/client.toml`)
    const parsed = parse(toml.toString());
    return parsed;
}

export const getApp = (): AppToml => {
    const config = getWrapConfig();
    const toml = fs.readFileSync(`${config.app_home}/config/app.toml`)
    const parsed = parse(toml.toString());
    return parsed as AppToml;
}

export const saveApp = (newApp: AppToml) => {
    const config = getWrapConfig();
    const toml = stringify(newApp);
    fs.writeFileSync(`${config.app_home}/config/app.toml`, toml);
}


const configDir = `${process.env.HOME}/.nodewrap`
const configToml = `${configDir}/config.toml`

export const getWrapConfig = (verify = true): Config => {
    if (!fs.existsSync(configDir)){
        fs.mkdirSync(configDir);
    }

    let returnConfig: Config;

    if (!fs.existsSync(configToml)) {
        const config = new Config();
        //@ts-ignore
        const toml = stringify(config);
        fs.writeFileSync(configToml, toml);
        returnConfig = config;
    } else {
        const toml = fs.readFileSync(configToml)
        const parsed = parse(toml.toString());
        returnConfig = parsed as unknown as Config;
    }

    if (verify){
        if (!returnConfig.api_port) throw new Error('Config value api_port is undefined')
        if (!returnConfig.app_binary) throw new Error('Config value app_binary is undefined')
        if (!returnConfig.app_home) throw new Error('Config value app_home is undefined')
    }

    return returnConfig;
}

export const saveWrapConfig = (newConfig: Config) => {
    //@ts-ignore
    const toml = stringify(newConfig);
    fs.writeFileSync(configToml, toml);
}