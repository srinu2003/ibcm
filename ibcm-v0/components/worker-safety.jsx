"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, AlertTriangle, Check, UserIcon, Info } from "lucide-react";

export default function WorkerSafety() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  // PPE detection upload instructions
  const uploadInstructions = [
    "Upload a single image of workers at the construction site",
    "Supported formats: JPG, JPEG, PNG (max 10MB)",
    "Ensure workers are clearly visible in the image",
    "Good lighting conditions will improve detection accuracy",
    "The system will detect safety equipment: hardhats, masks, and safety vests",
    "Safety violations will be highlighted with red boundaries"
  ];

  // Group detections into categories for better display
  const categorizeDetections = (classCountsObj, detailedCountsObj) => {
    // Merge both counts objects into one for processing
    const detections = { ...(classCountsObj || {}), ...(detailedCountsObj || {}) };

    if (Object.keys(detections).length === 0) return { safety: [], violations: [], other: [] };

    const categories = {
      safety: [],  // Safety equipment properly worn
      violations: [], // Safety violations (NO-*)
      other: []     // Other objects (Person, machinery, etc.)
    };

    // All possible classes from data.yaml
    const safetyEquipment = ['Hardhat', 'Mask', 'Safety Vest', 'Safety Cone'];
    const violations = ['NO-Hardhat', 'NO-Mask', 'NO-Safety Vest'];
    const personObjects = ['Person'];
    const vehicleObjects = ['machinery', 'vehicle'];

    // Process each detection - ensure case-insensitive matching
    Object.entries(detections).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();

      if (violations.some(v => v.toLowerCase() === keyLower) || key.startsWith('NO-')) {
        categories.violations.push({ name: key, count: value });
      } else if (safetyEquipment.some(s => s.toLowerCase() === keyLower)) {
        categories.safety.push({ name: key, count: value });
      } else if (personObjects.some(p => p.toLowerCase() === keyLower)) {
        categories.other.push({ name: key, count: value });
      } else if (vehicleObjects.some(v => v.toLowerCase() === keyLower)) {
        categories.other.push({ name: key, count: value });
      } else {
        categories.other.push({ name: key, count: value }); // Fallback for any unrecognized classes
      }
    });

    return categories;
  };

  const handleFileChange = (event) => {
    if (event.target && event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setImageName(file.name);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage("Please select a file first.");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Try multiple endpoints with a timeout
      let response = null;
      let successfulEndpoint = null;
      const endpoints = [
        'https://7pxr530l-5000.inc1.devtunnels.ms/api/ppe-detection',
        'https://127.0.0.1:5000/api/ppe-detection', // Try HTTPS first
        'http://127.0.0.1:5000/api/ppe-detection',  // Then HTTP
        'http://localhost:5000/api/ppe-detection',  // Alternative hostname
      ];

      for (const endpoint of endpoints) {
        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            // Explicitly set mode to allow CORS requests
            mode: 'cors',
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            successfulEndpoint = endpoint;
            break; // Exit the loop if successful
          }
        } catch (fetchError) {
          // Continue to next endpoint
        }
      }

      // If none of the endpoints worked, show an error
      if (!response || !response.ok) {
        setErrorMessage(`API connection failed. Please make sure the backend server is running.
                         
To fix this, please:
1. Open https://127.0.0.1:5000 directly in your browser
2. Click "Advanced" and then "Accept the Risk and Continue"
3. Return to this page and try again

The backend is running with a self-signed certificate that the browser needs to accept first.`);
      } else {
        // We have a valid response from the API
        const data = await response.json();

        // Make sure we handle both class_counts and detailed_counts
        if (data) {
          // Ensure we set the result with all the data
          setResult(data);

          // Clear any previous error messages
          setErrorMessage(null);
        } else {
          setErrorMessage("API returned empty or invalid response format.");
        }
      }
    } catch (error) {
      // Don't set mock data, just show the error message
      setErrorMessage(`Error connecting to API: ${error.message}. 
      
To fix this, please:
1. Open https://127.0.0.1:5000 directly in your browser
2. Click "Advanced" and then "Accept the Risk and Continue" 
3. Return to this page and try again

The backend is running with a self-signed certificate that the browser needs to accept first.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format detection label for display
  const formatLabel = (label) => {
    return label
      .replace(/^NO-/, '') // Remove NO- prefix for display
      .replace(/_/g, ' '); // Replace underscores with spaces
  };

  // Get categories from detection results - consider both class_counts and detailed_counts
  const categories = result
    ? categorizeDetections(result.class_counts, result.detailed_counts)
    : { safety: [], violations: [], other: [] };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Worker Safety Detection</CardTitle>
        <CardDescription>
          Upload an image to detect safety equipment compliance on the construction site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-muted">
          <Info className="h-4 w-4" />
          <AlertTitle>Upload Guidelines</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              {uploadInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Upload className="mr-2 h-5 w-5" /> Upload Safety Image
        </h2>

        <Card className="mb-6 shadow-none">
          <CardContent className="p-4 sm:p-6">
            <p className="text-muted-foreground mb-4 mx-auto">
              Upload or drag and drop an image of workers at the construction site to detect PPE compliance.
              The system will analyze the image and highlight any safety violations.
            </p>

            <div>
              <p className="text-sm font-medium mb-2">Site Safety Image</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 h-48 sm:h-64 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-primary/50`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="w-full h-full flex flex-col items-center">
                    <div className="relative w-full h-32 sm:h-40 mb-2">
                      {/* Add a placeholder to show the selected file name if image can't be shown */}
                      <img
                        src={selectedFile ? URL.createObjectURL(selectedFile) : "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onLoad={() => selectedFile && URL.createObjectURL(selectedFile)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setImageName(null);
                        }}
                        className="absolute -top-2 -right-2 bg-white text-red-500 hover:bg-red-50 rounded-full p-1 shadow-md border border-red-200"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground truncate max-w-full">{imageName}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-2" />
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                      Drag & drop an image here, or click to select
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center mt-6">
              <Button
                onClick={handleSubmit}
                disabled={!selectedFile || isLoading}
                size="lg"
                className="w-full sm:w-auto mb-2"
              >
                {isLoading ? 'Processing...' : 'Analyze Safety Compliance'}
              </Button>
              <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                <div className={`h-2 w-2 rounded-full ${selectedFile ? "bg-primary" : "bg-muted"}`}></div>
                <span>Image {selectedFile ? "uploaded" : "not uploaded"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Processing image, please wait...</p>
          </div>
        )}

        {result && !isLoading && (
          <>
            <Separator className="my-6" />

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" /> Detection Results
                </h3>
                {result.annotated_image ? (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={`data:image/jpeg;base64,${result.annotated_image}`}
                      alt="Annotated"
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-12 text-center bg-muted">
                    <p className="text-muted-foreground">No annotated image available</p>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <Check className="mr-2 h-5 w-5 text-green-500" /> Safety Analysis Results
                </h3>

                {/* Violations - most important to highlight */}
                {categories.violations.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <h4 className="text-sm font-medium text-red-600 flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4" /> Safety Violations Detected
                    </h4>
                    <div className="space-y-2">
                      {categories.violations.map(({ name, count }) => (
                        <div
                          key={name}
                          className="flex justify-between items-center p-2.5 border-l-4 border-destructive bg-destructive/5 rounded-sm"
                        >
                          <span className="text-sm">Missing {formatLabel(name)}</span>
                          <Badge variant="destructive">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety equipment properly worn */}
                {categories.safety.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <h4 className="text-sm font-medium text-green-600 flex items-center">
                      <Check className="mr-2 h-4 w-4" /> Safety Equipment Detected
                    </h4>
                    <div className="space-y-2">
                      {categories.safety.map(({ name, count }) => (
                        <div
                          key={name}
                          className="flex justify-between items-center p-2.5 border-l-4 border-green-500 bg-green-500/5 rounded-sm"
                        >
                          <span className="text-sm">{formatLabel(name)}</span>
                          <Badge className="bg-green-600 hover:bg-green-700">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other detections - Always show this section if we have any detections */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-blue-600 flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" /> Other Objects Detected
                  </h4>
                  {categories.other.length > 0 ? (
                    <div className="space-y-2">
                      {categories.other.map(({ name, count }) => (
                        <div
                          key={name}
                          className="flex justify-between items-center p-2.5 border-l-4 border-blue-500 bg-blue-500/5 rounded-sm"
                        >
                          <span className="text-sm">{formatLabel(name)}</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 border-l-4 border-blue-100 bg-blue-50/5 rounded-sm text-sm text-muted-foreground">
                      No other objects detected
                    </div>
                  )}
                </div>

                {/* No detections case */}
                {!result.class_counts && !result.detailed_counts && (
                  <div className="p-6 text-center border rounded-md bg-muted">
                    <p className="text-muted-foreground">No detection results available</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
