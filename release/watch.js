"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const fsp = fs.promises;
class Watcher {
    constructor() {
        this.watchers = new Map();
        this.dirs = [];
        this.files = [];
        this.actions = {
            dir: {
                rename: filePath => {
                    if (this.watchers.get(filePath)) {
                        this.closeAll(filePath);
                    }
                    else
                        this.watch(filePath);
                },
                change: filePath => {
                    // not implemented
                }
            },
            file: {
                rename: filePath => {
                    // not implemented
                },
                change: filePath => {
                    // not implemented
                }
            }
        };
    }
    async init(folderName) {
        this.watch(folderName);
    }
    async watch(filePath) {
        console.log(filePath);
        const type = fs.lstatSync(filePath).isDirectory() ? 'dir' : 'file';
        const watcher = fs.watch(filePath, (event, fileName) => {
            console.log(`\x1b[1;33m${type}: \x1b[0m${filePath}`, `\x1b[34mchanges in: \x1b[0m${fileName}`, `\x1b[32mevent: \x1b[0m${event}`);
            const fullPath = path.join(filePath, fileName);
            if (this.actions[type][event])
                this.actions[type][event](fullPath);
            console.log(filePath, this.watchers.keys());
        });
        this.watchers.set(filePath, watcher);
        if (type === 'dir') {
            this.dirs.push(filePath);
            const dir = await fsp.readdir(filePath);
            for (const fileName of dir) {
                const fullPath = path.join(filePath, fileName);
                this.watch(fullPath);
            }
        }
        else
            this.files.push(filePath);
    }
    close(filePath) {
        const watcher = this.watchers.get(filePath);
        watcher.close();
        this.watchers.delete(filePath);
        console.log(`\x1b[31mwatcher closed on: \x1b[0m${filePath} `);
    }
    closeAll(filePath) {
        // const type = fs.lstatSync(filePath).isDirectory() ? 'dir' : 'file'; 
        // if (type === 'dir') {
        //   const watcherKeys = this.watchers.keys();
        //   for (const key of watcherKeys) {
        //     if (key.includes(filePath)) {
        //       this.close(key);
        //     };
        //   };
        // } else this.close(filePath);
        if (this.dirs.includes(filePath)) {
            const watcherKeys = this.watchers.keys();
            for (const key of watcherKeys) {
                if (key.includes(filePath)) {
                    this.close(key);
                }
                ;
            }
            ;
        }
        else
            this.close(filePath);
    }
}
(async () => {
    const watcher = new Watcher();
    await watcher.init(__dirname);
})();
