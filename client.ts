import net from 'net';
import { createReadStream } from 'fs';
import { basename } from 'path';
import { createCipheriv, randomBytes } from 'crypto';

const userInput = process.argv.slice(2);

const passBuff = Buffer.alloc(32);
Buffer.from(userInput.pop()!).copy(passBuff);

const filenames = userInput.map((filename) => basename(filename));
//const iv = Buffer.from('6bbc47a2756d6d6b6bbc47a2756d6d6b', 'hex');

const iv = Buffer.from(randomBytes(32).toString(), 'hex');
console.log(iv);

let cipher = createCipheriv('aes-256-cbc', passBuff, iv);

const client = net.connect(3000, '127.0.0.1', () => {
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
    const readStream = createReadStream(filename, {
      highWaterMark: 32 * 1024 - 1,
    })
      .on('readable', () => {
        let chunk: Buffer;

        while ((chunk = readStream.read()) !== null) {
          let outBuff = Buffer.alloc(0);

          const nameBuff = Buffer.alloc(30);

          const fileBuff = Buffer.from(basename(filename));
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
