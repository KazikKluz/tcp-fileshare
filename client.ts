import net from 'net';
import { createReadStream } from 'fs';
import { basename } from 'path';
import { randomBytes, createCipheriv } from 'crypto';
import { pipeline } from 'stream';
import { Socket } from 'dgram';

//TODO create 16bits long iv
// [] sdkfsldkjf
const userInput = process.argv.slice(2);
const password = userInput.pop();
const filenames = userInput.map((filename) => basename(filename));

const client = net.connect(3000, '127.0.0.1', () => {
  const iv = randomBytes(16);
  let password = 'Kazik';
  let done = 0;

  filenames.forEach((filename) => {
    // console.log(filename + ' !!');

    const readStream = createReadStream(filename, {
      highWaterMark: 32 * 1024 - 1,
    })
      .on('readable', () => {
        let chunk: Buffer;

        while ((chunk = readStream.read()) !== null) {
          //  console.log(chunk.length);
          let outBuff = Buffer.alloc(0);

          const nameBuff = Buffer.alloc(30);

          const fileBuff = Buffer.from(basename(filename));
          fileBuff.copy(nameBuff);

          outBuff = Buffer.concat([outBuff, fileBuff], 30);

          const sizeBuff = Buffer.alloc(16);
          sizeBuff.writeUInt32BE(chunk.length);
          outBuff = Buffer.concat([outBuff, sizeBuff]);

          outBuff = Buffer.concat([outBuff, chunk]);
          // console.log(outBuff.length);
          // console.log(outBuff);

          const first = Buffer.from(
            createCipheriv('aes-128-ccm', password, outBuff)
          );
          const finalBuff = Buffer.concat([iv, first]);
          client.write(first);
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
