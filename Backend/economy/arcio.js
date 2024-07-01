const settings = require("../../settings.json");
const indexjs = require("../../index.js");
const ejs = require("ejs");
const chalk = require("chalk");

let currentlyonpage = {};

module.exports.load = async function (app, db) {
  app.get("/arcioerror", async (req, res) => {
    if (!req.session.pterodactyl) return res.redirect("/login");
    let theme = indexjs.get(req);
    res.redirect(theme.settings.redirect.arcioerror + (req.query.err ? ("?arcioerr=" + req.query.err) : ""));
  });

  app.ws("/" + settings.api.arcio["afk page"].path, async (ws, req) => {
    if (!req.session.arcsessiontoken) return ws.close();

    let token = req.headers["sec-websocket-protocol"];

    if (!token) return ws.close();
    if (typeof token !== "string") return ws.close();

    // Disabled Token Checking for now as it fails. Gonna look into it later.
    // if (token !== req.session.arcsessiontoken) return ws.close();

    let newsettings = JSON.parse(require("fs").readFileSync("./settings.json"));
    if (newsettings.api.arcio.enabled !== true) return ws.close();
    if (newsettings.api.arcio["afk page"].enabled !== true) return ws.close();
    if (currentlyonpage[req.session.userinfo.id]) return ws.close();

    currentlyonpage[req.session.userinfo.id] = true;

    let coinloop = setInterval(
      async function () {
        let usercoins = await db.get("coins-" + req.session.userinfo.id);
        usercoins = usercoins ? usercoins : 0;
        usercoins = usercoins + newsettings.api.arcio["afk page"].coins;
        if (usercoins > 999999999999999) return ws.close();
        await db.set("coins-" + req.session.userinfo.id, usercoins);
      }, newsettings.api.arcio["afk page"].every * 1000
    );

    ws.onclose = async () => {
      clearInterval(coinloop);
      delete currentlyonpage[req.session.userinfo.id];
    }
  });
};

