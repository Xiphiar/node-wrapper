"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWrapper = void 0;
const exec_1 = require("./exec");
const log_1 = require("./log");
const server_1 = require("./server");
const ansi_to_html_1 = __importDefault(require("ansi-to-html"));
const convert = new ansi_to_html_1.default();
String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, "");
};
const startWrapper = () => {
    const logBuffer = new log_1.LogBuffer();
    const server = (0, server_1.runServer)();
    server.get('/log', async (req, res) => {
        res.send(`<pre>${convert.toHtml(logBuffer.getLog())}</pre>`);
    });
    const app = new exec_1.RunApp(logBuffer.addLog, logBuffer.addLog);
    server.get('/restart', async (req, res) => {
        console.log('Received restart request, terminating app process...');
        app.restart();
        res.send('Ok');
    });
};
exports.startWrapper = startWrapper;
