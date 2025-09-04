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
import { broadcastEvent } from './broadcastevent.js';
import * as notificationSystem from './notificationsystem.js';

var tasks_notification = {};

const get_element_task_id = function ( task ) {
 // return 'waiting_task_id_' + task['id'];
 return task['id'];
}


const create_desciption_from_task = function ( task ) {
	let description = task['id'] + ' ' + task['reason'] + ' ' + task['image'];
	return description;
};

const create_element_from_task = function( task ) {
	var html_task = document.createElement("img");
	html_task.classList.add('heartbeat');
	let icondata = task['icondata'] || task['oc.icondata'];
        html_task.src = 'data:image/svg+xml;base64,' + icondata;
	html_task.id = get_element_task_id( task ) ;
	let description = create_desciption_from_task(task);
	html_task.alt = description;
	html_task.title = description;
	return html_task;
}


const update_display_task = function() {
	let taskwaiting = document.getElementById('taskwaiting');
	let applicationstatus = document.getElementById('applicationstatus');
	let hourglassi_start = document.getElementById('hourglassi_start');
	if (!taskwaiting || !applicationstatus || !hourglassi_start) return;
	if (taskwaiting.childElementCount > 0) {
		applicationstatus.style.display = 'block';
		hourglassi_start.title = '';
		const collection = taskwaiting.children;
		for ( let i=0; i < collection.length; ++i)
			hourglassi_start.title += collection[i].title + '\n';
	}
	else {
		applicationstatus.style.display = 'none';
		hourglassi_start.title = '';
	}

}

const add_task = function( task ) {
	let taskwaiting = document.getElementById('taskwaiting');
        if (taskwaiting) {
		let id = get_element_task_id( task );
		var html_task =  document.getElementById( id );
		if (!html_task) {
			let html_task = create_element_from_task( task );
        		taskwaiting.appendChild( html_task );
		}

	}
}

const remove_task = function( task ) {
	let id = get_element_task_id( task );
        var html_task =  document.getElementById( id );
        if (html_task) {
		html_task.parentNode.removeChild( html_task );
	}
}


const show_task = function( tasks )  {
 let taskwaiting = document.getElementById('taskwaiting');
 if (!taskwaiting) return;
 //taskwaiting.replaceChildren();
 for (var i = 0; i < tasks.length; i++) {
	console.log( tasks[i] );
	let html_task = create_element_from_task( tasks[i] );
	taskwaiting.appendChild( html_task );
 }
}


export const update_applicationstatus = function () {
  let phase = 'Waiting';
  // let phase = 'Running';
  launcher.list_applications_by_phase( phase )
    .done((result) => {
        if ( result ) { 
	    show_task( result );
	    update_display_task();
	}
    })
    .fail(({ status, error }) => {
      console.error( error );
    });
};

export const update_on_container_notification = function( container ) {
	console.log( container );
	let reason = container.reason;
	switch( reason ) {
		case 'Created':
		case 'Scheduled':
		case 'PodInitializing':
		case 'Pulling':
			add_task( container );
                        break;
		case 'Started':
		case 'Pulled':
		case 'Completed':
			remove_task( container );
                        break;
		default:
			remove_task( container );
	}
	update_display_task();
}

export const init = function () {
  document.addEventListener( 'container', ({ detail: { container } }) => update_on_container_notification(container));
  broadcastEvent.addEventListener( 'container', ({ detail: { container } }) => update_on_container_notification(container));
  broadcastEvent.addEventListener( 'container', ({ detail: { container } }) => containerNotificationInfo(container));
  update_applicationstatus();
}

export const containerNotificationInfo = function (data) {
  let timeout = 2000;
  let reason = data.reason;
  let icondata = data['icondata'] || data['oc.icondata'];
  const icon = `data:image/svg+xml;base64,${icondata}`;
  if (!data['id']) return;	
  if (!tasks_notification[data['id']]) {
    tasks_notification[data['id']] = {};
  }
  if (tasks_notification[data['id']][reason] == true )
	return;
  switch( reason ) {
	case 'Created': 
        case 'Scheduled': {
	      // stop bugging me 
              // skip this event
	      tasks_notification[data['id']][reason]=true;
              break;
	}
        case 'PodInitializing':
        case 'Pulling': {
	      // postpone message in timeout
	      // cancel if an event occurs in less than timeout
              let timeout_id = setTimeout( notificationSystem.displayNotification, timeout, data.reason, data.message, 'info', icon, 15 );
              tasks_notification[data['id']]['timeout'] = timeout_id;
	      tasks_notification[data['id']][reason]=true;
              break;
	}
        case 'Completed':
	      // stop bugging me 
              // skip this event
              break;
	case 'Started': {
	      // stop bugging me 
              // skip this event
	      let timeout_id = tasks_notification[data['id']]['timeout'];
              if (timeout_id) {
                delete tasks_notification[data['id']]['timeout'];
                clearTimeout(timeout_id);
              }
              break;
	}
	case 'Pulled': {
	      let timeout_id = tasks_notification[data['id']]['timeout'];
              if (timeout_id) {
		delete tasks_notification[data['id']]['timeout']; 
                clearTimeout(timeout_id);
	      }
	      else 
		notificationSystem.displayNotification(data.reason, data.message, 'info', icon, 15);
	      tasks_notification[data['id']][reason]=true;
	      break;
	}
	default:
              notificationSystem.displayNotification(data.reason, data.message, 'error', icon, 15);
  }
};
