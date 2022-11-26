"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const fs_1 = require("fs");
const path_1 = require("path");
const crypto_1 = require("crypto");
//TODO create 16bits long iv
// [] sdkfsldkjf
const userInput = process.argv.slice(2);
const password = userInput.pop();
const filenames = userInput.map((filename) => (0, path_1.basename)(filename));
const client = net_1.default.connect(3000, '127.0.0.1', () => {
    const iv = (0, crypto_1.randomBytes)(16);
    let done = 0;
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
                const passBuff = Buffer.alloc(16);
                Buffer.from(password).copy(passBuff);
                console.log(iv);
                const cipher = (0, crypto_1.createCipheriv)('aes-128-gcm', passBuff, iv);
                const encryptedBuff = Buffer.concat([
                    cipher.update(outBuff),
                    cipher.final(),
                ]);
                outBuff = Buffer.concat([iv, encryptedBuff]);
                client.write(outBuff);
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
