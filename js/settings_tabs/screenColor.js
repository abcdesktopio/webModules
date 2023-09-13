/* eslint-disable import/prefer-default-export */
/* eslint-disable no-shadow */
/* eslint-disable no-loop-func */
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

import * as launcher from '../launcher.js';
import * as notificationSystem from '../notificationsystem.js';
import * as system from '../system.js';
import { broadcastEvent } from '../broadcastevent.js';
import { settingsEvents } from '../settingsevents.js';

let firstAppear = true;
let acceptfileservice= false;
let defaultColor = '#6ec6f0';

const sizeDivColor = { offsetHeight: 0, offsetWidth: 0 };
const MAX_COLOR = 8;
const MAX_WALLPAPERS = 7;

let wallpapers = new Map();

/**
 * @function setBackgroundBorderColor
 * @param {string} color
 * @return {void}
 */
function setBackgroundBorderColor(color) {
  const canvas = document.getElementById('noVNC_canvas');
  if (canvas) {
    canvas.parentElement.style.background = color;
  }
}

/**
 * @function setBackgroundType
 * @param {string} type
 * @return {void}
 * @desc Set the laste type of background set [Image | Color]
 */
function setBackgroundType(type) {
  return launcher.set('backgroundType', type);
}

/**
 * @desc Get the last type of the background
 * Wrappe the error params as an object for the caller
 */
function getBackgroundType() {
  return launcher
    .get('backgroundType')
    .then((res) => res)
    .catch((status, error, result) => {
      throw new Error({ status, error, result });
    });
}

// #region colors

/**
 * @function saveCurrentColor
 * @param {String} color
 * @desc Save the user current color in container desktop files
 */
function saveCurrentColor(color) {
  return launcher.setDesktop('currentColor', color);
}

/**
 * @param {string} color
 * @desc This function allow developpers to change background
 * canvas and its parents, with the same color.
 */
function setBackgroundColor(color) {
  return Promise.all([
    saveCurrentColor(color),
    launcher.setBackgroundCanvasColor(color)
      .then((res) => {
        if (res.code === 200) {
          setBackgroundBorderColor(color);
          setBackgroundType('color');
          return res;
        }
        throw res;
      }),
  ]);
}

/**
 * @function saveColors
 * @desc Save color list in mongo
 */
function saveColors() {
  let colorList = document.getElementById('color-list');
  if (colorList) {
	let colorFront = new Array();
	for( let i=0; i<colorList.children.length; ++i) {
	  let datacolor = colorList.children[i].value;
	  if (datacolor)
		colorFront.push(datacolor);
	}
	return launcher.set('colors', colorFront);
  }
}

/**
 * @function getColors
 * @return {Promise}
 * @desc Allow to get the user's color list
 */
function getColors() {
  return launcher.get('colors');
}

/**
 * @function getDefaultColors
 */
function getDefaultColors() {
  return launcher.getkeyinfo('colors');
}

/**
 * @function buildColorDiv
 * @param {String} color
 * @param {String} default_color
 * @return {HTMLElement} colorDiv
 * @desc Build an defaultColor's block.
 * This block allow user to change his background color.
 */
function buildColorDiv(color,index) {
  //<input class="colors_blocks" type="color" id="color_input" name="head" value="#333333">
  const colorDiv = document.createElement('input');
  colorDiv.type = 'color';
  colorDiv.className = 'colors_blocks';
  colorDiv.value = color;
  colorDiv.id = 'colorinput' + index;
  colorDiv.addEventListener('click', (e) => {
    const inputColorElement = document.getElementById(e.target.id);
    setBackgroundColor(inputColorElement.value);
    e.preventDefault(); //Cancel Events
  });

  /*
  colorDiv.addEventListener('change', (e) => {
    saveColors();
    const inputColorElement = document.getElementById(e.target.id);
    setBackgroundColor(inputColorElement.value);
  });
  */

  return colorDiv;
}

/**
 * @function buildColorsDiv
 * @return {void}
 * @desc Create a div (block) which will be insert into colors section.
 */
function buildColorsDiv(colors) {
  const colorList = document.getElementById('color-list');
  if (!colorList) {
    return;
  }

  colors.forEach((color,index) => {
    if (index >= MAX_COLOR) 
	  return;
    const newBlockColor = buildColorDiv(color,index);
    colorList.appendChild(newBlockColor);
  });
}

/**
 * @function addColorBlock
 * @return {void}
 * @desc Add a color block to the colors div [id=defaultColor].
 * If the number of element is greater than MAX_COLOR
 * The first element is deleted and the new one is added to the end.
 * The new list of color is save in mongodb.
 */
function addColorBlock( newColor ) {
  let colorList = document.getElementById('color-list');
  if (colorList) {
	let lencolorList = colorList.children.length -3 -1;
	let i=0;
        for( ; i<lencolorList; ++i) {
                  colorList.children[i].value = colorList.children[i+1].value;
		  colorList.children[i].id = 'colorinput' + i;
        }
	colorList.children[i].value = colorList.children[i+1].value;
        colorList.children[i].id = 'colorinput' + i;
  }
}

/**
 * @function buildColorsSection;
 * @return {void}
 * @desc Create all the colors section
 */
function buildColorsSection() {
  getColors().done((res) => {
    if ( res && res.status && res.status === 200) {
      if ( Array.isArray(res.result) && res.result.length > 1 ) {
      	let listColor = res.result;
      	buildColorsDiv( listColor );
      	addColorsControls();
      } else {
	resetToDefaultColorsSection();
      }
    } else {
	resetToDefaultColorsSection();
    }	  
  }).catch( (res) => { 
	resetToDefaultColorsSection();
  });
}

function resetToDefaultColorsSection() {
  let colorList = document.getElementById('color-list');
  if (colorList) {
	// clear all
	while( colorList.hasChildNodes() )
	  colorList.childNodes[0].remove();

  	getDefaultColors().then((res) => {
        	let listColor = res.id;
        	buildColorsDiv(listColor);
        	addColorsControls();
		saveColors()
  	});
  }
}


function addColorsControls() {
  
  const inputShowPickerColor = document.createElement('input');
  inputShowPickerColor.type='color';
  inputShowPickerColor.id='inputShowPickerColor';
  // inputShowPickerColor.style.display = 'none';
  inputShowPickerColor.style.width   = '0px';
  inputShowPickerColor.style.heighit = '0px'
  inputShowPickerColor.style.visibility = 'hidden';
  inputShowPickerColor.addEventListener('change', (e) => {
    const inputColorElement = document.getElementById(e.target.id);
    setBackgroundColor(inputColorElement.value);
    addColorBlock( inputColorElement.value );
    saveColors();
  });

  const imgShowPickerColor = document.createElement('input');
  imgShowPickerColor.src = window.od.net.urlrewrite('img/settings/add.svg');
  imgShowPickerColor.id = 'img_show_picker_color';
  imgShowPickerColor.type='image';
  imgShowPickerColor.className = 'colors_blocks';

  imgShowPickerColor.addEventListener('click', () => { 
	  let inputShowPickerColor = document.getElementById( 'inputShowPickerColor' );
	  inputShowPickerColor.click();
  });
  

  const inputImgShowResetColor = document.createElement('input');
  inputImgShowResetColor.id = 'inputImgShowResetColor';
  inputImgShowResetColor.className = 'colors_blocks';  
  inputImgShowResetColor.type='image';
  inputImgShowResetColor.src = window.od.net.urlrewrite('img/settings/reset.svg');
  inputImgShowResetColor.addEventListener('click', () => {
    resetToDefaultColorsSection();
  });
 
  const colorList = document.getElementById('color-list');
  if (colorList) {
    colorList.appendChild(inputShowPickerColor);
    colorList.appendChild(imgShowPickerColor);	  
    colorList.appendChild(inputImgShowResetColor);
  }
}

// #endregion colors

// #region pictures

/**
 * @function deleteImg
 * @return {void}
 * @desc Delete the first image of the list
 */
function deleteImg(numberImgToDelete) {
  return Promise.all(
    Array.from(wallpapers.entries()) // Transform Map in iterator then in 2 dims array
      .slice(0, numberImgToDelete) // Select the first images
      .map(([img]) => img) // Create one dims array by keeping images names
      .map((img) => launcher
        .requestFileAPI('DELETE', `~/.wallpapers/${img}`)
        .then(system.checkError)
        .then((res) => res.json())
        .catch((e) => {
          console.error(e);
        })), // Create all request for each image
  ); // Provide an promise wich will be resolve when all images are removes
}

/**
 * @function setBackgroungImgBorderColor
 * @param {string} color
 * @desc Set the image file name giving in parameter and set his main color as background
 */
function setBackgroungImgBorderColor(image) {
  setBackgroundType('img');
  launcher.setBackgroundImage(image).then(({ data: { color } }) => {
    if (color) {
      saveCurrentColor(color);
      setBackgroundBorderColor(color);
    }
  });
}

/**
 * @function setSizePicturesBlock
 * @return {void}
 * @desc Adjust the size of picturs_block and colors_block
 */
function setSizePicturesBlock() {
  const width = sizeDivColor.clientWidth;
  const height = sizeDivColor.clientHeight;
  const picturesBlocks = Array.from(
    document.getElementsByClassName('pictures_blocks'),
  );
  for (const pb of picturesBlocks) {
    pb.style.width = `${width}px`;
    pb.style.height = `${height}px`;
  }
}

/**
 *
 * @param {*} myFilename
 * @desc Get base64 uri from a given image name
 */
function getBase64Uri(myFilename) {
  return launcher
    .requestFileAPI('GET', `~/.wallpapers/${myFilename}`)
    .then(system.checkError)
    .then((res) => res.blob())
    .then((blob) => new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const { result: uriBase64 } = reader;
          resolve(uriBase64);
        };
      } catch (e) {
        reject(e);
      }
    }));
}

/**
 *
 * @param {string} imgName
 * @param {string} base64Uri
 * @param {Array<string>} listBackgroundImg
 */
function buildImage(imgName = '', base64Uri = '', listBackgroundImg = []) {
  const div = document.createElement('div');
  const img = document.createElement('img');
  const addButton = listBackgroundImg.children[listBackgroundImg.children.length - 1];

  div.className = 'pictures_blocks';

  img.dataset.img_name = imgName;
  img.addEventListener('click', function () {
    setBackgroungImgBorderColor(this.dataset.img_name);
  });
  img.src = base64Uri;

  div.appendChild(img);

  listBackgroundImg.replaceChild(div, addButton);
  listBackgroundImg.appendChild(addButton);
  setSizePicturesBlock();
}

/**
 * @function get_list_wallpapers
 * @return {void}
 * @desc Get the list of file from wallpapers, and set all his images in [list_background_img]
 */
async function buildListWallpapersElement() {
  const listBackgroundImg = document.getElementById('list_background_img');
  if (!listBackgroundImg) {
    return;
  }

  const images = await launcher
    .fileAPIListDirectory('~/.wallpapers')
    .then(system.checkError)
    .then((res) => res.json());

  let hasChanges = false;

  for (const img of images) {
    if (!wallpapers.has(img)) {
      wallpapers.set(img, '');
      hasChanges = true;
    }
  }

  while (listBackgroundImg.children.length !== 1) {
    listBackgroundImg.removeChild(listBackgroundImg.children[0]);
  }

  if (images.length < wallpapers.size) {
    const newCollection = Array.from(wallpapers).filter((keyValue) => {
      const key = keyValue[0]; // image name
      for (const img of images) {
        if (key === img) {
          return true;
        }
      }

      hasChanges = true;
      return false;
    });
    wallpapers = new Map(newCollection);
  }

  const imagesToDL = images.filter((img) => wallpapers.get(img) === '');
  const imagesInCache = images.filter((img) => wallpapers.get(img) !== '');

  if (hasChanges) {
    for (const imageToDL of imagesToDL) {
      getBase64Uri(imageToDL)
        .then((base64Uri) => {
          wallpapers.set(imageToDL, base64Uri);
          buildImage(imageToDL, base64Uri, listBackgroundImg);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  for (const imageInCache of imagesInCache) {
    buildImage(imageInCache, wallpapers.get(imageInCache), listBackgroundImg);
  }
}

function buildDropzoneEvents() {
  // #region dropzone upload background
  const dropBackground = document.getElementById('drop_background');
  if (!dropBackground) {
    return;
  }

  const options = {
    url: '/filer/',
    clickable: true,
    maxFilesize: null,
    maxFiles: 1,
  };

  const myDropzone = new window.Dropzone(dropBackground, options);

  myDropzone.on('addedfile', function (file) {
    if (wallpapers.has(file.name)) {
      return;
    }

    this.options.headers = {
      'ABCAuthorization': `Bearer ${window.od.currentUser.authorization}`,
    };

    file.previewElement
      .querySelector('.dz-error-mark')
      .addEventListener('click', () => {
        myDropzone.cancelUpload(file);
      });
  });

  myDropzone.on('error', (file, response, e) => {
    if (e) {
      notificationSystem.displayNotification(
        'Upload',
        `${e.status} ${e.statusText}`,
        'error',
      );
    } else {
      notificationSystem.displayNotification('Upload', response, 'error');
    }

    myDropzone.removeAllFiles();
  });

  myDropzone.on('sending', (file, xhr, formData) => {
    formData.append('fullPath', '~/.wallpapers');
  });

  myDropzone.on('success', () => {
    function refresh() {
      buildListWallpapersElement().then(() => {
        const collection = Array.from(wallpapers);
        const firstWallpaper = collection[collection.length - 1][0];
        setBackgroungImgBorderColor(firstWallpaper);
      });
    }

    if (wallpapers.size >= MAX_WALLPAPERS) {
      deleteImg(wallpapers.size - MAX_WALLPAPERS + 1).then(refresh);
    } else {
      refresh();
    }
  });
  // #endregion dropzone upload background
}

/**
 * @function buildPicturesSection
 * @return {void}
 * @desc Create the pictures section
 */
function buildPicturesSection() {
  buildListWallpapersElement();
  buildDropzoneEvents();
}
// #endregion pictures



/**
 * @function disablePicturesSection
 * @desc remove PicturesSection
 */
function disablePicturesSection() {
  const buttons_screen_background = document.getElementById( 'buttons-screen-background' );
  const btn_settings_screen_background_pictures_btn = document.getElementById( 'settings-screen-background-pictures-btn' );
  const input_settings_screen_background_pictures_btn_input = document.getElementById( 'settings-screen-background-pictures-btn-input' );
  if (btn_settings_screen_background_pictures_btn) 
    btn_settings_screen_background_pictures_btn.style.display='none';
  if (btn_settings_screen_background_pictures_btn) 
    input_settings_screen_background_pictures_btn_input.style.display='none';
  if (buttons_screen_background)
    buttons_screen_background.className = 'd-flex';
}

/**
 * @function build_screen
 * @desc Call all build function
 */
function buildScreen() {
  if (firstAppear) {
    buildColorsSection();
    launcher.getenv().then( (data) => {
      if (data.env) {
        // check if filer service is enabled
        const filterservice = (data.env.ABCDESKTOP_SERVICE_filer === 'enabled');
        if ( filterservice ) {
          buildPicturesSection();
        } else {
          disablePicturesSection();
        }
      }
      else 
        disablePicturesSection();
    });
  }
}

/**
 * @desc Set current image
 */
async function setCurrentImage() {
  const { code, data: currentImg } = await launcher.getDesktop('currentImg');
  if (code === 200) {
    await launcher.setBackgroundImage(currentImg);
  } else if (code === 404) {
    // nothing to do 
    // console.info('No current image found');
  } else {
    console.error('Unknow error for getCurrentImg');
  }
}

export function init(home, screenBackground) {
  buildScreen();
  system.hide(home);
  system.show(screenBackground);
  firstAppear = false;
  acceptfileservice = false;
}

settingsEvents.addEventListener('close', () => {
  firstAppear = true;
});

broadcastEvent.addEventListener(
  'display.setBackgroundBorderColor',
  ({ detail: { color } }) => setBackgroundBorderColor(color),
);


// describe code usage 
let idTimeout;
const handlerResize = () => {
  clearTimeout(idTimeout);
  idTimeout = setTimeout(async () => {
    try {
      const { result: backgroundType } = await launcher.get('backgroundType');
      if (backgroundType === 'img') {
        await setCurrentImage();
      }
    } catch (e) {
      if (e.status === 404)
	// nothing to do 
     	return;
      if (e.status != 200)
      	console.error(e);
    }
  }, 200);
};

// window.addEventListener('resize', handlerResize);

document.addEventListener('broadway.connected', async () => {
  window.addEventListener('resize', handlerResize);
  try {
    const backgroundType = await getBackgroundType();
    if (backgroundType.status === 200) {
      if (!backgroundType.result) {
        // nothing to do empty data
        return;
      }
      if (backgroundType.result === 'color') {
        const { code, data: currentColor } = await launcher.getDesktop(
          'currentColor',
        );
        const color = code === 200 ? (defaultColor = currentColor) : defaultColor;
        if (color !== '') {
          await setBackgroundColor(color);
        }
      } else {
        await setCurrentImage();
      }
    }
  } catch (e) {
    // console.log(e);
  }
});

document.addEventListener('broadway.disconnected', () => {
  window.removeEventListener('resize', handlerResize);
});
