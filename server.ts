import net from 'net';
import { createWriteStream } from 'fs';

net
  .createServer((socket) => {
    const writeStreamMap = new Map();

    socket
      .on('data', (chunk) => {
        const filenameLength = chunk.readUInt8(0);

        const filename = chunk.toString('utf-8', 1, filenameLength + 1);
        if (!filename) return null;

        const data = chunk.toString('utf-8', filenameLength + 1);
        if (!data) return null;

        let writeStream = writeStreamMap.get(filename);

        if (!writeStream) {
          writeStream = createWriteStream(`./uploaded/${filename}`).on(
            'close',
            () => {
              console.log(`${filename} uploaded`);
            }
          );

          writeStreamMap.set(filename, writeStream);
        }

        writeStream.write(data);
      })
      .on('end', () => {
        writeStreamMap.forEach((stream) => stream.end());
      })
      .on('error', (err) => {
        console.error(err);
        process.exit(1);
      });
  })
  .listen(3000, () => {
    console.log('server listens on port 3000');
  });
