"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const fs_1 = require("fs");
const buffer_1 = require("buffer");
net_1.default
    .createServer((socket) => {
    console.log('file transfer');
    const writeMap = new Map();
    let buffer = buffer_1.Buffer.alloc(0);
    function processData() {
        let chunk = buffer.subarray(0, 30);
        let filename = chunk.toString('utf-8').replace(/\0.*$/g, '');
        buffer = buffer.subarray(30);
        chunk = buffer.subarray(0, 16);
        let datasize = chunk.readUInt32BE();
        console.log(`2 ${datasize}`);
        buffer = buffer.subarray(16);
        chunk = buffer.subarray(0, datasize);
        let writeStream = writeMap.get(filename);
        if (!writeStream) {
            writeStream = (0, fs_1.createWriteStream)(`uploaded/${filename}`).on('end', () => {
                console.log(`file ${filename} saved`);
            });
            writeMap.set(filename, writeStream);
        }
        writeStream.write(chunk);
        buffer = buffer.subarray(datasize);
    }
    socket
        .on('data', (chunk) => {
        buffer = buffer_1.Buffer.concat([buffer, chunk]);
        if (buffer.length > 3000000) {
            socket.pause();
        }
    })
        .on('pause', () => {
        processData();
        while (buffer.length > 32767) {
            processData();
        }
        socket.resume();
    })
        .on('end', () => {
        while (buffer.length) {
            processData();
        }
    })
        .on('error', (err) => {
        console.log(err);
        process.exit(1);
    });
})
    .listen(3000, () => {
    console.log('server listens on port 3000');
});
