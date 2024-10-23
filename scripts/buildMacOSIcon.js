import { execaCommand as execa } from "execa";
import fs from "fs-extra";

(async () => {
  const targetPath = `public/icons.iconset`;
  await fs.mkdir(targetPath);
  for (let i = 4; i <= 10; i++) {
    const size = Math.pow(2, i);
    const fileName = `icon_${size}x${size}.png`;
    await execa(
      `sips -z ${size} ${size} public/logo.png --out public/${fileName}`
    );
    await fs.move(`public/${fileName}`, `${targetPath}/${fileName}`);
  }
  await execa(`iconutil -c icns ${targetPath} -o public/icon.icns`);
})();
