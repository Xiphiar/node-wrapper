import { RunApp } from "./exec";
import { LogBuffer } from "./log";
import { runServer } from "./server";
import Convert from 'ansi-to-html';
const convert = new Convert();

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};
export const startWrapper = () => {
    const logBuffer = new LogBuffer();

    const server = runServer();

    server.get('/log', async (req, res) => {
        res.send(`<pre>${convert.toHtml(logBuffer.getLog())}</pre>`)
    });

    const app = new RunApp(logBuffer.addLog)
    server.get('/restart', async (req, res) => {
        console.log('Received restart request, terminating app process...')
        app.restart()
        res.send('Ok')
    });
}