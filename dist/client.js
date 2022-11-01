"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const fs_1 = require("fs");
const path_1 = require("path");
const filenames = process.argv.slice(2).map((filename) => (0, path_1.basename)(filename));
const client = net_1.default.createConnection(3000, '127.0.0.1', () => {
    let done = 0;
    filenames.forEach((filename) => {
        (0, fs_1.createReadStream)(filename)
            .on('data', (chunk) => {
            const outBuff = Buffer.alloc(1 + filename.length + chunk.length);
            outBuff.writeUint8(filename.length, 0);
            Buffer.from(filename).copy(outBuff, 1);
            Buffer.from(chunk).copy(outBuff, 1 + filename.length);
            client.write(outBuff);
        })
            .on('end', () => {
            console.log(`${filename} uploaded`);
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
