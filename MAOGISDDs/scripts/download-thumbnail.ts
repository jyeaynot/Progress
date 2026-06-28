import fs from "fs";
import path from "path";

async function run() {
  const url = "https://www.figma.com/file/GSEtFo7TJYWlewrTZxGPAa/thumbnail?node-id=0-1&in-better-link-exp=true&t=XvQN8c8ikfKBMcmr-1";
  console.log("Fetching thumbnail...");
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    const buffer = await res.arrayBuffer();
    const dest = path.join("C:\\Users\\jaymd\\.gemini\\antigravity\\brain\\11bda59b-c775-4329-8b70-59686a069e43", "figma_thumbnail.png");
    fs.writeFileSync(dest, Buffer.from(buffer));
    console.log("Saved thumbnail to:", dest);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
run();
