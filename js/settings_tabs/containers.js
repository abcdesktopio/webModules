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

/**
 * @param {HTMLDivElement} row
 */
const removeNextDivider = (row) => {
  const childs = Array.from(row.parentNode.children);
  const index = childs.indexOf(row);
  const lastIndex = childs.length - 1;
  if (lastIndex !== index) {
    const divider = childs[index + 1];
    if (divider.tagName.toUpperCase() === 'HR') {
      row.parentNode.removeChild(divider);
    }
  }
};

const buildLine = (row, container) => {
  const { status, short_id: shortId, id } = container;
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

  imgAppname.src = window.od.net.urlrewrite(`../img/app/${container['oc.icon']}`);
  spanAppname.className = 'align-middle';
  spanAppname.innerText = container['oc.displayname'];
  spanAppname.style = 'padding-left: 5px;';

  divAppName.className = 'align-self-center text-left col-xl-1 col-lg-1 col-md-2 col-sm-2 col-4';
  divAppName.style = 'white-space: nowrap;overflow: hidden;';

  divAppName.appendChild(imgAppname);
  divAppName.appendChild(spanAppname);

  const imgShortId = document.createElement('img');
  const spanShortId = document.createElement('span');

  imgShortId.src = window.od.net.urlrewrite('../img/settings/docker.svg');
  spanShortId.className = 'align-middle';
  spanShortId.style = 'padding-left: 5px;';
  spanShortId.innerText = shortId;

  divShortId.className = 'align-self-center text-left col-xl-2 col-lg-2 col-md-2 col-sm-3 d-md-block d-sm-block d-none';
  divShortId.style = 'white-space: nowrap;overflow: hidden;';

  divShortId.appendChild(imgShortId);
  divShortId.appendChild(spanShortId);

  const subDivCmd = document.createElement('div');
  const spanSubDivCmd = document.createElement('span');

  subDivCmd.className = 'align-middle';
  spanSubDivCmd.innerText = `${container['oc.path']}${(container['oc.args'] ? ` ${container['oc.args']}` : '')}`;

  divCmd.className = 'align-self-center text-left col-xl-3 d-xl-block d-lg-none d-md-none d-none';

  subDivCmd.appendChild(spanSubDivCmd);
  divCmd.appendChild(subDivCmd);

  if (status) {
    const spanState = document.createElement('span');
    spanState.className = 'align-middle';
    spanState.innerText = `${status[0].toUpperCase()}${status.slice(1)}`;
    divState.appendChild(spanState);
  }

  divState.className = 'align-self-center text-center col-auto d-xl-block d-lg-block d-md-block d-none';

  divButtonLog.className = 'text-center col-auto d-xl-block d-lg-block d-md-block d-sm-block';
  divButtonEnv.className = 'text-center col-auto d-xl-block d-lg-block d-md-block d-none';
  divButtonKill.className = 'text-center col-auto';
  divButtonRemove.className = 'text-center col-auto d-xl-block d-lg-block d-none';

  divButtonLog.appendChild(btnLogs);
  divButtonEnv.appendChild(btnEnv);
  divButtonKill.appendChild(btnKill);
  divButtonRemove.appendChild(btnRemove);

  btnLogs.innerText = 'Logs';
  btnLogs.className = 'btn btn-info';
  btnLogs.addEventListener('click', () => {
    launcher.getContainerLogs(id)
      .done((res) => {
        const taskManagerContainerInfos = document.getElementById('task-manager-container-infos');
        const cloneTaskManagerContainerInfos = taskManagerContainerInfos.cloneNode(true);
        const cloneTaskManagerLogsContainer = system.removeAllChilds(cloneTaskManagerContainerInfos.querySelector('#task-manager-container-logs'));

        cloneTaskManagerContainerInfos.querySelector('#task-manager-container-env').style.display = 'none';
        cloneTaskManagerContainerInfos.style.display = 'block';
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

        taskManagerContainerInfos.parentNode.replaceChild(
          cloneTaskManagerContainerInfos,
          taskManagerContainerInfos,
        );
      });
  });

  btnEnv.id = 'settings-containers-btn-env';
  btnEnv.innerText = envTranslation || 'Env';
  btnEnv.className = 'btn btn-secondary';
  btnEnv.addEventListener('click', () => {
    launcher.getContainerEnv(id)
      .done((res) => {
        const dico = res.result;
        const taskManagerContainerInfos = document.getElementById('task-manager-container-infos');
        const cloneTaskManagerContainerInfos = taskManagerContainerInfos.cloneNode(true);

        const cloneTaskManagerEnvContainer = cloneTaskManagerContainerInfos.querySelector('#task-manager-container-env');
        const cloneTable = system.removeAllChilds(cloneTaskManagerEnvContainer.querySelector('table'));
        cloneTaskManagerContainerInfos.querySelector('#task-manager-container-logs').style.display = 'none';
        cloneTaskManagerContainerInfos.style.display = 'block';
        cloneTaskManagerEnvContainer.style.display = 'block';

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
            const secondTD = document.createElement('td');

            firstTD.innerText = key;
            secondTD.innerText = dico[key];

            tr.appendChild(firstTD);
            tr.appendChild(secondTD);
            cloneTable.appendChild(tr);
          }
        }

        taskManagerContainerInfos.parentNode.replaceChild(
          cloneTaskManagerContainerInfos,
          taskManagerContainerInfos,
        );
      });
  });

  btnKill.id = 'settings-containers-btn-kill';
  btnKill.innerText = killTranslation || 'Kill';
  btnKill.className = 'btn btn-danger';
  const handlerKill = () => {
    system.addAppLoader(btnKill);
    launcher.stopContainer(id, container['oc.displayname'])
      .done(() => {
        system.removeAppLoader(btnKill);
        btnKill.removeEventListener('click', handlerKill);
        btnKill.setAttribute('disabled', 'true');
      });

    removeNextDivider(row);
  };
  btnKill.addEventListener('click', handlerKill);

  btnRemove.id = 'settings-containers-btn-remove';
  btnRemove.innerText = removeTranslation || 'Remove';
  btnRemove.className = 'btn btn-dark';
  btnRemove.addEventListener('click', () => {
    launcher.removeContainer(id, container['oc.displayname']);
  });

  row.appendChild(divAppName);
  row.appendChild(divShortId);
  row.appendChild(divCmd);
  row.appendChild(divState);
  row.appendChild(divButtonLog);
  row.appendChild(divButtonEnv);
  row.appendChild(divButtonKill);
  row.appendChild(divButtonRemove);
};

const build = (containers = []) => {
  storageContainers = containers;
  const taskManager = document.getElementById('container-tab');
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
  for (const [index, container] of containers.entries()) {
    const row = document.createElement('div');
    row.className = 'row';
    row.style = 'height:40px;';
    buildLine(row, container);
    fragment.appendChild(row);
    if (index !== containers.length - 1) {
      fragment.appendChild(document.createElement('hr'));
    }
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
  .fail((_, error, result) => {
    if (notificationSystem) {
      if (result.status === 200) {
        notificationSystem.displayNotification('List containers', result.error, (result.status === 401) ? 'deny' : 'error');
      } else {
        notificationSystem.displayNotification('List containers', error, 'error');
      }
    }
  });

export const init = (home, taskManager) => {
  system.hide(home);
  system.show(taskManager);
  initTaskManager()
    .always(() => system.show(taskManager));
};
