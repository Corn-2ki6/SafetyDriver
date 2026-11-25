import type { BrowserFaceLandmarker } from './browserFaceLandmarker';

type MediaPipeVisionApi = {
  FilesetResolver: {
    forVisionTasks: (basePath: string) => Promise<unknown>;
  };
  FaceLandmarker: {
    createFromOptions: (
      fileset: unknown,
      options: {
        baseOptions: { modelAssetPath: string; delegate: 'GPU' };
        runningMode: 'VIDEO';
        numFaces: number;
        outputFaceBlendshapes: boolean;
      },
    ) => Promise<BrowserFaceLandmarker>;
  };
};

declare global {
  interface Window {
    Vision?: MediaPipeVisionApi;
  }
}

const MEDIAPIPE_BASE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3';
let apiPromise: Promise<MediaPipeVisionApi> | null = null;

function loadMediaPipeVision(): Promise<MediaPipeVisionApi> {
  if (window.Vision) return Promise.resolve(window.Vision);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${MEDIAPIPE_BASE_URL}/vision_bundle.js`;
    script.async = true;
    script.onload = () => {
      if (window.Vision) {
        resolve(window.Vision);
      } else {
        apiPromise = null;
        reject(new Error('MediaPipe Vision bundle loaded without its API.'));
      }
    };
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('Could not load the MediaPipe Vision bundle.'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export async function createBrowserFaceLandmarker(): Promise<BrowserFaceLandmarker> {
  const vision = await loadMediaPipeVision();
  const fileset = await vision.FilesetResolver.forVisionTasks(`${MEDIAPIPE_BASE_URL}/wasm`);
  return vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: new URL('/face_landmarker.task', window.location.origin).toString(),
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
  });
}
