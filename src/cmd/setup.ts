import { Command } from "commander";
import { getApp, getConfig, saveApp, saveConfig } from "../toml";

export const setupCommand = new Command('setup')
    .description('Setup config for an API node')
    .requiredOption('--ip <ip>', 'External IP to bind to')
    .option('--prefix <prefix>', 'Optional prefix to use for bound ports. Default ports will be used is undefined')
    .action(async (options, command: Command) => {
        try {
            const BIND_ADDR = options.ip
            const P2P = `${options.prefix || 26}656`
            const RPC = `${options.prefix || 26}657`
            const METRICS = `${options.prefix || 26}660`
            const LCD = options.prefix ? `${options.prefix}317` : '1317'
            const GRPC = options.prefix ? `${options.prefix}090` : '9090'
            const GRPCW = options.prefix ? `${options.prefix}091` : '9091'

            // config.toml
            const config = getConfig();

            config.rpc.laddr = `tcp://${BIND_ADDR}:${RPC}`

            config.p2p.laddr = `tcp://${BIND_ADDR}:${P2P}`
            config.p2p.external_address = `${BIND_ADDR}:${P2P}`
            config.p2p.max_num_inbound_peers = 100
            config.p2p.max_num_outbound_peers = 25

            config.instrumentation.prometheus_listen_addr = `:${METRICS}`

            saveConfig(config);

            // app.toml
            const app = getApp()

            app.pruning = "custom"
            app['pruning-keep-recent'] = '1000'
            app['pruning-interval'] = '71'

            app['iavl-disable-fastnode'] = true

            app.api.enable = true
            app.api.address = `tcp://${BIND_ADDR}:${LCD}`
            app.api['enabled-unsafe-cors'] = false
            
            app.grpc.enable = true
            app.grpc.address = `${BIND_ADDR}:${GRPC}`

            app['grpc-web'].enable = true
            app['grpc-web'].address = `${BIND_ADDR}:${GRPCW}`
            app['grpc-web']['enable-unsafe-cors'] = false

            saveApp(app)

            console.log(`Node configured as API node on IP ${BIND_ADDR}\nReady to start!`)

        } catch(e: any) {
            console.error('Error:', e.toString())
        }
    })