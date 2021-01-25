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
import * as speaker from '../speaker/main.js';

import { settingsEvents } from '../settingsevents.js';

let firstAppear = true;

let playTestIsrunning = false;

export function init(home, audio) {
  system.hide(home);

  if (!firstAppear) {
    system.show(audio);
    return;
  }
  firstAppear = false;

  const slideraudioBufferTimeout = new Slider('#slideraudioBufferTimeout', {
    tooltip: 'always',
    value: speaker.getscheduleBuffersTimeout(),
  });

  slideraudioBufferTimeout.on('slide', (sliderValue) => {
    speaker.setscheduleBuffersTimeout(sliderValue);
  });

  const slideraudioHttpReadBuffer = new Slider('#slideraudioHttpReadBuffer', {
    tooltip: 'always',
    value: speaker.getlowwatermark(),
  });

  slideraudioHttpReadBuffer.on('slide', (sliderValue) => {
    speaker.setlowwatermark(sliderValue);
  });

  const sound_level_desc = document.getElementById('sound_level_desc');
  const sound_level_test = document.getElementById('sound_level_test');
  const sounds_level = document.getElementById('sounds_level');

  $('div[id^=sound_level]')
    .each(function () {
      this.addEventListener('click', function () {
        if (playTestIsrunning) { return; }
        const { children } = this.parentElement;
        let i = children.length - 1;

        while (children[i] !== this) { $(children[i--]).removeClass('sound_level_active'); }

        while (!$(children[i]).hasClass('sound_level_active')) { $(children[i--]).addClass('sound_level_active'); }

        speaker.setBandWidth(this.dataset.level);
        sound_level_desc.innerText = speaker.getTextFormat();
      });
    });

  if (sound_level_desc) {
    sound_level_desc.innerText = speaker.getTextFormat();
  }

  if (sound_level_test) {
    sound_level_test.addEventListener('click', function () {
      if (playTestIsrunning) {
        return false;
      }

      playTestIsrunning = true;
      const children = Array.from(sounds_level.children)
        .map((child) => $(child));

      let countActive = 0;
      system.addAppLoader(this.parentElement);
      const appLoader = this.parentElement.querySelector('img.appLoader');
      appLoader.style.position = 'relative';
      appLoader.style.top = '5px';
      appLoader.style.right = '40px';
      appLoader.style.width = '40px';
      this.style.cursor = '';
      for (const child of children) {
        if (child.hasClass('sound_level_active')) {
          child.removeClass('sound_level_active');
          child.css('background', '#000');
          countActive++;
        }
        child.css({ border: 'solid 1px black', cursor: 'initial' });
      }

      speaker.playTest(() => {
        playTestIsrunning = false;
        for (const [index, child] of children.entries()) {
          if (index < countActive) {
            child.css('background', '');
            child.addClass('sound_level_active');
          }
          child.css({ border: 'solid 1px #FF7900', cursor: 'pointer' });
        }
        this.style.cursor = 'pointer';
        system.removeAppLoader(this.parentElement);
      });
    });
  }
  system.show(audio);
}

settingsEvents.addEventListener('close', () => {
  firstAppear = true;
});
