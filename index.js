//
// Heliactyl 14 ES/ID, Codename Beryllium
// 
//  * Copyright Ghostload
//  * Please read the "License" file
//

"use strict";

// Load packages.

const fs = require("fs");
const fetch = require('node-fetch');
const chalk = require("chalk");
const os = require('os');
const gradient = require('gradient-string');
const arciotext = require('./System/arciotext')
const glob = require('fast-glob');
const path = require('path');
const packageJson = require('./package.json');
const figlet = require('figlet');
const { rateLimit } = require('express-rate-limit')
const { ClusterMemoryStorePrimary } = '@express-rate-limit/cluster-memory-store'

global.Buffer = global.Buffer || require('buffer').Buffer;

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}
if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString('binary');
  };
}

// Load settings.

const settings = require("./settings.json");

const defaultthemesettings = {
  index: "index.ejs",
  notfound: "index.ejs",
  redirect: {},
  pages: {},
  mustbeloggedin: [],
  mustbeadmin: [],
  variables: {}
};

const JavaScriptObfuscator = require('javascript-obfuscator');

async function renderData(req, db, theme) {
  try {
    let renderdata = {
      req: req,
      settings: settings,
      userinfo: req.session.userinfo,
      packagename: req.session.userinfo ? await db.get("package-" + req.session.userinfo.id) || settings.api.client.packages.default : null,
      extraresources: !req.session.userinfo ? null : (await db.get("extra-" + req.session.userinfo.id) || { ram: 0, disk: 0, cpu: 0, servers: 0 }),
      packages: req.session.userinfo ? settings.api.client.packages.list[await db.get("package-" + req.session.userinfo.id) || settings.api.client.packages.default] : null,
      coins: settings.api.client.coins.enabled == true ? (req.session.userinfo ? (await db.get("coins-" + req.session.userinfo.id) || 0) : null) : null,
      pterodactyl: req.session.pterodactyl,
      theme: theme.name,
      extra: theme.settings.variables,
      addons: theme.settings.addons,
      db: db
    };

    if (settings.api.arcio.enabled == true && req.session.arcsessiontoken) {
      let arcioafktext = `
        let token = "${req.session.arcsessiontoken}";
        let everywhat = ${settings.api.arcio["afk page"].every};
        let gaincoins = ${settings.api.arcio["afk page"].coins};
        let arciopath = "${settings.api.arcio["afk page"].path.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}";
        ${arciotext}`;

      renderdata.arcioafktext = JavaScriptObfuscator.obfuscate(arcioafktext);
    };

    return renderdata;
  } catch (error) {
    console.error('Error rendering data:', error);
    return null;
  }
}

module.exports.renderData = renderData;

// Load database

const Keyv = require("keyv");
const db = new Keyv(settings.database);

db.on('error', err => {
  console.log(chalk.red("Error: Cannot load database."))
});

module.exports.db = db;

// Load ExpressJS.

const express = require("express");
const app = express();
require('express-ws')(app);

// Load express addons.

const ejs = require("ejs");
const session = require("express-session");
const indexjs = require("./index.js");

// Load the website.

module.exports.app = app;

app.use(session({
  secret: settings.website.secret,
  name: 'sauth_sid',
  resave: false,
  saveUninitialized: false
}));

app.use(express.json({
  inflate: true,
  limit: '500kb',
  reviver: null,
  strict: true,
  type: 'application/json',
  verify: undefined
}));

app.set("trust proxy", true);

// replaced with addon loader later on
const addons = [
  { name: 'Example Addon 1', version: '1.0.0', status: chalk.green('Active') },
  { name: 'Example Addon 2', version: '1.0.0', status: chalk.red('Error') }
];
const listener = app.listen(settings.website.port, () => {
  console.log(`Server is running on port ${settings.website.port}`);

  // Basic Startup Information
  let Gradient = gradient(['#ed4566', '#f9b9a1']);
  console.log('===================================');
  console.log(Gradient(figlet.textSync('Heliactyl ', { font: 'ANSI Shadow', horizontalLayout: 'full' })));
  console.log('===================================');
  console.log(`Version: ${packageJson.version}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${settings.website.port}`);
  console.log(`System Platform: ${os.platform()} ${os.arch()}`);
  console.log(`System Uptime: ${os.uptime()} seconds`);
  console.log(`Total Memory: ${Math.round(os.totalmem() / (1024 * 1024))} MB`);
  console.log(`Free Memory: ${Math.round(os.freemem() / (1024 * 1024))} MB`);

  // Addons Information
  console.log('Loaded Addons:');
  addons.forEach(addon => {
    console.log(`  - ${addon.name} (Version: ${addon.version}, Status: ${addon.status})`);
  });

  console.log('===================================');
});


const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 5 minutes).
  standardHeaders: 'draft-7', // draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  validate: {trustProxy: false},
  // store: new ClusterMemoryStoreWorker(),  // Later switching to Clustering the entire thing thereby requiring ClusterMemoryStore or smth similar
})

function RateLimiter(req, res, next) {
  // Skipping the Assets route because most pages or themes probably will load a buch of files depleting the ratelimit
  if (req.path.startsWith('/assets/')) {
    return next();
  }
  limiter(req, res, next);
}
app.use(RateLimiter)


// Load the API files.
const router = glob.sync('./Backend/**/*.js');
for (const file of router) {
  const router = require(file);
  if (typeof router.load === 'function') router.load(app, db);
}

app.all("*", async (req, res) => {
  if (req.session.pterodactyl) if (req.session.pterodactyl.id !== await db.get("users-" + req.session.userinfo.id)) return res.redirect("/login?prompt=none");
  let theme = indexjs.get(req);
  let newsettings = JSON.parse(require("fs").readFileSync("./settings.json"));
  if (newsettings.api.arcio.enabled == true) req.session.arcsessiontoken = Math.random().toString(36).substring(2, 15);
  if (theme.settings.mustbeloggedin.includes(req._parsedUrl.pathname)) if (!req.session.userinfo || !req.session.pterodactyl) return res.redirect("/login" + (req._parsedUrl.pathname.slice(0, 1) == "/" ? "?redirect=" + req._parsedUrl.pathname.slice(1) : ""));
  if (theme.settings.mustbeadmin.includes(req._parsedUrl.pathname)) {
    ejs.renderFile(
      `./Public/Themes/${theme.name}/${theme.settings.notfound}`,
      await indexjs.renderData(req, db, theme),
      null,
      async function (err, str) {
        delete req.session.newaccount;
        delete req.session.password;
        if (!req.session.userinfo || !req.session.pterodactyl) {
          if (err) {
            console.log(chalk.red(`Warning: An error occured while loading route ${req._parsedUrl.pathname}:`));
            console.log(err);
            return res.send("Failed to load page. The error has been logged to the console.");
          };
          res.status(200);
          return res.send(str);
        };

        let cacheaccount = await fetch(
          settings.pterodactyl.domain + "/api/application/users/" + (await db.get("users-" + req.session.userinfo.id)) + "?include=servers",
          {
            method: "get",
            headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${settings.pterodactyl.key}` }
          }
        );
        if (await cacheaccount.statusText == "Not Found") {
          if (err) {
            console.log(chalk.red(`Warning: An error occured while loading route ${req._parsedUrl.pathname}:`));
            console.log(err);
            return res.send("Failed to load page. The error has been logged to the console.");
          };
          return res.send(str);
        };
        let cacheaccountinfo = JSON.parse(await cacheaccount.text());

        req.session.pterodactyl = cacheaccountinfo.attributes;
        if (cacheaccountinfo.attributes.root_admin !== true) {
          if (err) {
            console.log(chalk.red(`Warning: An error occured while loading route ${req._parsedUrl.pathname}:`));
            console.log(err);
            return res.send("Failed to load page. The error has been logged to the console.");
          };
          return res.send(str);
        };

        ejs.renderFile(
          `./Public/Themes/${theme.name}/${theme.settings.pages[req._parsedUrl.pathname.slice(1)] ? theme.settings.pages[req._parsedUrl.pathname.slice(1)] : theme.settings.notfound}`,
          await indexjs.renderData(req, db, theme),
          null,
          function (err, str) {
            delete req.session.newaccount;
            delete req.session.password;
            if (err) {
              console.log(`Warning: An error occured while loading route ${req._parsedUrl.pathname}:`);
              console.log(err);
              return res.send("Failed to load page. The error has been logged to the console.");
            };
            res.status(200);
            res.send(str);
          });
      });
    return;
  };
  ejs.renderFile(
    `./Public/Themes/${theme.name}/${theme.settings.pages[req._parsedUrl.pathname.slice(1)] ? theme.settings.pages[req._parsedUrl.pathname.slice(1)] : theme.settings.notfound}`,
    await indexjs.renderData(req, db, theme),
    null,
    function (err, str) {
      delete req.session.newaccount;
      delete req.session.password;
      if (err) {
        console.log(chalk.red(`Warning: An error occured while loading route ${req._parsedUrl.pathname}:`));
        console.log(err);
        return res.send("Failed to load page. The error has been logged to the console.");
      };
      res.status(200);
      res.send(str);
    });
});

module.exports.get = function (req) {
  let defaulttheme = JSON.parse(fs.readFileSync("./settings.json")).defaulttheme;
  let tname = encodeURIComponent(getCookie(req, "theme"));
  let name = (
    tname ?
      fs.existsSync(`./Public/Themes/${tname}`) ?
        tname
        : defaulttheme
      : defaulttheme
  )
  return {
    settings: (
      fs.existsSync(`./Public/Themes/${name}/pages.json`) ?
        JSON.parse(fs.readFileSync(`./Public/Themes/${name}/pages.json`).toString())
        : defaultthemesettings
    ),
    name: name
  };
};

module.exports.islimited = async function () {
  return cache == true ? false : true;
}

module.exports.ratelimits = async function (length) {
  if (cache == true) return setTimeout(
    indexjs.ratelimits
    , 1
  );
  cache = true;
  setTimeout(
    async function () {
      cache = false;
    }, length * 1000
  )
}

// Get a cookie.
function getCookie(req, cname) {
  let cookies = req.headers.cookie;
  if (!cookies) return null;
  let name = cname + "=";
  let ca = cookies.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return decodeURIComponent(c.substring(name.length, c.length));
    }
  }
  return "";
}
