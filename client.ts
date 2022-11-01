import net from 'net';
import { createReadStream } from 'fs';
import { basename } from 'path';

const filenames = process.argv.slice(2).map((filename) => basename(filename));

const client = net.createConnection(3000, '127.0.0.1', () => {
  let done = 0;

  filenames.forEach((filename) => {
    createReadStream(filename)
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
