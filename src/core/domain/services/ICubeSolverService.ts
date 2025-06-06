import { CubeMove } from '../models/CubeTypes';

/**
 * Interface for cube solver service
 */
export interface ICubeSolverService {
  solve(cubeState: string): Promise<CubeMove[]>;
}