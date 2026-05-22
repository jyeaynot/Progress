async function run() {
  const url = "https://www.figma.com/file/GSEtFo7TJYWlewrTZxGPAa/thumbnail?node-id=0-1&in-better-link-exp=true&t=XvQN8c8ikfKBMcmr-1";
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    console.log("Status:", res.status);
    console.log("Location:", res.headers.get("location"));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
run();
