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

import { workerData } from 'worker_threads';
import fs from 'fs';

/**
 * @returns {Promise<void>}
 * @desc A function allowing to bootstrap async/await inside this worker.
 * This function will extract the filename, the searchValue, and the replaceValue provided by the main thread.
 * Thus it will read the content the file, check if it includes the searchValue
 * and in this case it will replace the both values and apply this modification to the file.
 */
async function bootstrap() {
  const { filename, searchValue, replaceValue } = workerData;
  const svgContent = await fs.promises.readFile(filename, 'utf8');
  if (svgContent.includes(searchValue)) {
    const newContent = svgContent.replace(new RegExp(searchValue, 'g'), replaceValue);
    await fs.promises.writeFile(filename, newContent);
  }
}

bootstrap()
  .catch(console.error);
