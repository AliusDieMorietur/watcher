import { FSWatcher } from "fs";

const fs = require('fs');
const path = require('path');
const fsp = fs.promises;

class Watcher {
  watchers: Map<string, FSWatcher>;
  callback: Function | null; 
  dirs: string[];
  files: string[];
  events: object;
  constructor(callback = null) {
    this.watchers = new Map();
    this.callback = callback;
    this.dirs = [];
    this.files = [];
    this.events = {
      dir: {
        rename: filePath => {
          if (this.watchers.get(filePath)) {
            this.closeAll(filePath);
          } else this.watch(filePath);
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

  watch(filePath) {
    console.log(filePath);
    const type: string = fs.lstatSync(filePath).isDirectory() ? 'dir' : 'file'; 
    const watcher: FSWatcher = 
      fs.watch(filePath, (event, fileName) => {
        console.log(
          `\x1b[1;33m${type}: \x1b[0m${filePath}`, 
          `\x1b[34mchanges in: \x1b[0m${fileName}`, 
          `\x1b[32mevent: \x1b[0m${event}`
        );
        const fullPath: string = path.join(filePath, fileName);
        if (this.events[type][event]) this.events[type][event](fullPath);
        console.log(filePath, this.watchers.keys());
        if (this.callback) this.callback();
      });
    this.watchers.set(filePath, watcher);
    if (type === 'dir') {
      this.dirs.push(filePath);
      const dir: string[] = fs.readdirSync(filePath);
      for (const fileName of dir) {
        const fullPath: string = path.join(filePath, fileName);
        this.watch(fullPath);
      }
    } else this.files.push(filePath);
  }

  close(filePath): void {
    const watcher: FSWatcher = this.watchers.get(filePath);
    watcher.close();
    this.watchers.delete(filePath);
    console.log(`\x1b[31mwatcher closed on: \x1b[0m${filePath} `);
  }

  closeAll(filePath): void {
    // Doesn't work for deleted folders
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
      const watcherKeys: IterableIterator<string> = this.watchers.keys();
      for (const key of watcherKeys) {
        if (key.includes(filePath)) {
          this.close(key);
        };
      };
    } else this.close(filePath);
  }
}

const watcher = new Watcher(() => {
  console.log('Callback test');
});
watcher.watch(__dirname);
