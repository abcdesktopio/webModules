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

import * as system from '../system.js';
import * as launcher from '../launcher.js';
import * as notificationSystem from '../notificationsystem.js';
import { settingsEvents } from '../settingsevents.js';

let firstAppear = true;

let printersTab;
const selectedPrinter = {
  div: null,
  info: null,
};

let myPrinterList = [];
let printerlist;

/**
 *
 * @param {*} cn
 * @desc
 */
function getPrinterInfo(cn) {
  for (const printer of printerlist) {
    if (printer.cn === cn) {
      return printer;
    }
  }

  for (const printer of myPrinterList) {
    if (printer.cn === cn) {
      return printer;
    }
  }

  return null;
}

/**
 *
 * @param {*} printers
 * @desc Show listenable printers
 */
function showMyPrintersListable() {
  launcher.listenableprinter()
    .done((msg) => {
      if (msg && msg.status === 200) {
        myPrinterList = msg.result;
        const printerlist = document.getElementById('printerlist');
        const clonePrinterlist = system.removeAllChilds(printerlist, false);
        for (const [i, {
          cn, printColor, printerName, location,
        }] of myPrinterList.entries()) {
          const urlImg = window.od.net.urlrewrite('img/settings/genericPrinter.svg');
          const li = document.createElement('li');
          const container = document.createElement('div');
          const subContainerImg = document.createElement('div');
          const subContainerLocation = document.createElement('div');
          const row = document.createElement('div');

          const subContainerName = document.createElement('div');

          const img = document.createElement('img');
          const color = document.createElement('img');
          const spanLocation = document.createElement('span');
          const span = document.createElement('span');

          li.classList.add('printer');
          li.id = cn;
          li.addEventListener('click', function () {
            if (selectedPrinter.div) {
              selectedPrinter.div.classList.remove('selected');
            }
            selectedPrinter.div = this;
            selectedPrinter.info = getPrinterInfo(this.id);
            setPrinterSettings(selectedPrinter.info);
            this.classList.add('selected');
            printersTab.querySelector('#addPrinter').disabled = false;
          });

          container.classList.add('container');

          row.classList.add('row');

          subContainerImg.classList.add('col-3');
          subContainerName.classList.add('col-4', 'justify-content-center');
          subContainerLocation.classList.add('col-5');

          img.src = urlImg;
          img.classList.add('printerLogo');

          if (printColor === 'TRUE') {
            color.src = window.od.net.urlrewrite('img/settings/color.svg');
          } else {
            color.src = window.od.net.urlrewrite('img/settings/nocolor.svg');
          }
          color.style = 'height:25px; pointer-events:none;';

          span.innerText = printerName;
          spanLocation.innerText = formatLocation(location);

          if (i === 0) {
            li.classList.add('selected');
            selectedPrinter.div = li;
            selectedPrinter.info = getPrinterInfo(li.id);
            setPrinterSettings(selectedPrinter.info);
          }

          subContainerImg.appendChild(img);
          subContainerImg.appendChild(color);
          subContainerLocation.appendChild(spanLocation);
          subContainerName.appendChild(span);

          row.appendChild(subContainerImg);
          row.appendChild(subContainerName);
          row.appendChild(subContainerLocation);

          container.appendChild(row);
          li.appendChild(container);
          clonePrinterlist.appendChild(li);
        }

        printerlist.parentNode.replaceChild(clonePrinterlist, printerlist);
      }
    }).catch(() => {
      notificationSystem.displayNotification(selectedPrinter.info.printerName, 'Could not get listnable printers', '', 'img/settings/genericPrinter.svg');
    });
}

function formatLocation(location = '') {
  if (location.length > 20) {
    if (location.includes(' ')) {
      const biggerPart = location.split(' ').reduce((maxReached, current) => (maxReached.length > current.length ? maxReached : current), '');
      return biggerPart;
    }
    return location.substring(0, 24);
  }

  return location;
}

/**
 *
 * @param {*} string
 * @param {*} printersTab
 * @desc Search printers
 */
function searchPrinters(string) {
  const regex = new RegExp(string, 'gi');
  const matchlist = printerlist.filter((p) => regex.test(p.printerName));
  showPrinter(matchlist);
}

/**
 *
 * @param {*} list
 */
function showPrinter(list) {
  let url;
  const addPrinter = printersTab.querySelector('#addPrinter');
  if (addPrinter) {
    addPrinter.disabled = true;
  }

  const printerTable = printersTab.querySelector('#printerTable');
  const clonePrinterTable = system.removeAllChilds(printerTable, false);
  for (const { cn, printColor, printerName } of list) {
    const div = document.createElement('div');
    const color = document.createElement('img');
    const img = document.createElement('img');
    const span = document.createElement('span');

    div.classList.add('printer');
    div.id = cn;
    div.addEventListener('click', function () {
      if (selectedPrinter.div) {
        selectedPrinter.div.classList.remove('selected');
      }
      selectedPrinter.div = this;
      selectedPrinter.info = getPrinterInfo(this.id);
      this.classList.add('selected');
      printersTab.querySelector('#addPrinter').disabled = false;
    });

    if (printColor === 'TRUE') {
      color.src = 'img/settings/color.svg';
    } else {
      color.src = 'img/settings/nocolor.svg';
    }
    color.classList.add('colorPrinter');
    div.appendChild(color);

    url = 'img/settings/genericPrinter.svg';
    url = window.od.net.urlrewrite(url);
    img.src = url;
    img.classList.add('printerLogo');
    div.appendChild(img);

    span.innerText = printerName;
    div.appendChild(span);
    clonePrinterTable.appendChild(div);
  }
  printerTable.parentNode.replaceChild(clonePrinterTable, printerTable);
}

/**
 *
 * @param {*} settings
 */
function setPrinterSettings(settings) {
  console.log(settings);
  const printMediaSupported = document.getElementById('printMediaSupported');
  const clonePrintMediaSupported = system.removeAllChilds(printMediaSupported, false);

  for (let i = settings.printMediaSupported.length - 1; i >= 0; i--) {
    const opt = document.createElement('option');
    opt.innerText = settings.printMediaSupported[i];
    opt.value = settings.printMediaSupported[i];
    clonePrintMediaSupported.appendChild(opt);
  }
  printMediaSupported.parentNode.replaceChild(clonePrintMediaSupported, printMediaSupported);

  const blackwhite = document.getElementById('printNoColor');
  const color = document.getElementById('printColor');
  if (settings.printColor === 'TRUE') {
    color.checked = true;
    color.disabled = false;
    blackwhite.checked = false;
  } else {
    color.checked = false;
    color.disabled = true;
    blackwhite.checked = true;
  }
  const settingsPrinterLocation = document.getElementById('settingsPrinterLocation');
  settingsPrinterLocation.innerText = `Location : ${settings.location}`;
}

/**
 * @desc
 */
function initListeners() {
  const morePrinter = printersTab.querySelector('#morePrinter');
  if (morePrinter) {
    printersTab.querySelector('#morePrinter')
      .addEventListener('click', () => {
        system.hide(document.getElementById('printer-section-list'));
        system.show(document.getElementById('searchPrinters'));
      });
  }

  const inputSearchPrinter = printersTab.querySelector('#inputSearchPrinter');
  if (inputSearchPrinter) {
    inputSearchPrinter.addEventListener('keyup', function () {
      searchPrinters(this.value, printersTab);
    });
  }

  const cancelPrinter = printersTab.querySelector('#cancelPrinter');
  if (cancelPrinter) {
    cancelPrinter.addEventListener('click', () => {
      system.hide(document.getElementById('searchPrinters'));
      system.show(document.getElementById('printer-section-list'));
    });
  }

  const addPrinter = printersTab.querySelector('#addPrinter');
  if (addPrinter) {
    addPrinter.addEventListener('click', () => {
      if (!selectedPrinter.div) {
        return;
      }

      launcher.addprinter(selectedPrinter.div.id)
        .done((msg) => {
          if (msg.status === 200) {
            selectedPrinter.div.classList.remove('selected');
            myPrinterList.push(selectedPrinter.info);
            setPrinterSettings(selectedPrinter.info);
            notificationSystem.displayNotification(selectedPrinter.info.printerName, 'Succesfully added', '', 'img/settings/genericPrinter.svg');
            system.hide(document.getElementById('searchPrinters'));
            system.show(document.getElementById('printer-section-list'));
            showMyPrintersListable();
          } else {
            notificationSystem.displayNotification(selectedPrinter.info.printerName, msg.error, '', 'img/settings/genericPrinter.svg');
          }
          console.log(msg);
        })
        .catch((_, _1, msg) => {
          notificationSystem.displayNotification(selectedPrinter.info.printerName, msg.error, '', 'img/settings/genericPrinter.svg');
        });
    });
  }

  const removePrinter = printersTab.querySelector('#removePrinter');
  if (removePrinter) {
    removePrinter.addEventListener('click', () => {
      if (!selectedPrinter.div) {
        return;
      }

      selectedPrinter.div.classList.remove('selected');
      for (const { printerName } of myPrinterList) {
        if (printerName === selectedPrinter.info.printerName) {
          launcher.removeprinter(printerName)
            .done((msg) => {
              if (msg.status === 200) {
                if (selectedPrinter.info.printerName) {
                  notificationSystem.displayNotification(selectedPrinter.info.printerName, 'Succesfully removed', '', 'img/settings/genericPrinter.svg');
                }
                showMyPrintersListable();
              } else {
                notificationSystem.displayNotification(selectedPrinter.info.printerName, msg.error, '', 'img/settings/genericPrinter.svg');
              }
            })
            .catch(() => {
              notificationSystem.displayNotification(selectedPrinter.info.printerName, 'Could not remove the imprimant', '', 'img/settings/genericPrinter.svg');
            });
        }
      }
    });
  }

  const printerSettings = document.getElementById('printerSettings');
  if (printerSettings) {
    printerSettings.addEventListener('submit', (evt) => {
      evt.preventDefault();
    });
  }
}

/**
 *
 * @param {*} home
 * @param {*} tab
 * @desc
 */
export function init(home, tab) {
  system.hide(home);

  printersTab = tab;

  if (!firstAppear) {
    system.show(printersTab);
    return;
  }
  firstAppear = false;

  const inputSearchPrinter = printersTab.querySelector('div#inputSearchPrinter');

  if (inputSearchPrinter) {
    inputSearchPrinter.value = '';
  }

  launcher.listprinter()
    .done((msg) => {
      if (msg.status === 200) {
        printerlist = msg.result;
        showPrinter(printerlist);
      }
    })
    .catch(() => {
      notificationSystem.displayNotification(selectedPrinter.info.printerName, 'Can not list your printers', '', 'img/settings/genericPrinter.svg');
    });

  initListeners();

  showMyPrintersListable();
  system.hide(document.getElementById('searchPrinters'));
  system.show(printersTab);
}

settingsEvents.addEventListener('back', clearOnLeave);
settingsEvents.addEventListener('close', clearOnLeave);

function clearOnLeave() {
  firstAppear = true;
  printerlist = null;
  printersTab = null;
}
