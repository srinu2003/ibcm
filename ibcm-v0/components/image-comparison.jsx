"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, ImageIcon, BarChart3, ArrowLeft, ChevronRight, Activity, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import ImageMetrics from "./image-metrics"
import React from "react"
import axios from "axios"
// import ImageComparisonGraph from "./image-comparison-graph"

/**
 * @typedef {Object} ImageData
 * @property {File} file
 * @property {string} url
 * @property {{ width: number, height: number, aspectRatio: number, fileSize: number, fileType: string, colorDepth?: number } | null} metrics
 */

export default function ImageComparison() {
  const [images, setImages] = useState([null, null])
  const [currentView, setCurrentView] = useState("upload")
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [similarityScore, setSimilarityScore] = useState(null)
  const [workDonePercentage, setWorkDonePercentage] = useState(null)
  const [error, setError] = useState(null)

  // SSIM API configuration parameters
  const [steadyCamera, setSteadyCamera] = useState(true)
  const [resizeWidth, setResizeWidth] = useState(500)
  const [winSizeWidth, setWinSizeWidth] = useState(11)
  const [winSizeHeight, setWinSizeHeight] = useState(11)
  const [resizeFactor, setResizeFactor] = useState(1)
  const [noiseThreshold, setNoiseThreshold] = useState(10)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Function to analyze images and generate similarity score
  const analyzeImages = async () => {
    if (!images[0] || !images[1]) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('previous_image', images[0].file);
      formData.append('current_image', images[1].file);

      // Add parameters
      formData.append('steady_camera', steadyCamera.toString());
      formData.append('resize_width', resizeWidth.toString());
      formData.append('win_size', `${winSizeWidth},${winSizeHeight}`);
      formData.append('resize_factor', resizeFactor.toString());
      formData.append('noise_threshold', noiseThreshold.toString());

      console.log("Sending request to API with parameters:", {
        steady_camera: steadyCamera,
        resize_width: resizeWidth,
        win_size: `${winSizeWidth},${winSizeHeight}`,
        resize_factor: resizeFactor,
        noise_threshold: noiseThreshold
      });

      const response = await axios.post('https://7pxr530l-5000.inc1.devtunnels.ms/api/ssim', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000
      });

      // Calculate work done using the formula: 100 - similarity score - noise threshold
      const score = response.data.score;
      const similarityScorePercentage = score * 100;
      const workDone = Math.max(0, 100 - similarityScorePercentage - noiseThreshold);

      setSimilarityScore(score);
      setWorkDonePercentage(workDone.toFixed(2));

      // Set actual analysis results with real visualization data
      setAnalysisResults({
        similarityScore: score,
        workDonePercentage: workDone.toFixed(2),
        visualizations: {
          outlined: `data:image/jpeg;base64,${response.data.outlined}`,
          ssimMap: `data:image/jpeg;base64,${response.data.ssim_img}`,
          overlapMask: response.data.overlap_mask ? `data:image/png;base64,${response.data.overlap_mask}` : null
        },
        img1_overlap: response.data.img1_overlap,
        img2_overlap: response.data.img2_overlap,
        homography: response.data.homography
      });
    } catch (error) {
      console.error("Error analyzing images:", error);
      let errorMessage = "An error occurred during image analysis";

      if (error.response) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.data || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection or try again later.';
      } else {
        errorMessage = `Error: ${error.message || 'Unknown error occurred'}`;
      }

      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processImage = useCallback(async (file, index) => {
    const url = URL.createObjectURL(file)

    // Create a promise to get image dimensions
    const getDimensions = () =>
      new Promise((resolve) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
          })
        }
        img.src = url
      })

    const dimensions = await getDimensions()

    const newImageData = {
      file,
      url,
      metrics: {
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: dimensions.width / dimensions.height,
        fileSize: file.size,
        fileType: file.type,
      },
    }

    setImages((prev) => {
      const newImages = [...prev]
      newImages[index] = newImageData
      return newImages
    })
  }, [])

  const onDrop = useCallback(
    (acceptedFiles, index) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        if (file.type.startsWith("image/")) {
          processImage(file, index)
        }
      }
    },
    [processImage],
  )

  const dropzone1 = useDropzone({
    onDrop: (files) => onDrop(files, 0),
    accept: {
      "image/*": [],
    },
    maxFiles: 1,
  })

  const dropzone2 = useDropzone({
    onDrop: (files) => onDrop(files, 1),
    accept: {
      "image/*": [],
    },
    maxFiles: 1,
  })

  const handleViewResults = () => {
    if (images[0] && images[1]) {
      setCurrentView("results")
      analyzeImages()
      // // Scroll to top for better UX
      // window.scrollTo(0, 0)
      // Remove automatic scrolling due to bad UX
    }
  }

  const handleBackToUpload = () => {
    setCurrentView("upload")
    // // Scroll to top for better UX
    // window.scrollTo(0, 0)
    // Remove automatic scrolling due to bad UX
  }

  const resetImages = () => {
    images.forEach((image) => {
      if (image?.url) {
        URL.revokeObjectURL(image.url)
      }
    })
    setImages([null, null])
    setCurrentView("upload")
  }

  const removeImage = (index) => {
    if (images[index]?.url) {
      URL.revokeObjectURL(images[index].url)
    }
    setImages((prev) => {
      const newImages = [...prev]
      newImages[index] = null
      return newImages
    })
  }

  const bothImagesUploaded = images[0] && images[1]

  // PSNR stands for Peak Signal-to-Noise Ratio.
  // It is a metric used to measure the quality of a reconstructed or compressed image compared to its original.
  // Higher PSNR values generally indicate that the reconstructed image is closer to the original (better quality).
  // It is commonly used in image processing and compression to evaluate the fidelity of lossy transformations.

  return (
    <div className="w-full mx-auto">
      {/* Simplified Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4" id="image-comparison-header">
        <h2 className="text-2xl font-semibold">
          <a
            href="#image-comparison-header"
            className="hover:text-primary hover:underline active:text-primary/80 transition-colors"
            title="Back to top"
          >
            Construction Progress Image Comparison
          </a>
        </h2>

        {currentView === "results" && (
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleBackToUpload} className="flex-1 sm:flex-none">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
            </Button>
            <Button variant="outline" size="sm" onClick={resetImages} className="flex-1 sm:flex-none">
              Reset Images
            </Button>
          </div>
        )}
      </div>

      {/* Upload View */}
      {currentView === "upload" && (
        <div>
          <Card className="mb-6 shadow-none">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="mr-2 h-5 w-5" /> Upload Site Images
              </h2>
              <p className="text-muted-foreground mb-4 mx-auto">
                Upload or drag and drop two images from the construction site to track progress and analyze changes over time. View metrics like similarity scores, detected changes, and progress analytics.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm font-medium mb-2">Site Image 1</p>
                  <div
                    {...dropzone1.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-4 h-48 sm:h-64 flex flex-col items-center justify-center cursor-pointer transition-colors ${dropzone1.isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                  >
                    <input {...dropzone1.getInputProps()} />
                    {images[0] ? (
                      <div className="w-full h-full flex flex-col items-center">
                        <div className="relative w-full h-32 sm:h-40 mb-2">
                          <img
                            src={images[0].url || "/placeholder.svg"}
                            alt="Preview 1"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(0);
                            }}
                            className="absolute -top-2 -right-2 bg-white text-red-500 hover:bg-red-50 rounded-full p-1 shadow-md border border-red-200"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-full">{images[0].file.name}</p>
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

                <div>
                  <p className="text-sm font-medium mb-2">Site Image 2</p>
                  <div
                    {...dropzone2.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-4 h-48 sm:h-64 flex flex-col items-center justify-center cursor-pointer transition-colors ${dropzone2.isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                  >
                    <input {...dropzone2.getInputProps()} />
                    {images[1] ? (
                      <div className="w-full h-full flex flex-col items-center">
                        <div className="relative w-full h-32 sm:h-40 mb-2">
                          <img
                            src={images[1].url || "/placeholder.svg"}
                            alt="Preview 2"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(1);
                            }}
                            className="absolute -top-2 -right-2 bg-white text-red-500 hover:bg-red-50 rounded-full p-1 shadow-md border border-red-200"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-full">{images[1].file.name}</p>
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
              </div>

              {/* Move Analyze button and status indicator inside Card */}
              <div className="flex flex-col items-center mt-6">
                {/* Advanced Options Toggle */}
                <div className="w-full mb-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full text-sm"
                  >
                    {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                  </Button>

                  {showAdvancedOptions && (
                    <div className="border rounded-lg p-4 mt-2 space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="steadyCamera"
                          checked={steadyCamera}
                          onChange={(e) => setSteadyCamera(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="steadyCamera" className="text-sm">
                          Steady Camera (Images taken from same position)
                        </label>
                      </div>

                      <div>
                        <label htmlFor="resizeWidth" className="text-sm font-medium block mb-1">
                          Resize Width: {resizeWidth}px
                        </label>
                        <input
                          type="range"
                          id="resizeWidth"
                          min="200"
                          max="1000"
                          step="50"
                          value={resizeWidth}
                          onChange={(e) => setResizeWidth(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="winSizeWidth" className="text-sm font-medium block mb-1">
                            Window Width: {winSizeWidth}
                          </label>
                          <input
                            type="range"
                            id="winSizeWidth"
                            min="3"
                            max="21"
                            step="2"
                            value={winSizeWidth}
                            onChange={(e) => setWinSizeWidth(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label htmlFor="winSizeHeight" className="text-sm font-medium block mb-1">
                            Window Height: {winSizeHeight}
                          </label>
                          <input
                            type="range"
                            id="winSizeHeight"
                            min="3"
                            max="21"
                            step="2"
                            value={winSizeHeight}
                            onChange={(e) => setWinSizeHeight(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="resizeFactor" className="text-sm font-medium block mb-1">
                          Resize Factor: {resizeFactor}
                        </label>
                        <input
                          type="range"
                          id="resizeFactor"
                          min="1"
                          max="10"
                          value={resizeFactor}
                          onChange={(e) => setResizeFactor(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label htmlFor="noiseThreshold" className="text-sm font-medium block mb-1">
                          Noise Threshold: {noiseThreshold}%
                        </label>
                        <input
                          type="range"
                          id="noiseThreshold"
                          min="0"
                          max="30"
                          value={noiseThreshold}
                          onChange={(e) => setNoiseThreshold(Number(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Higher threshold filters out more minor differences
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={handleViewResults} disabled={!bothImagesUploaded} size="lg" className="w-full sm:w-auto mb-2">
                  Analyze Progress <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                  <div className={`h-2 w-2 rounded-full ${images[0] ? "bg-primary" : "bg-muted"}`}></div>
                  <span>Image 1 {images[0] ? "uploaded" : "not uploaded"}</span>
                  <div className="mx-2">•</div>
                  <div className={`h-2 w-2 rounded-full ${images[1] ? "bg-primary" : "bg-muted"}`}></div>
                  <span>Image 2 {images[1] ? "uploaded" : "not uploaded"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results View */}
      {currentView === "results" && bothImagesUploaded && (
        <Card className="shadow-none">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <ImageIcon className="mr-2 h-5 w-5" /> Progress Results
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <p className="text-sm font-medium mb-2 text-center">{images[0]?.file.name}</p>
                <div className="border rounded-lg p-2 h-48 sm:h-64 flex items-center justify-center bg-muted/30">
                  <img
                    src={images[0]?.url || "/placeholder.svg"}
                    alt="Image 1"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 text-center">{images[1]?.file.name}</p>
                <div className="border rounded-lg p-2 h-48 sm:h-64 flex items-center justify-center bg-muted/30">
                  <img
                    src={images[1]?.url || "/placeholder.svg"}
                    alt="Image 2"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>


            <Separator className="my-6 sm:my-8" />

            {/* Progress Analysis Section */}
            <h2 className="text-xl font-semibold mb-4 sm:mb-6 flex items-center">
              <Activity className="mr-2 h-5 w-5" /> Progress Analysis
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                <p>Analyzing images, please wait...</p>
              </div>
            ) : analysisResults && (
              <div className="space-y-8">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-card/50">
                    <CardContent className="p-4 flex flex-col items-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Similarity Score</h3>
                      <p className="text-3xl font-bold">{(similarityScore * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lower similarity indicates more changes
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50">
                    <CardContent className="p-4 flex flex-col items-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Work Done</h3>
                      <p className="text-3xl font-bold">{workDonePercentage}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated progress based on changes
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50">
                    <CardContent className="p-4 flex flex-col items-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Noise Threshold</h3>
                      <p className="text-3xl font-bold">{noiseThreshold}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Filtering out minor differences
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Construction Progress</span>
                    <span>{workDonePercentage}% Complete</span>
                  </div>
                  <Progress value={parseFloat(workDonePercentage)} className="h-3" />
                </div>

                {/* Visualizations Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Progress Visualizations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SSIM Map Visualization */}
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center">
                        <h4 className="text-sm font-medium mb-2">Similarity Map</h4>
                        <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                          {analysisResults.visualizations.ssimMap ? (
                            <img
                              src={analysisResults.visualizations.ssimMap}
                              alt="Similarity Map"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground">Similarity map not available</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Shows differences between images with lighter areas indicating greater differences
                        </p>
                      </CardContent>
                    </Card>

                    {/* Outlined Comparison */}
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center">
                        <h4 className="text-sm font-medium mb-2">Change Detection</h4>
                        <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                          {analysisResults.visualizations.outlined ? (
                            <img
                              src={analysisResults.visualizations.outlined}
                              alt="Change Detection"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground">Change detection visualization not available</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Outlines areas with significant changes between images
                        </p>
                      </CardContent>
                    </Card>

                    {/* Previous image with overlap - only shown if available */}
                    {analysisResults.img1_overlap && (
                      <Card>
                        <CardContent className="p-4 flex flex-col items-center">
                          <h4 className="text-sm font-medium mb-2">Previous Image Overlap</h4>
                          <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                            <img
                              src={`data:image/jpeg;base64,${analysisResults.img1_overlap}`}
                              alt="Previous Image Overlap"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Shows how the previous image overlaps with the current one
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Current image with overlap - only shown if available */}
                    {analysisResults.img2_overlap && (
                      <Card>
                        <CardContent className="p-4 flex flex-col items-center">
                          <h4 className="text-sm font-medium mb-2">Current Image Overlap</h4>
                          <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                            <img
                              src={`data:image/jpeg;base64,${analysisResults.img2_overlap}`}
                              alt="Current Image Overlap"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Shows how the current image overlaps with the previous one
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Overlap Mask - only show if non-steady camera and available */}
                    {!steadyCamera && analysisResults.visualizations.overlapMask && (
                      <Card>
                        <CardContent className="p-4 flex flex-col items-center">
                          <h4 className="text-sm font-medium mb-2">Overlap Mask</h4>
                          <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                            <img
                              src={analysisResults.visualizations.overlapMask}
                              alt="Overlap Mask"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Shows regions where both images overlap
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Show homography matrix if present and not steady camera */}
                {!steadyCamera && analysisResults.homography && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Homography Matrix</h3>
                    <Card>
                      <CardContent className="p-4 overflow-x-auto">
                        <table className="min-w-[200px] border-collapse">
                          <tbody>
                            {analysisResults.homography.map((row, i) => (
                              <tr key={i}>
                                {row.map((val, j) => (
                                  <td key={j} className="border px-2 py-1 text-sm">
                                    {val.toExponential ? val.toExponential(3) : val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}


            <Separator className="my-6 sm:my-8" />

            <h2 className="text-xl font-semibold mb-4 sm:mb-6 flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" /> Progress Metrics
            </h2>

            <div className="overflow-x-auto">
              <ImageMetrics images={images} />
            </div>

            <Separator className="my-6 sm:my-8" />

            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min flex items-center justify-center">
              Progress Graph and Analysis
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
