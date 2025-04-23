"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, ImageIcon, BarChart3, ArrowLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ImageMetrics from "./image-metrics"
import React from "react"
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
