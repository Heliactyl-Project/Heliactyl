const fs = require('fs');

const path = require('path');

let addons = {};

/**
 * Addon Handler for Loading Addons
 * This entire Addon Handler is quite scuffed but it works.
 * 
*/


function loadAddon(addonPath) {
  // Read addon file content
  const addonCode = fs.readFileSync(addonPath, 'utf-8');

  // Create a context to execute the code
  const addonContext = {
    require: require, // Provide the require function
    console: console // Provide the console object if needed
  };

  // Explicitly declare module within the context
  addonContext.module = { exports: {} };

  // Execute the code with a new context
  const vm = require('vm');
  vm.createContext(addonContext);
  vm.runInContext(addonCode, addonContext);

  // Access the loaded addon
  const addon = addonContext.module.exports;
  return addon;
}

function load(app, db) {
  console.log("[DEBUG] - AddonHandler loaded");

  const addonsDirectory = path.join('Backend', 'Addons');

  // Read all addon files from the directory
  const addonFiles = fs.readdirSync(addonsDirectory).filter(file => file.endsWith('.js'));

  // Load each addon
  addonFiles.forEach(file => {
    const addonName = path.basename(file, '.js');
    const addonPath = path.join(addonsDirectory, file);
    console.log(`[DEBUG] ${addonName}`);
    addons[addonName] = loadAddon(addonPath);
  });

}

function getAddons() {
  return addons;
}

module.exports = {
  load,
  getAddons
};
