import net from 'net';
import { createWriteStream } from 'fs';
import { Buffer } from 'buffer';

net
  .createServer((socket) => {
    console.log('file transfer');

    const writeMap = new Map();
    let buffer = Buffer.alloc(0);

    socket
      .on('data', (chunk) => {
        console.log('data received');
        buffer = Buffer.concat([buffer, chunk]);
      })
      .on('end', () => {
        console.log('this is the end');
        let chunk;
        while (buffer.length) {
          //console.log(buffer.length);
          // chunk = socket.read(30);
          chunk = buffer.subarray(0, 30);
          let filename: string = chunk.toString('utf-8').replace(/\0.*$/g, '');
          // console.log(`1 ${filename}`);
          buffer = buffer.subarray(30);

          chunk = buffer.subarray(0, 16);
          let datasize = chunk.readUInt32BE();
          //console.log(`2 ${datasize}`);
          buffer = buffer.subarray(16);
          chunk = buffer.subarray(0, datasize);

          let writeStream = writeMap.get(filename);

          if (!writeStream) {
            writeStream = createWriteStream(`uploaded/${filename}`)
              .on('data', () => {
                console.log('data received');
              })
              .on('end', () => {
                console.log(`file ${filename} saved`);
              });

            writeMap.set(filename, writeStream);
          }

          writeStream.write(chunk);
          buffer = buffer.subarray(datasize);
        }
      })
      // .on('end', () => {
      //   writeMap.forEach((stream) => stream.end());
      // })
      .on('error', (err: Error) => {
        console.log(err);
        process.exit(1);
      });
  })
  .listen(3000, () => {
    console.log('server listens on port 3000');
  });
