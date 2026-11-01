import sharp from "sharp";
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable.png", 512],
  ["apple-touch-icon.png", 180],
  ["pink-sun-192.png", 192],
  ["pink-sun-512.png", 512],
  ["pink-sun-maskable.png", 512],
  ["pink-sun-apple.png", 180],
]) {
  await sharp("public/icon.svg")
    .resize(size, size, { kernel: "nearest" })
    .png()
    .toFile("public/" + name);
}
