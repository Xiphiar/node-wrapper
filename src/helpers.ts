import { getBlock, getChainRegistry } from "./getters"

export const findGoodRpc = async (directoryName: string) => {
    const chain = await getChainRegistry(directoryName);
    const rpcs = chain.apis.rpc
    console.log(`Found ${rpcs.length} RPCs to check`)

    for (const rpc of rpcs){
        try {
            const block = await getBlock(rpc.address);
            const blockTime = new Date(block.result.block.header.time).valueOf();
            const now = new Date().valueOf()
            const minus_one = now - 60_000
            if (blockTime > minus_one) {
                const rpcUrl = new URL(rpc.address);
                let port = '';
                if (!rpcUrl.port){
                    if (rpcUrl.protocol !== 'http:' && rpcUrl.protocol !== 'https:') continue;
                    if (rpcUrl.protocol === 'http:') port = ':80';
                    if (rpcUrl.protocol === 'https:') port = ':443';
                }
                const goodUrl = `${rpcUrl.toString().replace(/\/$/, '')}${port}`
                return goodUrl;
            }
        } catch(e: any) {
            continue;
        }
    }
}