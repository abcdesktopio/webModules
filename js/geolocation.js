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
 * @name geolocation 
 * @module
 */

import * as launcher from './launcher.js';

const userGeolocation = (function () {
  let currentgeolocation;

  return new (class exported {
    constructor() {
    }

    init() {
	const self = this;
	// ask the server if geolcation is enabled
	launcher.getkeyinfo('geolocation').done((msg) => {
    		if (msg.id) {  
			self._init(msg.id);
		}
	});
    };

    _init( options ) {
	currentgeolocation = {};
        
	// set default options 
	// options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };

        function geolocation_success(pos) {
                var crd = pos.coords;
                currentgeolocation = crd;
                console.log('Your current position is:');
                console.log(`Latitude : ${crd.latitude}`);
                console.log(`Longitude: ${crd.longitude}`);
                console.log(`More or less ${crd.accuracy} meters.`);
        }

        function geolocation_error(err) {
                console.warn(`ERROR(${err.code}): ${err.message}`);
        }

        navigator.geolocation.getCurrentPosition(geolocation_success, geolocation_error, options);
    }
    
    getCurrentGeolocation() {
	if (currentgeolocation) 
		return { 'accuracy': currentgeolocation.accuracy, 'latitude': currentgeolocation.latitude, 'longitude': currentgeolocation.longitude };
	else
	    	return {};
    }

 })();
}());
export default userGeolocation;
