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

#include <napi.h>
#include "./native.hpp"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("replaceInFileAsync", Napi::Function::New(env, replaceInFileAsync));
  return exports;
}

NODE_API_MODULE(transpilenative, Init)