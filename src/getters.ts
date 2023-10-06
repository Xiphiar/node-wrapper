import axios from "axios"

export const getChainRegistry = async(registryId: string) => {
    const url = registryId.includes('testnet') ?
        `https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/${registryId}/chain.json`
    :
        `https://raw.githubusercontent.com/cosmos/chain-registry/master/${registryId}/chain.json`
    const {data} = await axios.get(url);
    return data;
}


export const getBlock = async (rpc: string, height?: string | number) => {
    const url = `${rpc.replace(/\/$/, '')}/block?height=${height || ''}`
    const {data} = await axios.get(url, { timeout: 1_500 });
    return data;
}