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

import * as system from './system.js';

/**
 * @name Video
 * @module
 */

export let _this;
export let top;
export let _style;
export let isfullscreen = false;
export let container;
export let isopen = false;
export let reduce = false;

/**
 * @function init
 * @returns {void}
 * @desc Init basic event close.
 *
 */
export const init = function () {
  _this = document.getElementById('webshell');
  top = document.getElementById('shell');
  if (_this) {
    _style = _this.style;
    container = document.getElementById('terminal-container');
    _this.querySelector('.control').addEventListener('dblclick', fullscreen);
    _this.querySelector('.grab').addEventListener('mousedown', resizing);
    _this.querySelector('.close').addEventListener('click', close);
    _this.querySelector('.reduce').addEventListener('click', minimize);
  }
  if (top) {
    top.addEventListener('click', maximize);
  }
};

/**
 * @function open
 * @returns {void}
 * @desc Open window.
 *
 */
export const open = function () {
  system.show(_this);
  system.activeWindow(_this);
  if (!isopen) {
    window.createTerminal(() => {
      isopen = false;
      close();
    });
    isopen = true;
  }
  resize();
};

/**
 * @function close
 * @returns {void}
 * @desc Close window.
 *
 */
export const close = function () {
  system.hide(_this);
  isopen = false;
  window.closeTerminal();
};

export const minimize = function () {
  system.hide(_this);
  reduce = true;
  system.show(top);
};

export const maximize = function () {
  system.show(_this);
  reduce = false;
  system.activeWindow(_this);
  window.term.focus();
  system.hide(top);
};

export const fullscreen = function () {
  if (isfullscreen) {
    _this.style = _style;
    _this.style.display = 'block';
    isfullscreen = false;
  } else {
    _this.style.width = '100%';
    _this.style.height = 'calc(100% - 85px)';
    _this.style.top = '0px';
    _this.style.left = '0px';
    isfullscreen = true;
  }
  resize();
};

export const resize = function () {
  if (!window.term || !isopen) {
    return;
  }

  let width;
  let height;
  let cols = (_this.offsetWidth - 10) / window.term._core.renderer.dimensions.actualCellWidth;
  let rows = (_this.offsetHeight - 35) / window.term._core.renderer.dimensions.actualCellHeight;

  cols = parseInt(cols, 10);
  rows = parseInt(rows, 10);

  if (window.innerWidth <= 700) {
    _this.style.left = '0px';
    width = '100%';
    cols = window.innerWidth / window.term._core.renderer.dimensions.actualCellWidth;
  } else {
    width = `${cols * window.term._core.renderer.dimensions.actualCellWidth}px`;
  }

  height = `${rows * window.term._core.renderer.dimensions.actualCellHeight + 35}px`;
  _this.style.width = width;
  _this.style.height = height;

  window.term.resize(cols, rows);
  window.term.focus();
};

export const resizing = function () {
  _this.style.overflow = 'hidden';
  _this.style.opacity = '0.70';
  _this.style.cursor = 'se-resize';

  function move(ev) {
    let x;
    let y;
    x = ev.pageX - _this.offsetLeft;
    y = ev.pageY - _this.offsetTop;
    if (_this.offsetLeft + x > document.body.clientWidth) {
      x = document.body.clientWidth - _this.offsetLeft;
    }
    _this.style.width = `${x}px`;
    _this.style.height = `${y}px`;
  }

  function up() {
    _this.style.overflow = '';
    _this.style.opacity = '';
    _this.style.cursor = '';
    resize();

    document.getElementById('noVNC_canvas').removeEventListener('mousemove', move);
    document.getElementById('noVNC_canvas').removeEventListener('mouseup', up);
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  }
  document.getElementById('noVNC_canvas').addEventListener('mousemove', move);
  document.getElementById('noVNC_canvas').addEventListener('mouseup', up);
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
};

window.addEventListener('resize', resize);
