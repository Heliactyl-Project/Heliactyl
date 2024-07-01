module.exports = `
let scheme = "ws";

if (document.location.protocol === "https:") {
  scheme += "s";
}

let connection = new WebSocket(scheme + "://" + document.location.hostname + "/" + arciopath, token);

connection.onopen = function(evt) {
  setInterval(() => {
    connection.send(JSON.stringify({
      type: "ping",
    }));
  }, 5000);
};

connection.onclose = function(evt) {
  window.location.href = "arcioerror";
};

let timer = everywhat;
let hascoin = 0;

setInterval(
  async function() {
    timer--;
    if (timer < 1) {
      hascoin = hascoin + gaincoins;
      document.getElementById("arciogainedcoins").innerHTML = hascoin;
      timer = everywhat;
    }
    document.getElementById("arciotimer").innerHTML = timer;
  }, 1000
)


`;