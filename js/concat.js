// Concat two ArrayBuffers
export function concat(buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

  return tmp.buffer;
}



// Concat two ArrayBuffers
// add swap all Uint8 from buffer2 to littleendian 
export function concat_swap(buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

  tmp.set(new Uint8Array(buffer1), 0);
  var length = buffer2.byteLength;
  if (length%2 == 1)
      length = length -1;
  var buffer3 = new ArrayBuffer(length);
  var d3 = new DataView(buffer3);
  var d2 = new DataView(buffer2);
  var uintLength = length;
  for( var i=0; i< uintLength; i+=2 ) {
      var a = d2.getUint8(i);
      var b = d2.getUint8(i+1);
      d3.setUint8( i, b );
      d3.setUint8( i+1, a );
  } 
  tmp.set( new Uint8Array(buffer3), buffer1.byteLength);
  return tmp.buffer;
}

