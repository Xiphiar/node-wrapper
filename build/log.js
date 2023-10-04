"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBuffer = void 0;
const os_1 = __importDefault(require("os"));
class LogBuffer {
    entries;
    addLog(data) {
        const newEntries = [...this.entries, data];
        if (newEntries.length > 50)
            newEntries.shift();
        this.entries = newEntries;
    }
    getLog() {
        return this.entries.join(os_1.default.EOL);
    }
    constructor() {
        this.addLog = this.addLog.bind(this);
        this.getLog = this.getLog.bind(this);
        this.entries = [];
    }
}
exports.LogBuffer = LogBuffer;
