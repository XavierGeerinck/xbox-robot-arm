const SerialPort = require('serialport');
class Arduino {
  constructor(port_com = 'COM6') {
    this.isInitialized = false;
    this.port_com = port_com;
    this.port = new SerialPort(port_com, {
      baudRate: 38400,
      parity: 'none',
      stopBits: 1,
      flowControl: false
    });
  }

  awaitOpen() {
    return new Promise((resolve) => {
      console.log("[Arduino] Port Opened, awaiting reset");
    
      // Arduino does automatic reset when it gets a serial connection
      // Therefor we wait a bit before sending
      setTimeout(async () => {
        this.isInitialized = true;
        console.log("[Arduino] Reset Done");
        return resolve();
      }, 3000);
    })
  }

  onData(cb) {
    this.port.on('data', (data) => cb(ab2str(data)));
  }

  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  convertTypedArray(src, type) {
    let buffer = new ArrayBuffer(src.byteLength);
    let baseView = new src.constructor(buffer).set(src);
    return new type(buffer);
  }

  async writeAndDrain(data) {
    return new Promise((resolve, reject) => {
      this.port.write(data);
      this.port.drain(resolve);
    })
  };
}

module.exports = Arduino;