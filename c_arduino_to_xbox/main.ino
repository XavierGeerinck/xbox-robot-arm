#include <Servo.h>

Servo Vertical; // Servo doing vertical movement
Servo Horizontal; // Servo doing horizontal movement

typedef struct {
  float UP_DOWN;    // UP   | DOWN  value [-1, 1]
  float LEFT_RIGHT; // LEFT | RIGHT value [-1, 1]
} InputThumbstick;

InputThumbstick inThumbsticks;

// Startup
void setup() {
  Serial.begin(38400);

  Serial.println("This program expects 2 pieces:");
  Serial.println("[ U|D, L|R ] in range [ 1, 0 ]");
  Serial.println("These are 4 bytes each (float)");
  Serial.println("Example: [ -1.0, 0.0 ]");
  Serial.println();

  Horizontal.attach(9); // Attach to Pin 9
  Vertical.attach(10); // Attach to pin 10
}

// Main Loop
void loop() {
  char buffer[sizeof(InputThumbstick)];

  if (Serial.available() >= sizeof(InputThumbstick)) {
    Serial.readBytes(buffer, sizeof(InputThumbstick));
    memcpy(&inThumbsticks, &buffer, sizeof(InputThumbstick));
    Vertical.writeMicroseconds(inputToServoValue(inThumbsticks.UP_DOWN, 1200, 1800));
    Horizontal.writeMicroseconds(inputToServoValue(inThumbsticks.LEFT_RIGHT, 1200, 1800));
  }
}

/**
 * Convert to input value to the Servo Microseconds value
 * - Servo Microseconds value is [ 1200, 1800 ]
 * - Input value is [ -1, 1 ]
 * 
 * We thus want to normalize the Microseconds value and extract X
 * - Normalization [0,  1]: Xnorm = (X - Xmin) / (Xmax - Xmin)
 * - Normalization [-1, 1]: Xscaled = 2 * Xnorm - 1
 * - Normalization [-1, 1]: Xscaled = (2 * ((X - Xmin) / (Xmax - Xmin))) - 1
 * - Extracting X : X = (((Xscaled + 1) / 2) * (Xmax - Xmin)) + Xmin
 * - Example 1: X = (((-1 + 1) / 2) * (1800 - 1200)) + 1200 = 1200
 * - Example 2: X = (((1 + 1) / 2) * (1800 - 1200)) + 1200 = 1800
 */
int inputToServoValue(float in, int Xmin, int Xmax) {
  in = in * -1; // Reverse sign
  return (int)((((in + 1) / 2) * (Xmax - Xmin)) + Xmin);
}