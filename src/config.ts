import { getWrapConfig } from './toml';

export class Config {
    'api_port': string = '26670'
    'app_binary': string = '';
    'app_args': string = '';
    'app_home': string = '';
    'src_dir': string = '';
    'build_cmd': string = 'make install';
    'build_output': string = `${process.env.HOME}/go/bin`;
}

export const config: Config = getWrapConfig() as Config;

if (!config.api_port) throw new Error('Config value api_port is undefined')
if (!config.app_binary) throw new Error('Config value app_binary is undefined')
if (!config.app_home) throw new Error('Config value app_home is undefined')

