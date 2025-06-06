/**
 * Interface for cube detection service
 */
export interface ICubeDetectionService {
  detectCubeState(imageBase64: string): Promise<string>;
}