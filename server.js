const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT    = 3000;
const DB_FILE = path.join(__dirname, "database.json");

// ── Database helpers ─────────────────────────────────────────
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], orders: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getBody(req) {
  return new Promise(resolve => {
    let b = "";
    req.on("data", c => b += c);
    req.on("end", () => resolve(JSON.parse(b || "{}")));
  });
}

function serveFile(res, filePath, type) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": type }); res.end(data);
  });
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// ── Server ───────────────────────────────────────────────────
http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = req.url;

  // Static files
  if (url === "/" || url === "/index.html") return serveFile(res, path.join(__dirname, "index.html"), "text/html");
  if (url === "/style.css")  return serveFile(res, path.join(__dirname, "style.css"), "text/css");
  if (url === "/app.js")     return serveFile(res, path.join(__dirname, "app.js"), "application/javascript");

  // ── POST /login ────────────────────────────────────────────
  if (url === "/login" && req.method === "POST") {
    const body = await getBody(req);
    const db = loadDB();
    let user = db.users.find(u => u.email === body.email);
    if (!user) {
      user = { name: body.name, email: body.email, password: body.password, joinedAt: new Date().toLocaleString() };
      db.users.push(user);
      saveDB(db);
      console.log(`✅ New user: ${body.name} (${body.email})`);
    } else {
      console.log(`👤 Login: ${user.name}`);
    }
    return json(res, { success: true, user: { name: user.name, email: user.email } });
  }

  // ── POST /place-order ──────────────────────────────────────
  if (url === "/place-order" && req.method === "POST") {
    const body = await getBody(req);
    const db = loadDB();
    db.orders.push(body);
    saveDB(db);
    console.log(`🛒 Order: ${body.id} by ${body.user} — ₹${body.total}`);
    return json(res, { success: true, orderId: body.id });
  }

  // ── GET /get-orders ────────────────────────────────────────
  if (url === "/get-orders" && req.method === "GET") {
    return json(res, loadDB().orders);
  }

  // ── GET /get-db (admin) ────────────────────────────────────
  if (url === "/get-db" && req.method === "GET") {
    const db = loadDB();
    // Hide passwords from response
    const safeUsers = db.users.map(u => ({ name: u.name, email: u.email, joinedAt: u.joinedAt }));
    return json(res, { users: safeUsers, orders: db.orders });
  }

  res.writeHead(404); res.end("Not found");

}).listen(PORT, () => {
  console.log("─────────────────────────────────────────");
  console.log(`🚀 ShopEasy running at http://localhost:${PORT}`);
  console.log(`💾 Database file: database.json`);
  console.log(`👑 Admin login: admin@shopeasy.com / admin123`);
  console.log("─────────────────────────────────────────");
});
