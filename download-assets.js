import https from "https";
import fs from "fs";
import path from "path";

const BASE_URL = "https://regalheritageob.com/temp/custom/assets";

const files = [
  // CSS
  { url: `${BASE_URL}/css/style.css`, dest: "assets/css/style.css" },
  { url: `${BASE_URL}/css/responsive.css`, dest: "assets/css/responsive.css" },
  { url: `${BASE_URL}/css/dark-theme.css`, dest: "assets/css/dark-theme.css" },
  { url: `${BASE_URL}/css/flaticon.css`, dest: "assets/css/flaticon.css" },
  { url: `${BASE_URL}/css/fancybox.css`, dest: "assets/css/fancybox.css" },
  {
    url: `${BASE_URL}/css/odometer.min.css`,
    dest: "assets/css/odometer.min.css",
  },
  // JS
  { url: `${BASE_URL}/js/main.js`, dest: "assets/js/main.js" },
  {
    url: `${BASE_URL}/js/owl.carousel.min.js`,
    dest: "assets/js/owl.carousel.min.js",
  },
  { url: `${BASE_URL}/js/odometer.min.js`, dest: "assets/js/odometer.min.js" },
  { url: `${BASE_URL}/js/fancybox.js`, dest: "assets/js/fancybox.js" },
  { url: `${BASE_URL}/js/aos.js`, dest: "assets/js/aos.js" },
  { url: `${BASE_URL}/js/wow.min.js`, dest: "assets/js/wow.min.js" },
];

// Create folders
["assets/css", "assets/js"].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`📁 Created folder: ${dir}`);
});

let completed = 0;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function run() {
  console.log(`\n🚀 Downloading ${files.length} files...\n`);
  for (const f of files) {
    try {
      await download(f.url, f.dest);
      completed++;
      console.log(`✅ ${f.dest}`);
    } catch (err) {
      console.log(`❌ FAILED: ${f.dest} — ${err.message}`);
    }
  }
  console.log(`\n✅ Done! ${completed}/${files.length} files downloaded.`);
  console.log(
    `📂 Upload the "assets" folder to your Hostinger root via File Manager.`,
  );
}

run();
