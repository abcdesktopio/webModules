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

import { concat, concatSwap } from './concat.js';

/*
The standard format codes for waveform data are given below.
The references above give more format codes for compressed data,
a good fraction of which are now obsolete.

Format Code PreProcessor Symbol Data
0x0001 WAVE_FORMAT_PCM PCM
0x0003 WAVE_FORMAT_IEEE_FLOAT IEEE float
0x0006 WAVE_FORMAT_ALAW 8-bit ITU-T G.711 A-law
0x0007 WAVE_FORMAT_MULAW 8-bit ITU-T G.711 Âµ-law
0xFFFE WAVE_FORMAT_EXTENSIBLE Determined by SubFormat
*/

export const WAVE_FORMAT_PCM = 1;
export const WAVE_FORMAT_ALAW = 6;
export const WAVE_FORMAT_ULAW = 7;

/** ******
source http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
source Julien Bouquillon https://github.com/revolunet/webaudio-wav-stream-player
****** */

//
// Write a proper WAVE header for the given buffer.
// format ULAW or ALAW
// Offset is hardcoded
function wavifyLaw(data, numberOfChannels, sampleRate, bitsPerSample, format) {
  // // total header : 4 + 26 + 12 + 8 = 50
  // // and the data and size: 50 + 8 ( data + 32 bits for the size )
  const headerLength = 58; // 4 + 26 + 12 + 8 + 8 = 58
  const totalLength = headerLength + data.byteLength;

  // bitsPerSample MUST BE  8 bits

  // The default byte ordering assumed for WAVE data files is little-endian.
  const header = new ArrayBuffer(headerLength); // + 4 for the
  const d = new DataView(header);

  d.setUint8(0, 'R'.charCodeAt(0));
  d.setUint8(1, 'I'.charCodeAt(0));
  d.setUint8(2, 'F'.charCodeAt(0));
  d.setUint8(3, 'F'.charCodeAt(0));

  // All integers MUST be set in bigEndian format
  // Wave chunks containing format information and sampled data
  // cksize 4 Chunk size: 4+n
  // 4: for sizeof( 'WAVE' ) + n
  // n: Wave chunks containing format information and sampled data
  // var data_length = d.setUint32(4, data.byteLength / 2 + 44, true);
  // bitsPerSample data.byteLength + 8+16+12
  d.setUint32(4, totalLength, true);

  // write 4 bytes
  d.setUint8(8, 'W'.charCodeAt(0));
  d.setUint8(9, 'A'.charCodeAt(0));
  d.setUint8(10, 'V'.charCodeAt(0));
  d.setUint8(11, 'E'.charCodeAt(0));

  // write 4 bytes
  d.setUint8(12, 'f'.charCodeAt(0));
  d.setUint8(13, 'm'.charCodeAt(0));
  d.setUint8(14, 't'.charCodeAt(0));
  d.setUint8(15, ' '.charCodeAt(0));

  // All integers MUST be set in bigEndian format
  // For char

  // Subchunk1Size 16 for PCM.
  // Offset 16
  // Size 4
  // This is the size of the rest of the Subchunk which follows this number.
  // The size of the rest of this subchunk.
  // All integers MUST be set in bigEndian format
  // d.setUint32(16, 16, true);
  // cksize 4 Chunk size: 16, 18 or 40
  const chunksize = 18;
  d.setUint32(16, chunksize, true);

  // The format of the wave data, which will be 1 for uncompressed PCM data.
  // All integers MUST be set in bigEndian format
  // FORMAT must be WAVE_FORMAT_ULAW or WAVE_FORMAT_ALAW
  d.setUint16(20, format, true);

  // Indicates if the data is mono, stereo, or something else.
  // NumChannels Mono = 1, Stereo = 2, etc.
  // All integers MUST be set in bigEndian format
  d.setUint16(22, numberOfChannels, true);

  // The sample rate per second.
  // SampleRate 8000, 44100, etc.
  // All integers MUST be set in bigEndian format
  d.setUint32(24, sampleRate, true);

  // byteRate == SampleRate * NumChannels * BitsPerSample/8
  // All integers MUST be set in bigEndian format
  const byteRate = (sampleRate * numberOfChannels * bitsPerSample) / 8;
  d.setUint32(28, byteRate, true);

  // blockAlign       == NumChannels * BitsPerSample/8
  // The number of bytes for one sample including all channels.
  const blockAlign = (numberOfChannels * bitsPerSample) / 8;
  // All integers MUST be set in bigEndian format
  d.setUint16(32, blockAlign, true);

  // BitsPerSample    8 bits = 8, 16 bits = 16, etc.
  d.setUint16(34, bitsPerSample, true);

  // Wave files may include an additional field, usually reserved for non-PCM formats:
  // bits per Sample
  // Size of the extension
  // 2 bytes
  // Offset
  const cbSize = 0;
  d.setUint16(36, cbSize, true);

  d.setUint8(38, 'f'.charCodeAt(0));
  d.setUint8(39, 'a'.charCodeAt(0));
  d.setUint8(40, 'c'.charCodeAt(0));
  d.setUint8(41, 't'.charCodeAt(0));
  const cksize = 4;
  d.setUint32(42, cksize, true);
  const dwSampleLength = data.byteLength; // Number of samples ( per channel )
  d.setUint32(46, dwSampleLength, true);

  // 50
  d.setUint8(50, 'd'.charCodeAt(0));
  d.setUint8(51, 'a'.charCodeAt(0));
  d.setUint8(52, 't'.charCodeAt(0));
  d.setUint8(53, 'a'.charCodeAt(0));

  d.setUint32(54, data.byteLength, true);

  // 58
  // data must pad byte 0 or 1 if n is odd
  return concat(header, data);
}

// Write a proper WAVE header for the given buffer.
// format PCM
// Swap bytes if 16 bytes
// Offset is hardcoded
function wavifyPcm(data, numberOfChannels, sampleRate, bitsPerSample) {
  const headerLength = 44;
  const totalLength = headerLength + data.byteLength;

  // The default byte ordering assumed for WAVE data files is little-endian.
  const header = new ArrayBuffer(headerLength);
  const d = new DataView(header);

  d.setUint8(0, 'R'.charCodeAt(0));
  d.setUint8(1, 'I'.charCodeAt(0));
  d.setUint8(2, 'F'.charCodeAt(0));
  d.setUint8(3, 'F'.charCodeAt(0));

  // All integers MUST be set in bigEndian format
  // Wave chunks containing format information and sampled data
  // cksize 4 Chunk size: 4+n
  // 4: for sizeof( 'WAVE' ) + n
  // n: Wave chunks containing format information and sampled data
  d.setUint32(4, totalLength, true);

  // write 4 bytes
  d.setUint8(8, 'W'.charCodeAt(0));
  d.setUint8(9, 'A'.charCodeAt(0));
  d.setUint8(10, 'V'.charCodeAt(0));
  d.setUint8(11, 'E'.charCodeAt(0));

  // write 4 bytes
  d.setUint8(12, 'f'.charCodeAt(0));
  d.setUint8(13, 'm'.charCodeAt(0));
  d.setUint8(14, 't'.charCodeAt(0));
  d.setUint8(15, ' '.charCodeAt(0));

  // All integers MUST be set in bigEndian format
  // For char

  // Subchunk1Size 16 for PCM.
  // Offset 16
  // Size 4
  // This is the size of the rest of the Subchunk which follows this number.
  // The size of the rest of this subchunk.
  // All integers MUST be set in bigEndian format
  // d.setUint32(16, 16, true);
  // cksize 4 Chunk size: 16, 18 or 40
  const chunksize = 16;
  d.setUint32(16, chunksize, true);

  // The format of the wave data, which will be 1 for uncompressed PCM data.
  // AudioFormat PCM = 1 (i.e. Linear quantization)
  // All integers MUST be set in bigEndian format
  d.setUint16(20, WAVE_FORMAT_PCM, true);

  // Indicates if the data is mono, stereo, or something else.
  // NumChannels Mono = 1, Stereo = 2, etc.
  // All integers MUST be set in bigEndian format
  d.setUint16(22, numberOfChannels, true);

  // The sample rate per second.
  // SampleRate 8000, 44100, etc.
  // All integers MUST be set in bigEndian format
  d.setUint32(24, sampleRate, true);

  // byteRate == SampleRate * NumChannels * BitsPerSample/8
  // All integers MUST be set in bigEndian format
  const byteRate = (sampleRate * numberOfChannels * bitsPerSample) / 8;
  d.setUint32(28, byteRate, true);

  // blockAlign       == NumChannels * BitsPerSample/8
  // The number of bytes for one sample including all channels.
  const blockAlign = (numberOfChannels * bitsPerSample) / 8;
  // All integers MUST be set in bigEndian format
  d.setUint16(32, blockAlign, true);

  // BitsPerSample    8 bits = 8, 16 bits = 16, etc.
  d.setUint16(34, bitsPerSample, true);

  // 36
  d.setUint8(36, 'd'.charCodeAt(0));
  d.setUint8(37, 'a'.charCodeAt(0));
  d.setUint8(38, 't'.charCodeAt(0));
  d.setUint8(39, 'a'.charCodeAt(0));

  d.setUint32(40, data.byteLength, true);

  // data must pad byte 0 or 1 if n is odd
  if (bitsPerSample === 16) { return concatSwap(header, data); }
  return concat(header, data);
}

// Write a proper WAVE header for the given buffer.
export function wavify(data, numberOfChannels, sampleRate, bitsPerSample, format) {
  if (format === WAVE_FORMAT_PCM) {
    return wavifyPcm(data, numberOfChannels, sampleRate, bitsPerSample);
  }

  if (format === WAVE_FORMAT_ULAW || format === WAVE_FORMAT_ALAW) {
    return wavifyLaw(data, numberOfChannels, sampleRate, bitsPerSample, format);
  }

  return new Uint8Array();
}
