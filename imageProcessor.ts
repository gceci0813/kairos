export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  processImage(imageElement: HTMLImageElement): ProcessedImageData {
    // Set canvas size to match image
    this.canvas.width = imageElement.width;
    this.canvas.height = imageElement.height;
    
    // Draw image to canvas
    this.ctx.drawImage(imageElement, 0, 0);
    
    // Get image data
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Process the image data
    return this.analyzeImageData(imageData);
  }
  
  private analyzeImageData(imageData: ImageData): ProcessedImageData {
    const data = imageData.data;
    let totalBrightness = 0;
    let totalContrast = 0;
    const pixelCount = imageData.width * imageData.height;
    
    // Calculate brightness and contrast
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Brightness calculation
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      
      // Simple contrast calculation
      const contrast = Math.max(r, g, b) - Math.min(r, g, b);
      totalContrast += contrast;
    }
    
    return {
      width: imageData.width,
      height: imageData.height,
      averageBrightness: totalBrightness / pixelCount,
      averageContrast: totalContrast / pixelCount,
      dominantColors: this.findDominantColors(data)
    };
  }
  
  private findDominantColors(data: Uint8ClampedArray): string[] {
    // Simple color quantization to find dominant colors
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < data.length; i += 4) {
      // Quantize colors to reduce variations
      const r = Math.round(data[i] / 32) * 32;
      const g = Math.round(data[i + 1] / 32) * 32;
      const b = Math.round(data[i + 2] / 32) * 32;
      
      const colorKey = `${r},${g},${b}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Sort by frequency and return top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => `rgb(${color})`);
    
    return sortedColors;
  }
}

interface ProcessedImageData {
  width: number;
  height: number;
  averageBrightness: number;
  averageContrast: number;
  dominantColors: string[];
}
