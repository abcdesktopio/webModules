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

async function bootstrap() {
  const { filename, searchValue, replaceValue } = workerData;
  const svgContent = await fs.promises.readFile(filename, 'utf8');
  if (svgContent.includes(replaceValue)) {
    const newContent = svgContent.replace(new RegExp(searchValue, 'g'), replaceValue);
    await fs.promises.writeFile(filename, newContent);
  }
}

bootstrap()
  .catch(console.error);
