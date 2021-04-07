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

const tabsHeaders = [
  {
    name: 'system',
    words: ['system', 'user', 'container', 'display', 'storage', 'support'],
  },
  {
    name: 'user',
    words: ['user', 'current session', 'connection history', 'session', 'history'],
  },
  {
    name: 'localisation',
    words: ['Location', 'place', 'position'],
  },
  {
    name: 'printers',
    words: ['Printer', 'settings', 'printer'],
  },
  {
    name: 'audio',
    words: ['Audio', 'sound', 'level'],
  },
  {
    name: 'logs',
    words: ['Logs', 'debug'],
  },
  {
    name: 'speedtest',
    words: ['Speed', 'Test', 'connextion'],
  },
  {
    name: 'screen-background',
    words: ['Screen', 'color', 'background'],
  },
  {
    name: 'container',
    words: ['Containers', 'tasks', 'applications', 'debug', 'remove', 'env', 'kill'],
  },
  {
    name: 'opensource',
    words: ['opensource'],
  },
];

export const init = (config) => {
  const imgSearch = $('.searchSection img');
  const inputSearch = $('#input-search-section');
  const filterTabsBySearch = () => {
    for (const { name, words } of tabsHeaders) {
      const tab = $(`div[tab=${name}-tab]`);

      if ((tab.attr('tab') === 'printers'
          && !config.enabledTabsHeaders.includes('printers'))
          || (tab.attr('tab') === 'audio'
              && !config.enabledTabsHeaders.includes('audio')
          )
      ) {
        continue;
      }

      const pattern = new RegExp(inputSearch.val().trimLeft().trimRight(), 'i');
      if (!words.some((w) => pattern.test(w))) {
        if (!tab.hasClass('d-none')) {
          tab.addClass('d-none');
        }
      } else if (tab.hasClass('d-none')) {
        tab.removeClass('d-none');
      }
    }
  };

  imgSearch.click(filterTabsBySearch);
  inputSearch.keyup(filterTabsBySearch);
};
