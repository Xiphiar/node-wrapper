"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runServer = void 0;
const express_1 = __importDefault(require("express"));
const exec_1 = require("./exec");
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("fs/promises");
const config_1 = require("./config");
const toml_1 = require("@iarna/toml");
const axios_1 = __importDefault(require("axios"));
const toml_2 = require("./toml");
const runServer = () => {
    if (!config_1.API_PORT)
        throw new Error('API_PORT is undefined');
    const port = config_1.API_PORT;
    const server = (0, express_1.default)();
    server.get('/', (req, res) => {
        const links = ['/version', '/config', '/config/client', '/config/app', '/upgrade_info', '/log', '/cosmovisor', '/cosmovisor/:version', '/cosmovisor/import_deb?url=_&version=_&force=_', '/cosmovisor/import_src?tag=_&version=_&force=_', '/restart'];
        const anchors = links.map(link => `<a href="${link}">${link}</a>`);
        res.send(`<div><br/>${anchors.join('<br />')}</div>`);
    });
    server.get('/version', async (req, res) => {
        // ?long
        if (req.query.long !== undefined)
            res.json(await (0, exec_1.getLongVersion)());
        else
            res.send(await (0, exec_1.getVersion)());
    });
    server.get('/config/client', async (req, res) => {
        res.json((0, toml_2.getConfig)());
    });
    server.get('/config/app', async (req, res) => {
        try {
            const toml = fs_1.default.readFileSync(`${config_1.DAEMON_HOME}/config/app.toml`);
            const parsed = (0, toml_1.parse)(toml.toString());
            res.json(parsed);
        }
        catch {
            res.json({});
        }
    });
    server.get('/config', async (req, res) => {
        const toml = fs_1.default.readFileSync(`${config_1.DAEMON_HOME}/config/config.toml`);
        const parsed = (0, toml_1.parse)(toml.toString());
        res.json(parsed);
    });
    server.get('/upgrade_info', async (req, res) => {
        try {
            const json = fs_1.default.readFileSync(`${config_1.DAEMON_HOME}/data/upgrade_info.json`);
            const parsed = JSON.parse(json.toString());
            res.json(parsed);
        }
        catch {
            res.json({});
        }
    });
    server.get('/cosmovisor', async (req, res) => {
        try {
            const children = await (0, promises_1.readdir)(`${config_1.DAEMON_HOME}/cosmovisor/upgrades`, {
                withFileTypes: true
            });
            const dirs = children.filter(c => c.isDirectory()).map(c => {
                return c.name;
            });
            res.json(dirs);
        }
        catch {
            res.json([]);
        }
    });
    server.get('/cosmovisor/import_deb', async (req, res) => {
        const url = req.query.url;
        const version = req.query.version;
        const force = req.query.force === 'true';
        if (!version) {
            res.status(400).send('Param `version` not specified');
            return;
        }
        if (!url) {
            res.status(400).send('Param `url` not specified');
            return;
        }
        const dir = `${config_1.DAEMON_HOME}/cosmovisor/upgrades/${version}`;
        const binDir = `${dir}/bin`;
        try {
            if (fs_1.default.existsSync(dir)) {
                if (force)
                    fs_1.default.rmSync(dir, { recursive: true });
                else {
                    res.status(400).send('Upgrade already exists. <code>&force=true</code> to delete.');
                    return;
                }
            }
            fs_1.default.mkdirSync(dir);
            fs_1.default.mkdirSync(binDir);
        }
        catch (e) {
            console.error(e.toString());
            res.status(500).send("Failed to create upgrade directories");
            return;
        }
        let data;
        try {
            const resp = await axios_1.default.get(url, { responseType: 'arraybuffer' });
            data = resp.data;
        }
        catch (e) {
            console.error(e.toString());
            res.status(500).send("Download Failed");
            return;
        }
        const tmpDir = `${binDir}/temp`;
        try {
            if (!fs_1.default.existsSync(tmpDir)) {
                fs_1.default.mkdirSync(tmpDir);
            }
            fs_1.default.writeFileSync(`${tmpDir}/dl.deb`, data);
            const { fileList } = await (0, exec_1.readDeb)(`${tmpDir}/dl.deb`);
            await (0, exec_1.exec)(`ar x ${tmpDir}/dl.deb --output=${tmpDir}`);
            await (0, exec_1.exec)(`tar xvf ${tmpDir}/data.tar.xz --directory=${tmpDir}`);
            for (const fileName of fileList) {
                await (0, exec_1.exec)(`cp ${tmpDir}/${fileName} ${binDir}/`);
            }
            fs_1.default.rmSync(tmpDir, { recursive: true });
            const version = await (0, exec_1.getVersion)(`${binDir}/secretd`);
            res.json({ version, fileList });
        }
        catch (e) {
            console.error(e.toString());
            res.status(500).send(e.toString());
            return;
        }
    });
    server.get('/cosmovisor/import_src', async (req, res) => {
        const tag = req.query.tag;
        const version = req.query.version;
        const force = req.query.force === 'true';
        if (!config_1.SRC_DIR || !fs_1.default.existsSync(config_1.SRC_DIR)) {
            res.status(400).send(`Config variable SRC_DIR not specified or does not exist: ${config_1.SRC_DIR}`);
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
        const dir = `${config_1.DAEMON_HOME}/cosmovisor/upgrades/${version}`;
        const binDir = `${dir}/bin`;
        try {
            if (fs_1.default.existsSync(dir)) {
                if (force)
                    fs_1.default.rmSync(dir, { recursive: true });
                else {
                    res.status(400).send('Upgrade already exists. <code>&force=true</code> to delete.');
                    return;
                }
            }
            fs_1.default.mkdirSync(dir);
            fs_1.default.mkdirSync(binDir);
        }
        catch (e) {
            console.error(e.toString());
            res.status(500).send("Failed to create upgrade directories");
            return;
        }
        try {
            const fetch = await (0, exec_1.exec)(`(cd ${config_1.SRC_DIR}; git fetch)`);
            console.log(fetch);
            const checkout = await (0, exec_1.exec)(`(cd ${config_1.SRC_DIR}; git checkout ${tag})`);
            console.log(fetch);
            const build = await (0, exec_1.exec)(`(cd ${config_1.SRC_DIR}; ${config_1.BUILD_CMD})`);
            console.log(build);
            await (0, exec_1.exec)(`cp ${config_1.BUILD_OUTPUT} ${binDir}`);
            const version = await (0, exec_1.getLongVersion)(`${binDir}/secretd`);
            res.json({ version });
        }
        catch (e) {
            console.error(e.toString());
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
            const upgradeDir = `${config_1.DAEMON_HOME}/cosmovisor/upgrades/${req.params.version}/bin`;
            const files = await (0, promises_1.readdir)(upgradeDir);
            const version = await (0, exec_1.getVersion)(`${upgradeDir}/${config_1.APP_BINARY}`);
            res.json({ version, files });
        }
        catch {
            res.status(404).send("Version Not Found");
        }
    });
    server.listen(port, () => {
        console.log(`API listening on port ${port}`);
    });
    return server;
};
exports.runServer = runServer;
