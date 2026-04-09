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
import { broadcastEvent } from './broadcastevent.js'
import * as launcher from './launcher.js';
import * as notificationSystem from './notificationsystem.js';

var tasks_notification = {};
var task_removed = {};
	
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
	let controlBarAnchor = document.getElementById('abcdesktop_control_bar_anchor');
	let controlBar = document.getElementById('abcdesktop_control_bar');
	let taskwaiting = document.getElementById('taskwaiting');
	let applicationstatus = document.getElementById('applicationstatus');
	let hourglassi_start = document.getElementById('hourglassi_start');
	if (!taskwaiting || !applicationstatus || !hourglassi_start) return;
	if (taskwaiting.childElementCount > 0) {
		controlBar.classList.add('abcdesktop_open');
		if (controlBarAnchor.classList.contains('abcdesktop_top')) {
			applicationstatus.style.display = 'block';
		}
		else {
			applicationstatus.style.display = 'flex';
			applicationstatus.style.flexDirection = 'column';
		}
		hourglassi_start.title = '';
		const collection = taskwaiting.children;
		for ( let i=0; i < collection.length; ++i)
			hourglassi_start.title += collection[i].title + '\n';
	}
	else {
		applicationstatus.style.display = 'none';
		hourglassi_start.title = '';
		controlBar.classList.remove('abcdesktop_open');
	}

}

const add_task = function( task ) {
	let taskwaiting = document.getElementById('taskwaiting');
        if (taskwaiting) {
		let id = get_element_task_id( task );
		// only add if the task is not in removed dict
		// events aren't sequential
		// if the task has been removed previously 
		// do not add it any more 
		if (!task_removed[id]) {
			var html_task =  document.getElementById( id );
			if (!html_task) {
				let html_task = create_element_from_task( task );
        			taskwaiting.appendChild( html_task );
			}
		}
	}
}

const remove_task = function( task ) {
	let id = get_element_task_id( task );
	task_removed[id] = true;
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
	// console.log( tasks[i] );
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
	// console.log( container );
	let reason = container.reason;
	switch( reason ) {
		case 'Created':
		case 'Scheduled':
		case 'PodInitializing':
		case 'Pulling':
			add_task( container );
                        break;
		case 'Started':
		case 'Running':
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
   launcher.getkeyinfo('imagenotificationconfig').done((msg) => {
    if (msg && msg.id ) {
      if (  msg.id.ephemeral_container == true ||  msg.id.pod_application == true)
	    broadcastEvent.addEventListener( 'container', ({ detail: { container } }) => containerNotificationInfo(container));
    }
  });
  // always add taskbar event image status
  broadcastEvent.addEventListener( 'container', ({ detail: { container } }) => update_on_container_notification(container));
  update_applicationstatus();
}


export const do_container_notificationSystem = function( title, desc, type, img, url, duration ) {
  let d=15;
  notificationSystem.displayNotification(title, desc, type, img, url, duration);
}

export const containerNotificationInfo = function (data) {
  // console.log( data );
  let timeout = 3000; // in milli seconds
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
	      // add only one
	      let timeout_id = tasks_notification[data['id']]['timeout'];
	      if (!tasks_notification[data['id']]['timeout']) {
              	timeout_id = setTimeout( do_container_notificationSystem, timeout, data.reason, data.message, 'info', icon, 15 );
              	tasks_notification[data['id']]['timeout'] = timeout_id;
	      	tasks_notification[data['id']][reason]=true;
	      }
              break;
	}
        case 'Completed':
	      // stop bugging me 
              // skip this event
              break;
	case 'Running': 
	case 'Started': {
	      // stop bugging me 
              // skip this event
	      let timeout_id = tasks_notification[data['id']]['timeout'];
              if (timeout_id) {
		clearTimeout(timeout_id);
                delete tasks_notification[data['id']]['timeout'];
              }
	      tasks_notification[data['id']]['cancel'] = true; 
              break;
	}
	case 'Pulled': {
	      let timeout_id = tasks_notification[data['id']]['timeout'];
              if (timeout_id) {
		clearTimeout(timeout_id);
		delete tasks_notification[data['id']]['timeout']; 
	      }
	      else 
		notificationSystem.displayNotification(data.reason, data.message, 'info', icon, 15);
	      tasks_notification[data['id']][reason]=true;
	      break;
	}

	default:
              notificationSystem.displayNotification(data.reason, data.message, 'info', icon, 15);
  }
};
