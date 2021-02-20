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
import path from 'path';
import util from 'util';
import fse from 'fs-extra';
import babel from '@babel/core';

const ensureDir = util.promisify(fse.ensureDir);
const babelTransformFile = util.promisify(babel.transformFile);

async function bootstrap() {
    const { legacyPath, opts, filename } = workerData;
    const timerLabel = `\t${legacyPath}`;
    console.time(timerLabel);
    await ensureDir(path.dirname(legacyPath));
    const { code } = await babelTransformFile(filename, opts);
    await fs.promises.writeFile(legacyPath, code);
    console.timeEnd(timerLabel);
}

bootstrap()
    .catch(console.error);
