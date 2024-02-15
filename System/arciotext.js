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

setInterval(function() {
  arcdetecter();

  function arcdetecter() {
    let iframe = document.getElementById('arc-widget-launcher-iframe');
    if (iframe == null) {
      setTimeout(() => {
        arcdetecter()
      }, 50);
    } else {
      let innerDoc = iframe.contentDocument || iframe.contentWindow.document;
      setTimeout(() => {
        getarcstatus(innerDoc)
      }, 500);
    };
  };

  function getarcstatus(innerDoc) {
    let arcwidgetdiv = innerDoc.getElementById("launcher")
    if (arcwidgetdiv == null) {
      setTimeout(() => {
        arcdetecter()
      }, 50);
    } else {
      let arcwidgetstatus = arcwidgetdiv.className;
      if (arcwidgetstatus == "is-opted-out") {
        window.location.href = "arcioerror";
      } else if (arcwidgetstatus == "") {
        return undefined
      } else {

      };
    };
  };
}, 1000);
`;