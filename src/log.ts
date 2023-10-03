import os from 'os';

export class LogBuffer {
    entries: string[];

    addLog(data: string) {
        const newEntries = [...this.entries, data];
        if (newEntries.length > 50) newEntries.shift();
        this.entries = newEntries;
    }

    getLog() {
        return this.entries.join(os.EOL)
    }

    constructor() {
        this.addLog = this.addLog.bind(this);
        this.getLog = this.getLog.bind(this);
        this.entries = [];
    }
}