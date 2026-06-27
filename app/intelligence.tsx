'use client';

import { useState, useRef, useEffect } from 'react';
import { ImageProcessor } from './src/imageProcessor';
import { LocationTracker } from './src/locationTracker'
import { VehicleIdentifier } from './src/vehicleIdentifier';

export default function IntelligencePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageResults, setImageResults] = useState<any>(null);
  const [locationData, setLocationData] = useState<any>(null);
  const [correlations, setCorrelations] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Initialize processors
  const imageProcessor = new ImageProcessor();
  const locationTracker = new LocationTracker();
  const vehicleIdentifier = new VehicleIdentifier();
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const analyzeImage = () => {
    if (imageRef.current) {
      // Process image with all analyzers
      const imageData = imageProcessor.processImage(imageRef.current);
      const vehicleData = vehicleIdentifier.processImage(imageRef.current);
      
      setImageResults({
        imageData,
        vehicleData,
        timestamp: Date.now()
      });
    }
  };
  
  const addLocationData = () => {
    // Add some sample location data
    const deviceId = 'device-001';
    const latitude = 40.7128 + (Math.random() - 0.5) * 0.1;
    const longitude = -74.0060 + (Math.random() - 0.5) * 0.1;
    
    locationTracker.addLocationPoint(deviceId, latitude, longitude, Date.now());
    
    const patterns = locationTracker.analyzeMovementPatterns(deviceId);
    setLocationData({
      deviceId,
      patterns,
      timestamp: Date.now()
    });
  };
  
  const correlateData = () => {
    if (imageResults && locationData) {
      // Find correlations between image data and location data
      const correlations = [];
      
      // Check if vehicle was detected in areas frequently visited by the device
      if (imageResults.vehicleData.length > 0 && locationData.patterns) {
        for (const vehicle of imageResults.vehicleData) {
          for (const location of locationData.patterns.frequentLocations) {
            correlations.push({
              type: 'vehicle-location',
              confidence: 0.7 + Math.random() * 0.2,
              details: {
                vehicle: vehicle.text,
                location: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
              }
            });
          }
        }
      }
      
      setCorrelations(correlations);
    }
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Intelligence Analysis Platform</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Upload and Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Image Analysis</h2>
          
          <div className="mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Upload Image
            </button>
          </div>
          
          {selectedImage && (
            <div className="mb-4">
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Selected"
                className="w-full max-h-64 object-contain mb-4"
              />
              <button
                onClick={analyzeImage}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Analyze Image
              </button>
            </div>
          )}
          
          {imageResults && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Analysis Results:</h3>
              <p>Image Dimensions: {imageResults.imageData.width} x {imageResults.imageData.height}</p>
              <p>Average Brightness: {imageResults.imageData.averageBrightness.toFixed(2)}</p>
              <p>Average Contrast: {imageResults.imageData.averageContrast.toFixed(2)}</p>
              <p>Dominant Colors: {imageResults.imageData.dominantColors.join(', ')}</p>
              
              {imageResults.vehicleData.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Detected Vehicles:</p>
                  {imageResults.vehicleData.map((vehicle: any, index: number) => (
                    <p key={index}>
                      ID: {vehicle.text} (Confidence: {(vehicle.confidence * 100).toFixed(1)}%)
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Location Tracking */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Location Tracking</h2>
          
          <button
            onClick={addLocationData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          >
            Add Sample Location Data
          </button>
          
          {locationData && (
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Movement Patterns:</h3>
              <p>Device ID: {locationData.deviceId}</p>
              <p>Total Distance: {locationData.patterns.totalDistance.toFixed(2)} km</p>
              <p>Average Speed: {locationData.patterns.averageSpeed.toFixed(2)} km/h</p>
              <p>Active Hours: {locationData.patterns.activeHours.join(', ')}</p>
              
              <div className="mt-2">
                <p className="font-semibold">Frequent Locations:</p>
                {locationData.patterns.frequentLocations.map((location: any, index: number) => (
                  <p key={index}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} 
                    (Visited {location.visitCount} times)
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Correlation Analysis */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Correlation Analysis</h2>
        
        <button
          onClick={correlateData}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mb-4"
          disabled={!imageResults || !locationData}
        >
          Find Correlations
        </button>
        
        {correlations && (
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Found Correlations:</h3>
            {correlations.map((correlation: any, index: number) => (
              <div key={index} className="mb-2 p-2 bg-white rounded">
                <p>Type: {correlation.type}</p>
                <p>Confidence: {(correlation.confidence * 100).toFixed(1)}%</p>
                <p>Details: {correlation.details.vehicle} at {correlation.details.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}