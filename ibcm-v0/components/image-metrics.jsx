import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

/**
 * @typedef {Object} ImageData
 * @property {File} file
 * @property {string} url
 * @property {{ width: number, height: number, aspectRatio: number, fileSize: number, fileType: string, colorDepth?: number } | null} metrics
 */

/**
 * @typedef {Object} ImageMetricsProps
 * @property {[ImageData, ImageData]} images
 */

/**
 * @param {ImageMetricsProps} props
 */
export default function ImageMetrics({ images }) {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    else return (bytes / 1048576).toFixed(2) + " MB"
  }

  const getFileSizeDifference = () => {
    const size1 = images[0].metrics?.fileSize || 0
    const size2 = images[1].metrics?.fileSize || 0
    const diff = Math.abs(size1 - size2)
    const percentage = size1 ? (diff / size1) * 100 : 0

    return {
      diff: formatFileSize(diff),
      percentage: percentage.toFixed(2) + "%",
      larger: size1 > size2 ? "Image 1" : size1 < size2 ? "Image 2" : "Equal",
    }
  }

  const getResolutionDifference = () => {
    const res1 = (images[0].metrics?.width || 0) * (images[0].metrics?.height || 0)
    const res2 = (images[1].metrics?.width || 0) * (images[1].metrics?.height || 0)
    const diff = Math.abs(res1 - res2)
    const percentage = res1 ? (diff / res1) * 100 : 0

    return {
      diff: diff.toLocaleString() + " pixels",
      percentage: percentage.toFixed(2) + "%",
      higher: res1 > res2 ? "Image 1" : res1 < res2 ? "Image 2" : "Equal",
    }
  }

  const fileSizeDiff = getFileSizeDifference()
  const resolutionDiff = getResolutionDifference()

  return (
    <div className="space-y-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Metric</TableHead>
            <TableHead>Image 1</TableHead>
            <TableHead>Image 2</TableHead>
            <TableHead>Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Dimensions</TableCell>
            <TableCell>
              {images[0].metrics?.width || 0} × {images[0].metrics?.height || 0} px
            </TableCell>
            <TableCell>
              {images[1].metrics?.width || 0} × {images[1].metrics?.height || 0} px
            </TableCell>
            <TableCell>
              {resolutionDiff.higher !== "Equal"
                ? `${resolutionDiff.higher} has ${resolutionDiff.percentage} more pixels`
                : "Equal resolution"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Aspect Ratio</TableCell>
            <TableCell>{images[0].metrics?.aspectRatio.toFixed(2) || 0}</TableCell>
            <TableCell>{images[1].metrics?.aspectRatio.toFixed(2) || 0}</TableCell>
            <TableCell>
              {Math.abs((images[0].metrics?.aspectRatio || 0) - (images[1].metrics?.aspectRatio || 0)).toFixed(2)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">File Size</TableCell>
            <TableCell>{formatFileSize(images[0].metrics?.fileSize || 0)}</TableCell>
            <TableCell>{formatFileSize(images[1].metrics?.fileSize || 0)}</TableCell>
            <TableCell>
              {fileSizeDiff.larger !== "Equal"
                ? `${fileSizeDiff.larger} is ${fileSizeDiff.percentage} larger (${fileSizeDiff.diff})`
                : "Equal size"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">File Type</TableCell>
            <TableCell>{images[0].metrics?.fileType || "Unknown"}</TableCell>
            <TableCell>{images[1].metrics?.fileType || "Unknown"}</TableCell>
            <TableCell>
              {images[0].metrics?.fileType === images[1].metrics?.fileType ? "Same format" : "Different formats"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Resolution (MP)</TableCell>
            <TableCell>
              {(((images[0].metrics?.width || 0) * (images[0].metrics?.height || 0)) / 1000000).toFixed(2)} MP
            </TableCell>
            <TableCell>
              {(((images[1].metrics?.width || 0) * (images[1].metrics?.height || 0)) / 1000000).toFixed(2)} MP
            </TableCell>
            <TableCell>
              {resolutionDiff.higher !== "Equal"
                ? `${resolutionDiff.higher} has higher resolution`
                : "Equal resolution"}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
