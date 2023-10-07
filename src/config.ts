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



