import net from 'net';
import { createReadStream } from 'fs';
import { basename } from 'path';
import { randomBytes, createCipheriv } from 'crypto';

//TODO create 16bits long iv
// [] sdkfsldkjf
const userInput = process.argv.slice(2);
const password = userInput.pop();
const filenames = userInput.map((filename) => basename(filename));

const client = net.connect(3000, '127.0.0.1', () => {
  const iv = randomBytes(16);
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

          const passBuff = Buffer.alloc(16);
          Buffer.from(password!).copy(passBuff);
          console.log(iv);
          const cipher = createCipheriv('aes-128-gcm', passBuff, iv);
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
