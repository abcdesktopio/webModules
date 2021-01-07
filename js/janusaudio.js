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

/**
 * @typedef getStream
 * @property {Number} id
 * @property {String} name
 * @property {String} description
 * @property {String} pin
 * @property {Boolean} enabled
 * @property {Boolean} audio
 * @property {Number} audiopt
 * @property {String} audiortpmap
 * @property {String} live
 * @property {Number} audioport
 * @property {Number} audiortcpport
 * @property {Number} audio_age_ms
 * @property {String} host
 */

// import * as launcher from './launcher.js';

const server = '';
const opaqueId = `streamingtest-${Janus.randomString(12)}`;

let currentJanusSession = null;

/**
 * @type {getStream}
 * @desc Store the getStream object provided by pyos /API/webrtc/getStream
 * It initialised on broadway.connected
 */
let getStream = null;

Janus.prototype.abcdesktopAttached = false;
Janus.prototype.abcdesktopStreaming = null;

/**
 * @param {HTMLElement} eltStream
 * @desc Custome function which allow to attach the opened session with a plugin
 * Resolve when the remote provide a stream and it has been attached to the provided html element.
 * The promise is rejected on attachement error
 */
Janus.prototype.abcdesktopAttach = function (eltStream = null) {
  const janusSession = this;

  if (!janusSession.abcdesktopAttached) {
    janusSession.abcdesktopAttached = true;
    return new Promise((resolve, reject) => {
      const optionsAttach = {
        plugin: 'janus.plugin.streaming',
        opaqueId,
        success: successAttach,
        error: errorAttach,
        onmessage: onmessageAttach,
        onremotestream: onremotestreamAttach,
        oncleanup() {

        }, // Don't used but I keep it there to know it is possible to add an action at this moment
      };

      janusSession.attach(optionsAttach);

      /**
             *
             * @param {*} streaming
             * @desc
             */
      function successAttach(streaming) {
        const body = { request: 'watch', id: 4 };
        console.log(streaming);
        janusSession.abcdesktopStreaming = streaming;
        streaming.send({ message: body });
      }

      /**
             *
             * @param {*} error
             * @desc
             */
      function errorAttach(error) {
        janusSession.abcdesktopAttached = false;
        Janus.error('  -- Error attaching plugin... ', error);
        reject();
      }

      /**
             *
             * @param {*} msg
             * @param {*} jsep
             * @desc
             */
      function onmessageAttach(msg, jsep) {
        Janus.debug(' ::: Got a message :::');
        Janus.debug(msg);
        if (jsep !== undefined && jsep !== null) {
          Janus.debug('Handling SDP as well...');
          Janus.debug(jsep);
          const answer = {
            jsep,
            media: { audioSend: false, videoSend: false },
            // We want recvonly audio/video
            success(jsep) {
              Janus.debug('Got SDP!');
              Janus.debug(jsep);
              const body = { request: 'start' };
              janusSession.abcdesktopStreaming.send({ message: body, jsep });
            },
            error(error) {
              Janus.error('WebRTC error:', error);
            },
          };

          janusSession.abcdesktopStreaming.createAnswer(answer);
        }
      }

      /**
             *
             * @param {*} stream
             * @desc
             */
      function onremotestreamAttach(stream) {
        try {
          Janus.attachMediaStream(eltStream, stream);
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  return Promise.resolve();
};

/**
 * @desc Create a stream element wich will be bind with remote's stream afteward.
 * Initialise Janus
 */
const init = async () => {
  const video = document.createElement('video');
  video.id = 'janusStream';
  video.style.display = 'none';

  document.body.appendChild(video);

  /**
   * @desc
   * The session will be create when the client select the audio button
   */
  const initOptions = { debug: 'all' };

  Janus.init(initOptions);
  try {
    const { result } = await launcher.getStream();
    getStream = result;
    const { host, audioport } = getStream;
    await launcher.configurePulse(host, audioport);
  } catch (e) {
    console.error(e);
  }
};

/**
 * @desc Allow to get a new Janus session
 */
const createSession = () => new Promise((resolve, reject) => {
  const optionsJanus = {
    server, // `http://${host}:8088/janus`
    success: successSession,
    error: errorSession,
  };

  const janusSession = new Janus(optionsJanus); // This is a Janus session

  /**
   * @desc Resolve the promise with the janussSession when it has been open
   */
  function successSession() {
    // Attach to streaming plugin
    resolve(janusSession);
  }

  /**
   *
   * @desc Call on error from the session
   */
  function errorSession(error) {
    Janus.error(error);
    reject(error);
  }
});

/**
 * @desc return a promise wich resolve a januse session connected
 */
export const openSession = () => {
  if (!currentJanusSession) {
    return createSession();
  }

  return Promise.resolve(currentJanusSession);
};

/**
 * @desc Destroy the current janusSession
 */
export const destroySession = () => {
  if (currentJanusSession) {
    currentJanusSession.destroy();
    currentJanusSession = null;
  }
};

export const janusSupported = () => Janus.isWebrtcSupported();

/*
document.addEventListener("broadway.connected", () => {
    init();
}); */
