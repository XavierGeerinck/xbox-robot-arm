const Arduino = require('./Arduino');
const GameController = require('./GameController');
const Xbox = require('./GameController/controllers/xbox_inverse');
const fetch = require('node-fetch');

class RobotArm {
    constructor(arduinoPort = 'COM6', environmentHost = 'http://localhost:3001') {
        this.environmentHost = environmentHost;
        this.arduinoPort = arduinoPort;
        this.arduino = new Arduino(arduinoPort);
        this.gameController = new GameController(10);   
        this.isAvailableForSending = false;
    }

    async start() {
        await fetch(`${this.environmentHost}/init`)
    }

    async awaitThumbstickValues() {
        return new Promise((resolve) => {
            this.gameController.on('thumbsticks', async (val) => {
                let valParsed = JSON.parse(val);

                const UP_DOWN = valParsed[Xbox.THUMBSTICK_RIGHT_UP_DOWN];
                const LEFT_RIGHT = valParsed[Xbox.THUMBSTICK_RIGHT_LEFT_RIGHT];

                // Removing listener
                console.log("Removing listener")
                this.gameController.removeAllListeners('thumbsticks'); // Clean up listener!

                return resolve({ UP_DOWN, LEFT_RIGHT });
            })
        })
    }

    // // If value didn't change, don't send it
    // if (UP_DOWN == valParsed[Xbox.THUMBSTICK_RIGHT_UP_DOWN] && LEFT_RIGHT == valParsed[Xbox.THUMBSTICK_RIGHT_LEFT_RIGHT]) {
    //     return;
    // }

    // // If value didn't change a lot, don't send it
    // const CHANGE_THRESHOLD = 0.05;
    // // console.log(Math.abs(UP_DOWN - valParsed[Xbox.THUMBSTICK_RIGHT_UP_DOWN]) + Math.abs(LEFT_RIGHT - valParsed[Xbox.THUMBSTICK_RIGHT_LEFT_RIGHT]));
    // if (Math.abs(UP_DOWN - valParsed[Xbox.THUMBSTICK_RIGHT_UP_DOWN]) + Math.abs(LEFT_RIGHT - valParsed[Xbox.THUMBSTICK_RIGHT_LEFT_RIGHT]) < CHANGE_THRESHOLD) {
    //     console.log('Threshold')
    //     return;
    // }

    async relayMessage(UP_DOWN, LEFT_RIGHT) {
        let url = `${this.environmentHost}/action/${(new Date()).getTime()}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([ UP_DOWN, LEFT_RIGHT ])
        });

        const json = await res.json();

        console.log(`[RobotArm][${url}] Relayed message (${JSON.stringify([ UP_DOWN, LEFT_RIGHT ])}) to environment, received { success: ${json.success}, isDone: ${json.isDone} }`)

        // let data = this.arduino.convertTypedArray(new Float32Array([UP_DOWN, LEFT_RIGHT]), Uint8Array);
        // await this.arduino.writeAndDrain(data); // [ L|R, U|D ] range [ -1, 1 ]
    }

    async init() {
        console.log('[RobotArm] Initializing Arduino');
        await this.arduino.awaitOpen(); // We need to wait for arduino to be open
    
        console.log('[RobotArm] Initializing GameController');
        await this.gameController.init();
    }

    async sendAction(action = []) {
        const data = this.arduino.convertTypedArray(new Float32Array(action), Uint8Array);
        await this.arduino.writeAndDrain(data);
    }
}

module.exports = RobotArm;