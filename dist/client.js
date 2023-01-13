"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const fs_1 = require("fs");
const path_1 = require("path");
const crypto_1 = require("crypto");
const filenames = process.argv.slice(2).map((filename) => (0, path_1.basename)(filename));
const client = net_1.default.connect(3000, '127.0.0.1', () => {
    let done = 0;
    const cipher = (0, crypto_1.createCipheriv)('aes-256-cbc', '00000000001111111111222222222233', Buffer.from('0000000000111111'));
    cipher.on('readable', () => {
        let codChunk;
        while (null !== (codChunk = cipher.read())) {
            client.write(codChunk);
        }
    });
    filenames.forEach((filename) => {
        // console.log(filename + ' !!');
        const readStream = (0, fs_1.createReadStream)(filename, {
            highWaterMark: 32 * 1024 - 1,
        })
            .on('readable', () => {
            let chunk;
            while ((chunk = readStream.read()) !== null) {
                //  console.log(chunk.length);
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
