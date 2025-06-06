import { CubeColor, CubeFace, CubeMove } from './CubeTypes';

/**
 * Interface for Cube operations
 */
export interface ICube {
  getState(): string;
  setState(state: string): void;
  applyMove(move: CubeMove): void;
  isSolved(): boolean;
  getColorForPosition(x: number, y: number, z: number, face: CubeFace): CubeColor | undefined;
  reset(): void;
  clone(): ICube;
}

/**
 * Base abstract class for different cube implementations
 */
export abstract class BaseCube implements ICube {
  protected state: string;
  
  constructor(initialState?: string) {
    this.state = initialState || this.getDefaultState();
  }
  
  abstract getDefaultState(): string;
  abstract applyMove(move: CubeMove): void;
  abstract getColorForPosition(x: number, y: number, z: number, face: CubeFace): CubeColor | undefined;
  abstract clone(): ICube;
  
  getState(): string {
    return this.state;
  }
  
  setState(state: string): void {
    if (this.isValidState(state)) {
      this.state = state;
    } else {
      throw new Error('Invalid cube state provided');
    }
  }
  
  isSolved(): boolean {
    const defaultState = this.getDefaultState();
    return this.state === defaultState;
  }
  
  reset(): void {
    this.state = this.getDefaultState();
  }
  
  protected isValidState(state: string): boolean {
    // Basic validation - more complex validation would be implemented in subclasses
    if (state.length !== 54) {
      return false;
    }
    
    // Check if state contains only valid face colors
    const validChars = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (let i = 0; i < state.length; i++) {
      if (!validChars.includes(state[i])) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Standard 3x3x3 Rubik's Cube implementation
 */
export class RubiksCube3x3 extends BaseCube {
  getDefaultState(): string {
    return (
      'UUUUUUUUU' + // Up face (white)
      'RRRRRRRRR' + // Right face (red)
      'FFFFFFFFF' + // Front face (green)
      'DDDDDDDDD' + // Down face (yellow)
      'LLLLLLLLL' + // Left face (orange)
      'BBBBBBBBB'   // Back face (blue)
    );
  }
  
  applyMove(move: CubeMove): void {
    // Implementation of cube movement logic
    // This would be a complex implementation with appropriate matrix transformations
    
    // For demonstration purposes:
    console.log(`Applying move: ${move} to cube state`);
    
    // In a real implementation, this would modify this.state based on the move
  }
  
  getColorForPosition(x: number, y: number, z: number, face: CubeFace): CubeColor | undefined {
    // Map notation to colors
    const notationToColor: Record<string, CubeColor> = {
      'U': 'white',
      'R': 'red',
      'F': 'green',
      'D': 'yellow',
      'L': 'orange',
      'B': 'blue'
    };
    
    // Calculate index in the state string based on position and face
    let index: number | null = null;
    
    if (face === 'up' && y === 1) {
      index = 4 + (z + 1) * 3 + (x + 1);
    } else if (face === 'down' && y === -1) {
      index = 36 + (z + 1) * 3 + (x + 1);
    } else if (face === 'left' && x === -1) {
      index = 45 + (z + 1) * 3 + (y + 1);
    } else if (face === 'right' && x === 1) {
      index = 9 + (z + 1) * 3 + (y + 1);
    } else if (face === 'front' && z === 1) {
      index = 18 + (y + 1) * 3 + (x + 1);
    } else if (face === 'back' && z === -1) {
      index = 54 + (y + 1) * 3 + (x + 1);
    }
    
    if (index !== null && index >= 0 && index < this.state.length) {
      const notation = this.state[index];
      return notationToColor[notation];
    }
    
    return undefined;
  }
  
  clone(): ICube {
    return new RubiksCube3x3(this.state);
  }
}