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

import * as launcher from '../../launcher.js';
import { JanusAbcDesktop } from './JanusAbcDesktop.js';
import * as notificationSystem from '../../notificationsystem.js';

/**
 * @desc Create a stream element wich will be bind with remote's stream afteward.
 * Initialise Janus
 */
export const init = async () => {
  const audio = document.getElementById('audioplayer');

  /**
   * @desc
   * The session will be create when the client select the audio button
   */
  await JanusAbcDesktop.init();

  try {
    const {
      result: {
        id,
        host,
        hostip,
        audioport,
        pin,
      },
    } = await launcher.getStream();

    await launcher.configurePulse(hostip, audioport);
    const janusSession = await JanusAbcDesktop.createSession(`https://${host}/janus`);
    await janusSession.attachElt(audio);
    await janusSession.watchStream(id, pin);
    if (audio.paused) {
      // In this case the user did not make any interaction.
      // Thus we print a notification for asking the user to activate the song.
      const title = 'Sound disabled';
      const desc = 'Please click on icon to hear the sound';
      const type = 'info';
      const img = '';
      const url = '';
      const duration = 5000;
      notificationSystem.displayNotification(title, desc, type, img, url, duration);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @desc return a promise wich resolve a januse session connected
 */
export const openSession = () => {
  if (!JanusAbcDesktop.currentJanusSession) {
    return JanusAbcDesktop.createSession();
  }

  return Promise.resolve(JanusAbcDesktop.currentJanusSession);
};

/**
 * @desc Destroy the current janusSession
 */
export const destroySession = () => {
  JanusAbcDesktop.destroyCurrentSession();
};

export const janusSupported = () => JanusAbcDesktop.isWebrtcSupported();
