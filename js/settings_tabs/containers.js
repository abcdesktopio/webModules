/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

import * as launcher from '../launcher.js';
import * as notificationSystem from '../notificationsystem.js';
import * as system from '../system.js';
import { settingsEvents } from '../settingsevents.js';
import * as languages from '../languages.js';

let refreshIsActive = false;
let idInterval = 0;
let storageContainers = [];
let containerSelectedForInfos = '';

function hideInfosSection() {
  const taskManagerContainerInfos = document.getElementById('task-manager-container-infos');
  const taskManagerContainerList = document.getElementById('task-manager-container-list');
  taskManagerContainerInfos.style.height = '0%';
  taskManagerContainerList.style.height = '100%';
}

const buildLine = (row, container) => {
  const { status, short_id: shortId, id, podname, type } = container;
  const { cardContainer, cardBody } = system.getCardWrappers();
  const envTranslation = languages.getTranslate('settings-containers-btn-env');
  const killTranslation = languages.getTranslate('settings-containers-btn-kill');
  const removeTranslation = languages.getTranslate('settings-containers-btn-remove');

  const divAppName = document.createElement('div');
  const divShortId = document.createElement('div');
  const divCmd = document.createElement('div');
  const divState = document.createElement('div');
  const divButtonLog = document.createElement('div');
  const divButtonEnv = document.createElement('div');
  const divButtonKill = document.createElement('div');
  const divButtonRemove = document.createElement('div');
  const btnLogs = document.createElement('button');
  const btnEnv = document.createElement('button');
  const btnKill = document.createElement('button');
  const btnRemove = document.createElement('button');

  const imgAppname = document.createElement('img');
  const spanAppname = document.createElement('span');

  // if oc.icondata base64 svg format exist
  if (container['oc.icondata'])
    // read base64 formated svg icon
    imgAppname.src = "data:image/svg+xml;base64," + container['oc.icondata'];
  else
    // use url format to download image
    imgAppname.src = window.od.net.urlrewrite(`../img/app/${container['oc.icon']}`);

  spanAppname.className = 'align-middle btn-left-very-small';
  spanAppname.innerText = container['oc.displayname'];
  // spanAppname.style = 'padding-left: 5px;';

  divAppName.className = 'align-self-center text-left col-xl-1 col-lg-2 col-md-2 col-sm-3 col-4';
  // divAppName.className = 'align-self-center text-left';
  divAppName.style = 'white-space: nowrap; overflow: hidden; width: 10rem;';

  
  divAppName.appendChild(imgAppname);
  divAppName.appendChild(spanAppname);

  const imgShortId = document.createElement('img');
  const spanShortId = document.createElement('span');


  if (container['runtime'] == 'kubernetes' )
	  imgShortId.src = window.od.net.urlrewrite('../img/settings/kubernetes.svg');
  else
  	imgShortId.src = window.od.net.urlrewrite('../img/settings/docker.svg');

  spanShortId.className = 'align-middle';
  spanShortId.style = 'padding-left: 5px;';
  spanShortId.innerText = shortId;

  divShortId.className = 'align-self-center text-left col-xl-2 col-lg-2 col-md-3 col-sm-3 d-md-block d-sm-block d-none';
  //divShortId.className = 'align-self-center text-left d-md-block d-sm-block d-none';
  divShortId.style = 'white-space: nowrap;overflow: hidden;';

  divShortId.appendChild(imgShortId);
  divShortId.appendChild(spanShortId);

  const subDivCmd = document.createElement('div');
  const spanSubDivCmd = document.createElement('span');

  subDivCmd.className = 'align-middle';
  spanSubDivCmd.innerText = `${container['oc.path']}${(container['oc.args'] ? ` ${container['oc.args']}` : '')}`;

  divCmd.className = 'align-self-center text-left col-xxl-5 col-xl-4 col-lg-4 d-xxl-block d-xl-block d-lg-block d-md-none d-none';
  divCmd.style.overflow = 'auto';

  subDivCmd.appendChild(spanSubDivCmd);
  divCmd.appendChild(subDivCmd);

  if (status) {
    const spanState = document.createElement('span');
    spanState.className = 'align-middle';
    spanState.innerText = `${status[0].toUpperCase()}${status.slice(1)}`;
    divState.appendChild(spanState);
  }

  divState.className = 'align-self-center text-center col-xl-1 col-lg-1 col-md-3 col-2 d-xl-block d-lg-block d-md-block d-none';
  divButtonLog.className = 'text-center col-auto';
  divButtonEnv.className = 'text-center col-auto';
  divButtonKill.className = 'text-center col-auto';
  divButtonRemove.className = 'text-center col-auto d-xl-block d-none';

  divButtonLog.appendChild(btnLogs);
  divButtonEnv.appendChild(btnEnv);
  divButtonKill.appendChild(btnKill);
  divButtonRemove.appendChild(btnRemove);

  btnLogs.innerText = 'Logs';
  btnLogs.className = 'btn btn-info btn-left';
  btnLogs.addEventListener('click', () => {
    launcher.getContainerLogs(container['podname'], id)
      .done((res) => {
        const taskManagerContainerInfos = document.getElementById('task-manager-container-infos');
        const taskManagerContainerList = document.getElementById('task-manager-container-list');
        const cloneTaskManagerContainerInfos = taskManagerContainerInfos.cloneNode(true);
        const cloneTaskManagerLogsContainer = system.removeAllChilds(cloneTaskManagerContainerInfos.querySelector('#task-manager-container-logs'));

        cloneTaskManagerContainerInfos.querySelector('#task-manager-container-env').style.display = 'none';
        cloneTaskManagerContainerInfos.style.height = '50%';
        cloneTaskManagerLogsContainer.style.display = 'block';

        if (!res.result) {
          cloneTaskManagerLogsContainer.append(`No logs for container id [${id}]`);
        } else if (res.result.includes('\n')) {
          for (const line of res.result.split('\n')) {
            cloneTaskManagerLogsContainer.append(line);
            cloneTaskManagerLogsContainer.appendChild(document.createElement('br'));
          }
        } else {
          cloneTaskManagerLogsContainer.append(res.result);
        }

        taskManagerContainerList.style.height = '50%';
        taskManagerContainerInfos.parentNode.replaceChild(
          cloneTaskManagerContainerInfos,
          taskManagerContainerInfos,
        );
        containerSelectedForInfos = id;
        document.getElementById('task-manager-container-infos-current-container').innerText = id;
      });
  });

  btnEnv.id = 'settings-containers-btn-env';
  btnEnv.innerText = envTranslation || 'Env';
  btnEnv.className = 'btn btn-secondary btn-left';
  btnEnv.addEventListener('click', () => {
    launcher.getContainerEnv(container['podname'], id)
      .done((res) => {
        const dico = res.result;
        const taskManagerContainerInfos = document.getElementById('task-manager-container-infos');
        const taskManagerContainerList = document.getElementById('task-manager-container-list');
        const cloneTaskManagerContainerInfos = taskManagerContainerInfos.cloneNode(true);

        const cloneTaskManagerEnvContainer = cloneTaskManagerContainerInfos.querySelector('#task-manager-container-env');
        const cloneTable = system.removeAllChilds(cloneTaskManagerEnvContainer.querySelector('table'));
        cloneTaskManagerContainerInfos.querySelector('#task-manager-container-logs').style.display = 'none';
        cloneTaskManagerContainerInfos.style.height = '50%';
        cloneTaskManagerEnvContainer.style.display = 'block';
        cloneTable.id = 'task-manager-container-env-table-container-env';

        const dicoOrdered = {};
        Object.keys(dico)
          .sort()
          .forEach((k) => {
            dicoOrdered[k] = dico[k];
          });

        for (const key in dicoOrdered) {
          if (dico[key]) {
            const tr = document.createElement('tr');
            const firstTD = document.createElement('td');
            firstTD.className = "text-info";
            const secondTD = document.createElement('td');

            firstTD.innerText = key;
            secondTD.innerText = dico[key];

            tr.appendChild(firstTD);
            tr.appendChild(secondTD);
            cloneTable.appendChild(tr);
          }
        }

        taskManagerContainerList.style.height = '50%';
        taskManagerContainerInfos.parentNode.replaceChild(
          cloneTaskManagerContainerInfos,
          taskManagerContainerInfos,
        );
        containerSelectedForInfos = id;
        document.getElementById('task-manager-container-infos-current-container').innerText = id;
      });
  });

  btnKill.id = 'settings-containers-btn-kill';
  btnKill.innerText = killTranslation || 'Kill';
  btnKill.className = 'btn btn-danger btn-left';

  if (status === 'exited' || status === 'terminated') {
    btnKill.setAttribute('disabled', 'true');
  }
  
  if (type === 'ephemeralcontainer') {
    btnKill.setAttribute('disabled', 'true');
  }

  const handlerKill = () => {
    system.addAppLoader(btnKill);
    launcher.stopContainer(container['podname'], id, container['oc.displayname'])
      .done(() => {
        system.removeAppLoader(btnKill);
        btnKill.removeEventListener('click', handlerKill);
        btnKill.setAttribute('disabled', 'true');
      });
  };
  btnKill.addEventListener('click', handlerKill);

  btnRemove.id = 'settings-containers-btn-remove';
  btnRemove.innerText = removeTranslation || 'Remove';
  btnRemove.className = 'btn btn-dark btn-left';
  btnRemove.addEventListener('click', () => {
    launcher.removeContainer( container['podname'], id, container['oc.displayname']);
    if (containerSelectedForInfos === id) {
      hideInfosSection();
    }
  });

  if (type === 'ephemeralcontainer') {
    btnRemove.setAttribute('disabled', 'true');
  }

  cardContainer.className += ' w-100';
  cardContainer.style.overflowX = 'hidden';
  cardBody.appendChild(divAppName);
  cardBody.appendChild(divShortId);
  cardBody.appendChild(divCmd);
  cardBody.appendChild(divState);
  cardBody.appendChild(divButtonLog);
  cardBody.appendChild(divButtonEnv);
  cardBody.appendChild(divButtonKill);
  cardBody.appendChild(divButtonRemove);
  row.appendChild(cardContainer);
};

const build = (containers = []) => {
  storageContainers = containers;
  const taskManager = document.getElementById('container-tab');
  if (!taskManager) {
    // the event come later and the windows has been closed
    // nothing to do 
    return;
  }
  const taskManagerContainerInfos = taskManager.querySelector('div#task-manager-container-infos');
  const message = taskManager.querySelector('p.message');

  const wrap = system.removeAllChilds(taskManager.querySelector('#task-manager-container-list')
    .querySelector('div.wrap'));

  if (containers.length === 0) {
    message.style.display = 'block';
    taskManagerContainerInfos.style.display = 'none';
    return;
  }
  message.style.display = 'none';

  const fragment = document.createDocumentFragment();
  for (const container of containers) {
    const row = document.createElement('div');
    row.className = 'row';
    buildLine(row, container);
    fragment.appendChild(row);
  }
  wrap.appendChild(fragment);
};

const getContainers = () => launcher.getContainers()
  .then((res) => {
    if (res.status !== 200 || !res.result || !Array.isArray(res.result)) {
      throw new Error(JSON.stringify(res));
    }
    return res.result;
  })
  .catch(console.error);

const getAndBuildContainers = () => getContainers()
  .then((containers) => {
    if (storageContainers.length !== containers.length) {
      build(containers);
    } else {
      for (const { id } of storageContainers) {
        if (!containers.some((c) => c.id === id)) {
          build(containers);
          break;
        }
      }
    }
  });

const runRefresh = () => getAndBuildContainers()
  .always(() => {
    if (refreshIsActive) {
      setTimeout(() => runRefresh(), 5000);
    }
  });

const stopRefresh = () => {
  if (idInterval !== 0) {
    clearInterval(idInterval);
    idInterval = 0;
  }
};

const onCloseTab = () => {
  refreshIsActive = false;
  stopRefresh();
};

settingsEvents.addEventListener('back', onCloseTab);
settingsEvents.addEventListener('close', onCloseTab);

const initTaskManager = () => getContainers()
  .then((containers) => {
    build(containers);
    refreshIsActive = true;
    runRefresh();
  })
  .fail((result) => {
    if (notificationSystem) {
      if (result.status === 200) {
        notificationSystem.displayNotification('List containers', result.error, (result.status === 401) ? 'deny' : 'error');
      } else {
        notificationSystem.displayNotification('List containers', result.error, 'error');
      }
    }
  });

export const init = (home, taskManager) => {
  system.hide(home);
  system.show(taskManager);
  initTaskManager()
    .always(() => system.show(taskManager));
};
