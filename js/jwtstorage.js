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


document.addEventListener('DOMContentLoaded', () => {
  if (jwt_user_token) {
  	localStorage.setItem('abcdesktop_jwt_user_token', jwt_user_token);
  }
  document.location = default_host_url; 
});
