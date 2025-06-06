// Cube face colors
export type CubeColor = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';

// Cube notation moves
export type CubeMove = 'U' | 'D' | 'L' | 'R' | 'F' | 'B' | 
                       'U\'' | 'D\'' | 'L\'' | 'R\'' | 'F\'' | 'B\'' |
                       'U2' | 'D2' | 'L2' | 'R2' | 'F2' | 'B2';

// Cube state represented as a string (54 characters for a 3x3 cube)
export type CubeState = string;

// Cube face position
export type CubeFace = 'up' | 'down' | 'left' | 'right' | 'front' | 'back';