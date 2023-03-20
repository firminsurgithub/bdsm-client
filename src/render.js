/*
Copyright 2023 Firmin B.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/* Dependencies */
const path = require("node:path"),
  axios = require("axios"),
  fs = require("node:fs"),
  electron = require("electron");

/* Global variables */
let fileserverlist;
let warnStatus = false;

/* Main Function */
electron.ipcRenderer.invoke("getDataPath").then(async (result) => {
  /* Usefull HTML elements */
  const addServerBtn = document.getElementById("add-server"),
    warningDiv = document.getElementById("warning");

  const filepath = path.join(result, "servers.json");
  if (!fs.existsSync(filepath)) {
    console.log("no file, creating one");
    fs.writeFileSync(filepath, `{"servers":[]}`);
    return;
  }

  /* At each data change, update the selected server in the list */
  async function updateServer(index, server) {
    /* Try/Catch to detect if server is not responding */
    try {
      /* Create the div before the fetch to avoid disordered data in the list */
      let div = document.querySelector(`#server-${index}`);
      if (!div) {
        document.querySelector(
          "#table"
        ).innerHTML += `<tr id="server-${index}" class="server"></tr>`;
      }

      const response = await axios({
        method: "post",
        url: `http://${server.ip}:${server.port}/update`,
        responseType: "stream",
        headers: {
          auth: server.password,
        },
      });

      const data = JSON.parse(response.data);

      div.innerHTML = `<td>🟢</td>
        <td>${server.prettyname}</td>
        <td>${data.serverId}</td>
        <td>${data.cpuUsage.toFixed(2)}%</td>
        <td>${data.ramUsage} (${data.ramPercent})</td>
        <td>${data.osPlatform}</td>
        <td><button class="delbtn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg></button></td>`;
    } catch (error) {
      let div = document.querySelector(`#server-${index}`);
      if (!div) {
        document.querySelector(
          "#table"
        ).innerHTML += `<tr id="server-${index}" class="server"></tr>`;
      }
      warnStatus = true;
      let status = "🔴";
      if (error.response) {
        switch (error.response.status) {
          case 200:
            status = "🟢";
            break;
          case 403:
            status = "🔐";
            break;
          default:
            status = "🟠";
            break;
        }
      }
      div.innerHTML = `<td>${status}</td>
        <td>${server.prettyname}</td>
        <td>---</td>
        <td>---%</td>
        <td>--- (---)</td>
        <td>---</td>
        <td><button class="delbtn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg></button></td>`;
    }

    if (index == fileserverlist.length - 1) {
      document.getElementById("loading").innerHTML = "";
      warningDiv.innerHTML = warnStatus
        ? "❗ Some servers deserve your attention"
        : "✅ All servers are up and running";
    }
  }

  /* Update the server list */
  function updateServerList() {
    warnStatus = false;
    fileserverlist = JSON.parse(fs.readFileSync(filepath, "utf8")).servers;
    for (let [index, server] of fileserverlist.entries()) {
      updateServer(index, server);
    }
  }

  /* Do it and do it again */
  updateServerList();
  setInterval(updateServerList, 2000);
});

electron.ipcRenderer.invoke("getAppVersion").then(async (result) => {
  document.getElementById("version").innerHTML = result;
});
