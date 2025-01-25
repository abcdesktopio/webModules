class RecorderWorkletProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      // Envoi de la première piste audio (mono) au port principal
      this.port.postMessage(input[0]);
    }
    return true;
  }
}

registerProcessor("recorder-worklet", RecorderWorkletProcessor);
