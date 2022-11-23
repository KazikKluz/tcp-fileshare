import net from 'net';
import { createReadStream } from 'fs';
import { basename } from 'path';

const filenames = process.argv.slice(2).map((filename) => basename(filename));

const client = net.connect(3000, '127.0.0.1', () => {
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
