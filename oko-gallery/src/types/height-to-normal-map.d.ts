declare module 'height-to-normal-map' {

  export const NORMA_MAP_TYPES: {
    SOBEL: 'sobel';
    SCHARR: 'scharr';
  };

  export type NormalMapType = (typeof NORMA_MAP_TYPES)[keyof typeof NORMA_MAP_TYPES];

  export interface HeightToNormalOptions {
    invertedRed?: boolean;
    invertedGreen?: boolean;
    invertedSource?: boolean;
    blursharp?: number; // between -32 and 32
    strength?: number; // between 0.01 and 5
    level?: number; // between 4 and 10
    type?: NormalMapType;
  }

  export default class HeightToNormal {
    canvas: HTMLCanvasElement;

    constructor(options?: HeightToNormalOptions);

    /**
     * Applies the normal map shader to the image and renders to the internal canvas.
     * The result will be available as a CanvasTexture from this.canvas.
     */
    apply(image: HTMLImageElement | HTMLCanvasElement, options?: HeightToNormalOptions): Promise<HTMLCanvasElement>;
  }
}
