const express = require('express');
const bodyParser = require('body-parser');
const EXPRESS_PORT = 3000;

const RobotArm = require('./lib/RobotArm');

let app = null;
let robotArm = null;

async function start() {
    console.log('[Server] Initializing RobotArm');
    robotArm = new RobotArm('COM3', "http://172.26.96.1:3001");
    await robotArm.init();

    console.log('[Server] HTTP Server Starting')
    await startServer();

    console.log(`[Server] Everything done, listening on http://localhost:${EXPRESS_PORT}`);
    await robotArm.start();
    console.log(`[Server] Triggered Action Server`)
}

async function startServer() { 
    const app = express();

    // Middleware
    app.use(bodyParser.json())

    // Action Route, accepts [ ... ] for the actions
    app.post('/action/:time_step', async (req, res) => {
        if (!robotArm) {
            return res.send("ROBOT_ARM_NOT_INITIALIZED");
        }

        // We received message, send success back since python is blocking
        res.send("DONE"); 

        const action = req.body;

        // Send our action to the Robot Arm
        await robotArm.sendAction(action);

        // Tell the robot arm that we can process a message
        const { UP_DOWN, LEFT_RIGHT } = await robotArm.awaitThumbstickValues();

        // Then now relay the message
        await robotArm.relayMessage(UP_DOWN, LEFT_RIGHT);
    })

    return new Promise((resolve) => app.listen(EXPRESS_PORT, resolve));
}

start().catch((e) => console.log(e));
