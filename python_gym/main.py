import time 

# Dependencies - RLLib
import gym
import ray
from ray.rllib.agents import ppo

# Dependencies - HTTP Server
import requests
from flask import Flask, request, jsonify

# Config
ARDUINO_SERVER = "http://192.168.1.5:3000"
SERVER_PORT = 3001
CHECKPOINT_DIR = "/mnt/e/Projects/roadwork-rl/output-server/lunar-lander-continuous-checkpoint"
CHECKPOINT_FILE = "checkpoint_99/checkpoint-99"

done = False
state = None
cumulative_reward = 0

env = gym.make("LunarLanderContinuous-v2")

# RLLIB
ray.init()
agent = ppo.PPOTrainer(env="LunarLanderContinuous-v2")
agent.restore(f"{CHECKPOINT_DIR}/{CHECKPOINT_FILE}")

# HTTP SERVER
app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

@app.route('/init', methods=['GET'])
def env_init():
    state = env.reset()
    print("Reset environment")

     # Get the first action
    action = agent.compute_action(state)

    # We do not execute this action here, we send it to the controller
    # This will kick off the action taking, waits until the controller receives a change by arduino
    # Whereafter it will send the details to our Python HTTP Server above
    # It's the Python HTTP Server that will step
    new_time_step = str(int(time.time() * 1000))
    requests.post(f"{ARDUINO_SERVER}/action/{str(int(time.time() * 1000))}", json=action.tolist())
    print(f"Took first action: {action} ({new_time_step})")
    return jsonify({ "success": True })

# HTTP Route
@app.route('/action/<time_step>', methods=['POST'])
def env_step(time_step):
    """
    Receive an action from the Xbox Controller
    Parameters:
        - array: the actions to take
    Returns:
        - bool: isDone
    """

    # Get the action from our request body
    # Note: requires header Content-Type: application/json
    action = request.json 

    # Now we can step!
    env.render() # Render the change
    state, reward, done, _ = env.step(action)
    # print(f"State: {state}, Reward: {reward}, Done: {done}")

    if done == True:
        print("We are done")
        env.close()
        return jsonify({ "success": True, "isDone": done })

    # Take new action
    new_time_step = str(int(time.time() * 1000))
    action = agent.compute_action(state)

    # Sending action to arduino
    requests.post(f"{ARDUINO_SERVER}/action/{new_time_step}", json=action.tolist())
    return jsonify({ "success": True, "isDone": done })

if __name__ == '__main__':
    print(f"Server Starting at http://localhost:{SERVER_PORT}")
    app.run(host="0.0.0.0", port=SERVER_PORT)