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

import * as launcher from './launcher.js';

class JanusAbcDesktop extends Janus {
  static init() {
    return new Promise((resolve) => {
      super.init({
        debug: 'all',
        dependencies: super.useDefaultDependencies(),
        callback: () => {
          resolve();
        },
      });
    });
  }

  static destroyCurrentSession() {
    if (JanusAbcDesktop.currentJanusSession) {
      JanusAbcDesktop.currentJanusSession.destroy();
      JanusAbcDesktop.currentJanusSession = null;
    }
  }

  /**
  * @desc Allow to get a new Janus session
  */
  static createSession(server, pin) {
    return new Promise((resolve, reject) => {
      const optionsJanus = {
        server,
        pin,
        success: successSession,
        error: errorSession,
      };

      const janusSession = new JanusAbcDesktop(optionsJanus); // This is a Janus session

      /**
       * @desc Resolve the promise with the janussSession when it has been open
       */
      function successSession() {
        resolve(janusSession);
      }

      /**
       *
       * @desc Call on error from the session
       */
      function errorSession(error) {
        JanusAbcDesktop.error(error);
        reject(error);
      }
    });
  }

  constructor(optionsJanus) {
    super(optionsJanus);
    this.attached = false;
    this.streaming = null;
  }

  /**
   * @param {HTMLElement} eltStream
   * @desc Custome function which allow to attach the opened session with a plugin
   * Resolve when the remote provide a stream and it has been attached to the provided html element.
   * The promise is rejected on attachement error
   */
  attachElt(eltStream = null) {
    if (!this.attached) {
      this.attached = true;
      return new Promise((resolve, reject) => {
        const optionsAttach = {
          plugin: 'janus.plugin.streaming',
          opaqueId: JanusAbcDesktop.opaqueId,
          success: (streaming) => {
            console.log(streaming);
            this.streaming = streaming;
            resolve();
          },
          error: (error) => {
            this.attached = false;
            JanusAbcDesktop.error('  -- Error attaching plugin... ', error);
            reject();
          },
          onmessage: (msg, jsep) => {
            JanusAbcDesktop.debug(' ::: Got a message :::');
            JanusAbcDesktop.debug(msg);
            if (jsep !== undefined && jsep !== null) {
              JanusAbcDesktop.debug('Handling SDP as well...');
              JanusAbcDesktop.debug(jsep);
              const answer = {
                jsep,
                media: { audioSend: false, videoSend: false },
                // We want recvonly audio/video
                success: (jsep) => {
                  JanusAbcDesktop.debug('Got SDP!');
                  JanusAbcDesktop.debug(jsep);
                  const body = { request: 'start' };
                  this.streaming.send({ message: body, jsep });
                },
                error: (error) => {
                  JanusAbcDesktop.error('WebRTC error:', error);
                },
              };

              this.streaming.createAnswer(answer);
            }
          },
          onremotestream: (stream) => {
            JanusAbcDesktop.attachMediaStream(eltStream, stream);
          },
          ondata: (data) => {
            JanusAbcDesktop.debug('We got data from the DataChannel!', data);
          },
          oncleanup() {},
          // Don't used but I keep it there to know it is possible to add an action at this moment
        };

        this.attach(optionsAttach);
      });
    }

    return Promise.resolve();
  }

  /**
   * @desc Allow  to start the stream
   */
  async startStream(id) {
    const body = { request: 'watch', id };
    this.streaming.send({ message: body });
  }

  /**
   * @desc Allow to stop the stream
   */
  stopStream() {
    const body = { request: 'stop' };
    this.streaming.send({ message: body });
  }

  getStreamList() {
    return new Promise((resolve, reject) => {
      if (this.streaming !== null) {
        const body = { request: 'list' };
        this.streaming.send({
          message: body,
          success: (result) => {
            if (result.list instanceof Array) {
              resolve(result.list);
            } else {
              reject(result);
            }
          },
          error: (e) => {
            reject(e);
          },
        });
      } else {
        reject();
      }
    });
  }
}
JanusAbcDesktop.currentJanusSession = null;
JanusAbcDesktop.opaqueId = `streamingtest-${JanusAbcDesktop.randomString(12)}`;

window.JanusAbcDesktop = JanusAbcDesktop;

/**
 * @desc Create a stream element wich will be bind with remote's stream afteward.
 * Initialise Janus
 */
const init = async () => {
  const audio = document.createElement('audio');
  audio.id = 'janusStream';
  audio.autoplay = true;
  audio.style = 'width: 100%; height: 100%;';

  document.body.appendChild(audio);

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
    const janusSession = await JanusAbcDesktop.createSession(`https://${host}/janus`, pin);
    await janusSession.attachElt(audio, pin);
    await janusSession.startStream(id);
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

document.addEventListener('broadway.connected', () => {
  init();
});
