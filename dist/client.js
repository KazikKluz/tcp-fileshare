"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const fs_1 = require("fs");
const path_1 = require("path");
const crypto_1 = require("crypto");
const userInput = process.argv.slice(2);
const passBuff = Buffer.alloc(32);
Buffer.from(userInput.pop()).copy(passBuff);
const filenames = userInput.map((filename) => (0, path_1.basename)(filename));
//const iv = Buffer.from('6bbc47a2756d6d6b6bbc47a2756d6d6b', 'hex');
const iv = Buffer.from((0, crypto_1.randomBytes)(32).toString(), 'hex');
console.log(iv);
let cipher = (0, crypto_1.createCipheriv)('aes-256-cbc', passBuff, iv);
const client = net_1.default.connect(3000, '127.0.0.1', () => {
    let done = 0;
    cipher.on('readable', () => {
        let codChunk;
        if (null !== (codChunk = cipher.read())) {
            client.write(Buffer.concat([iv, codChunk]));
        }
        while (null !== (codChunk = cipher.read())) {
            client.write(codChunk);
        }
    });
    filenames.forEach((filename) => {
        const readStream = (0, fs_1.createReadStream)(filename, {
            highWaterMark: 32 * 1024 - 1,
        })
            .on('readable', () => {
            let chunk;
            while ((chunk = readStream.read()) !== null) {
                let outBuff = Buffer.alloc(0);
                const nameBuff = Buffer.alloc(30);
                const fileBuff = Buffer.from((0, path_1.basename)(filename));
                fileBuff.copy(nameBuff);
                outBuff = Buffer.concat([outBuff, fileBuff], 30);
                const sizeBuff = Buffer.alloc(16);
                sizeBuff.writeUInt32BE(chunk.length);
                outBuff = Buffer.concat([outBuff, sizeBuff]);
                outBuff = Buffer.concat([outBuff, chunk]);
                cipher.write(outBuff);
            }
        })
            .on('end', () => {
            console.log(`${filename} uploaded ${done} `);
            if (++done === filenames.length) {
                client.end();
            }
        })
            .on('error', (err) => {
            console.error(err);
            process.exit(1);
        });
    });
});
