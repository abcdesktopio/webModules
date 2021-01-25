/**
 *
 * @param {Uint8Array} buffer1
 * @param {Uint8Array} buffer2
 * @returns {Uint8Array}
 * @desc Concat two ArrayBuffers
 */
export function concat(buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}

/**
 *
 * @param {Uint8Array} buffer1
 * @param {Uint8Array} buffer2
 * @returns {Uint8Array}
 * @desc Concat two ArrayBuffers, add swap all Uint8 from buffer2 to littleendian
 */
export function concatSwap(buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

  tmp.set(new Uint8Array(buffer1), 0);
  let length = buffer2.byteLength;
  if (length % 2 === 1) {
    length -= 1;
  }
  const buffer3 = new ArrayBuffer(length);
  const d3 = new DataView(buffer3);
  const d2 = new DataView(buffer2);
  const uintLength = length;

  for (let i = 0; i < uintLength; i += 2) {
    const a = d2.getUint8(i);
    const b = d2.getUint8(i + 1);
    d3.setUint8(i, b);
    d3.setUint8(i + 1, a);
  }

  tmp.set(new Uint8Array(buffer3), buffer1.byteLength);
  return tmp.buffer;
}
