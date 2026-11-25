export type BrowserFaceLandmarker = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => {
    faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  };
  close: () => void;
};

export async function createBrowserFaceLandmarker(): Promise<BrowserFaceLandmarker> {
  throw new Error('Browser face detection is only available on web.');
}
