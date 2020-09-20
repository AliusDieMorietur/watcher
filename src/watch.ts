import { FSWatcher } from "fs";

const fs = require('fs');
const path = require('path');
const fsp = fs.promises;

const colors = {
  white: '\x1b[0m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m'
};

const colorText = 
  (color: string) => 
  (text: string) => `${colors[color]}${text}${colors.white}`;
    
const [basic, info, name, event, warn] = Object.keys(colors).map(colorText);

type watchEvents = { 
  rename: (filePath: string) => void,
  change: (filePath: string) => void 
};

class Watcher {
  watchers: Map<string, FSWatcher>;
  callback?: (event: string, fileName: string) => void; 
  dirs: string[];
  files: string[];
  events: { dir: watchEvents, file: watchEvents };
  constructor(callback?) {
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
    fs.watch(filePath, (eventType, fileName) => {
      console.log(
        `${info(type)}: ${filePath}`, 
        `${name('changes in')}: ${fileName}`, 
        `${event('event')}: ${eventType}`
      );
      const fullPath: string = path.join(filePath, fileName);
      if (this.events[type][eventType]) this.events[type][eventType](fullPath);
      console.log(`${info('All watchers')}:`, this.watchers.keys());
      if (this.callback) this.callback(eventType, fileName);
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
    if (this.dirs.includes(filePath)) {
      const index: number = this.dirs.indexOf(filePath);
      this.dirs.splice(index, 1);
    } else {
      const index: number = this.files.indexOf(filePath);
      this.files.splice(index, 1);
    }; 
    const watcher: FSWatcher = this.watchers.get(filePath);
    watcher.close();
    this.watchers.delete(filePath);
    console.log(`${warn('Watcher closed on')}: ${filePath}`);
  }

  closeAll(filePath): void {
    if (this.dirs.includes(filePath)) {
      for (const key of this.watchers.keys()) {
        if (key.includes(filePath)) {
          this.close(key);
        };
      };
    } else this.close(filePath);
  }
}

const watcher = new Watcher((eventType, fileName) => {
  console.log(`${info('From callback')} { ${event('event')}: ${eventType}, ${name('file')}: ${fileName} }`);
});

watcher.watch(__dirname);

