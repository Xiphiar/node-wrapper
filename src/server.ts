import express from 'express';
import { exec, getClientConfig, getLongVersion, getVersion, readDeb } from './exec';
import fs from 'fs';
import { readdir, rmdir } from 'fs/promises'

// import { parse } from '@toml-tools/parser';
import { API_PORT, APP_BINARY, BUILD_CMD, BUILD_OUTPUT, DAEMON_HOME, SRC_DIR } from './config';
import { parse } from '@iarna/toml';
import axios from 'axios';
//@ts-ignore
import debreader from 'deb-reader';
import ar from 'ar';

export const runServer = () => {
    if (!API_PORT) throw new Error('API_PORT is undefined')
    const port = API_PORT;

    const server = express();
    server.get('/', (req, res) => {
        res.send('Hello World!')
    });

    server.get('/version', async (req, res) => {
        // ?long
        if (req.query.long !== undefined) res.json(await getLongVersion())
        else res.send(await getVersion())
    });

    server.get('/config/client', async (req, res) => {
        const toml = fs.readFileSync(`${DAEMON_HOME}/config/client.toml`)
        const parsed = parse(toml.toString());
        res.json(parsed)
    });

    server.get('/config/app', async (req, res) => {
        try {
            const toml = fs.readFileSync(`${DAEMON_HOME}/config/app.toml`)
            const parsed = parse(toml.toString());
            res.json(parsed)
        } catch {
            res.json({})
        }
    });

    server.get('/config', async (req, res) => {
        const toml = fs.readFileSync(`${DAEMON_HOME}/config/config.toml`)
        const parsed = parse(toml.toString());
        res.json(parsed)
    });

    server.get('/upgrade_info', async (req, res) => {
        try {
            const json = fs.readFileSync(`${DAEMON_HOME}/data/upgrade_info.json`)
            const parsed = JSON.parse(json.toString());
            res.json(parsed)
        } catch {
            res.json({})
        }
    });

    server.get('/cosmovisor', async (req, res) => {
        try {
            const children = await readdir(`${DAEMON_HOME}/cosmovisor/upgrades`, {
                withFileTypes: true
            })
            const dirs = children.filter(c=>c.isDirectory()).map(c=>{
                return c.name;
            })
            res.json(dirs)
        } catch {
            res.json([])
        }
    });

    server.get('/cosmovisor/import_deb', async (req, res) => {
        const url = req.query.url as string;
        const version = req.query.version as string;
        const force = req.query.force === 'true';

        if (!version) {
            res.status(400).send('Param `version` not specified');
            return;
        }
        if (!url) {
            res.status(400).send('Param `url` not specified');
            return;
        }

        const dir = `${DAEMON_HOME}/cosmovisor/upgrades/${version}`
        const binDir = `${dir}/bin`
        try {
            if (fs.existsSync(dir)){
                if (force) fs.rmSync(dir, { recursive: true })
                else {
                    res.status(400).send('Upgrade already exists. <code>&force=true</code> to delete.');
                    return;
                }
            }

            fs.mkdirSync(dir);
            fs.mkdirSync(binDir);

        } catch (e: any) {
            console.error(e.toString())
            res.status(500).send("Failed to create upgrade directories");
            return;
        }

        let data;
        try {
            const resp = await axios.get(url, {responseType: 'arraybuffer'});
            data = resp.data;
        } catch (e: any) {
            console.error(e.toString())
            res.status(500).send("Download Failed");
            return;
        }

        const tmpDir = `${binDir}/temp`
        try {
            if (!fs.existsSync(tmpDir)){
                fs.mkdirSync(tmpDir);
            }
            fs.writeFileSync(`${tmpDir}/dl.deb`, data)
            const {fileList} = await readDeb(`${tmpDir}/dl.deb`);

            await exec(`ar x ${tmpDir}/dl.deb --output=${tmpDir}`)
            await exec(`tar xvf ${tmpDir}/data.tar.xz --directory=${tmpDir}`)

            for (const fileName of fileList){
                await exec(`cp ${tmpDir}/${fileName} ${binDir}/`)
            }

            fs.rmSync(tmpDir, { recursive: true })

            const version = await getVersion(`${binDir}/secretd`)
            res.json({version, fileList})
        } catch(e: any) {
            console.error(e.toString())
            res.status(500).send(e.toString());
            return;
        }
    });

    server.get('/cosmovisor/import_src', async (req, res) => {
        const tag = req.query.tag as string;
        const version = req.query.version as string;
        const force = req.query.force === 'true';

        if (!SRC_DIR || !fs.existsSync(SRC_DIR)) {
            res.status(400).send(`Config variable SRC_DIR not specified or does not exist: ${SRC_DIR}`);
            return;
        }
        if (!version) {
            res.status(400).send('Param `version` not specified');
            return;
        }
        if (!tag) {
            res.status(400).send('Param `tag` not specified');
            return;
        }

        const dir = `${DAEMON_HOME}/cosmovisor/upgrades/${version}`
        const binDir = `${dir}/bin`
        try {
            if (fs.existsSync(dir)){
                if (force) fs.rmSync(dir, { recursive: true })
                else {
                    res.status(400).send('Upgrade already exists. <code>&force=true</code> to delete.');
                    return;
                }
            }

            fs.mkdirSync(dir);
            fs.mkdirSync(binDir);

        } catch (e: any) {
            console.error(e.toString())
            res.status(500).send("Failed to create upgrade directories");
            return;
        }

        try {
            const fetch = await exec(`(cd ${SRC_DIR}; git fetch)`)
            console.log(fetch)

            const checkout = await exec(`(cd ${SRC_DIR}; git checkout ${tag})`)
            console.log(fetch)

            const build = await exec(`(cd ${SRC_DIR}; ${BUILD_CMD})`)
            console.log(build)

            await exec(`cp ${BUILD_OUTPUT} ${binDir}`)

            const version = await getLongVersion(`${binDir}/secretd`)
            res.json({version})
        } catch(e: any) {
            console.error(e.toString())
            res.status(500).send(e.toString());
            return;
        }
    });
    
    server.get('/cosmovisor/:version', async (req, res) => {
        try {
            if (!req.params.version) {
                res.status(400).send("Invalid Version");
                return;
            }
            const upgradeDir = `${DAEMON_HOME}/cosmovisor/upgrades/${req.params.version}/bin`
            const files = await readdir(upgradeDir)
            
            const version = await getVersion(`${upgradeDir}/${APP_BINARY}`)
            res.json({version, files})
        } catch {
            res.status(404).send("Version Not Found");
        }
    });

    server.listen(port, () => {
        console.log(`API listening on port ${port}`)
    })

    return server;
}