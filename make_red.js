const { Jimp } = require('jimp');

async function main() {
  const image = await Jimp.read('src/assets/icon-34.png');
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    if (this.bitmap.data[idx + 3] > 0) {
       this.bitmap.data[idx + 0] = 255;
       this.bitmap.data[idx + 1] = 68;
       this.bitmap.data[idx + 2] = 68;
    }
  });
  await image.write('src/assets/recording-logo.png');
  await image.write('src/assets/img/recording-logo.png');
  console.log('done');
}
main();
