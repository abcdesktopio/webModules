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

import { JanusAbcDesktop } from './JanusAbcDesktop.js';
import * as launcher from '../../launcher.js';

export const configuration = {
  id: null,
  host: null,
  hostip: null,
  pin: null,
  received: false, 
  token: null
};

export const state = {
  connected: false,
  connecting: false,
};

/**
 * @desc Create a stream element wich will be bind with remote's stream afteward.
 * Initialise Janus
 */
export const connectToGateway = async () => {
  const audio = document.getElementById('audioplayer');
  state.connecting = true;

  /**
   * @desc
   * The session will be create when the client select the audio button
   */
  await JanusAbcDesktop.init();

  const {host, id, pin, token} = configuration;

  const janusSession = await JanusAbcDesktop.createSession(`https://${host}/janus`,token);
  await janusSession.attachElt(audio);
  await janusSession.watchStream(id, pin);
  
  state.connected = true;
  state.connecting = false;
  window.od.currentUser.speakerMode = 'WEBRTC';
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
  state.connected = false;
};

export const janusSupported = () => {
  return JanusAbcDesktop.isWebrtcSupported();
};

export const enabled = async () => {
  try {
    const { id } = await launcher.getkeyinfo('webrtc');
    return !!id;
  } catch(e) {
    console.error(e);
    return false;
  }
};
