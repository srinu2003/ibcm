"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { LineChart, Line, XAxis as LineXAxis, YAxis as LineYAxis, Tooltip as LineTooltip, Legend as LineLegend, ResponsiveContainer as LineContainer } from 'recharts';
import styles from '../../styles/ImageUpload.module.css'; // Import your CSS module

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];

const ImageUpload = () => {
  const [previousImage, setPreviousImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [category, setCategory] = useState('foundation');
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);

  // New state for API parameters
  const [steadyCamera, setSteadyCamera] = useState(true); // Changed from false to true to enable by default
  const [resizeWidth, setResizeWidth] = useState(500);
  const [winSizeWidth, setWinSizeWidth] = useState(11);
  const [winSizeHeight, setWinSizeHeight] = useState(11);
  const [resizeFactor, setResizeFactor] = useState(1);
  const [advancedOptionsVisible, setAdvancedOptionsVisible] = useState(false);
  const [noiseThreshold, setNoiseThreshold] = useState(10); // Adding noise threshold

  // Upload instructions based on backend requirements
  const uploadInstructions = [
    "Upload previous and current images of the same construction site.",
    "Supported formats: JPG, JPEG, PNG (max 10MB per image).",
    "For best results, take photos from the same angle and position.",
    "Images should clearly show the construction area with good lighting.",
    "Higher resolution images will provide more detailed analysis.",
    "Enable 'Steady Camera' if both images were taken from the same position."
  ];

  const handleImageChange = (e) => {
    if (e.target.name === 'previousImage') {
      setPreviousImage(e.target.files[0]);
    } else if (e.target.name === 'currentImage') {
      setCurrentImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!previousImage || !currentImage) {
      setError('Please upload both images.');
      return;
    }

    const formData = new FormData();
    formData.append('previous_image', previousImage);
    formData.append('current_image', currentImage);

    // Add new parameters
    formData.append('steady_camera', steadyCamera.toString());
    formData.append('resize_width', resizeWidth.toString());
    formData.append('win_size', `${winSizeWidth},${winSizeHeight}`);
    formData.append('resize_factor', resizeFactor.toString());
    formData.append('noise_threshold', noiseThreshold.toString()); // Adding noise threshold to form data

    try {
      const response = await axios.post('https://7pxr530l-5000.inc1.devtunnels.ms/api/ssim', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Calculate work done using the formula: 100 - similarity score - noise threshold
      const similarityScorePercentage = response.data.score * 100;
      const workDonePercentage = Math.max(0, 100 - similarityScorePercentage - noiseThreshold);

      setProgressData({
        ...response.data,
        work_done_percentage: workDonePercentage.toFixed(2),
        category: category,
        similarity_score: response.data.score,
      });
      setError(null);
    } catch (err) {
      setError(`An error occurred: ${err.message}`);
    }
  };

  // Prepare data for bar chart and line chart
  const barData = progressData ? [
    { name: 'Work Done', value: progressData.work_done_percentage },
    { name: 'Remaining', value: 100 - progressData.work_done_percentage },
  ] : [];

  const lineData = progressData ? [
    { date: 'Now', score: progressData.similarity_score }
  ] : [];

  const toggleAdvancedOptions = () => {
    setAdvancedOptionsVisible(!advancedOptionsVisible);
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>Construction Progress Analysis</h1>
        
        {/* Upload Instructions */}
        <div className={styles.instructionsContainer}>
          <h3 className={styles.instructionsTitle}>Image Upload Guidelines</h3>
          <ul className={styles.instructionsList}>
            {uploadInstructions.map((instruction, index) => (
              <li key={index} className={styles.instructionItem}>{instruction}</li>
            ))}
          </ul>
        </div>

        {/* Modified upload container to display images side by side */}
        <div className={styles.uploadContainer}>
          <div className={styles.uploadRow}>
            <div className={styles.uploadColumn}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Previous Image:</label>
                <div className={styles.fileInputContainer}>
                  <label htmlFor="previousImage" className={styles.fileInputLabel}>
                    Choose File {previousImage && <span className={styles.fileName}>{previousImage.name}</span>}
                  </label>
                  <input
                    type="file"
                    id="previousImage"
                    name="previousImage"
                    onChange={handleImageChange}
                    className={styles.fileInput}
                    accept="image/*"
                  />
                </div>
              </div>
              {previousImage && (
                <div className={styles.previewContainer}>
                  <img src={URL.createObjectURL(previousImage)} alt="Previous" className={styles.imagePreview} />
                </div>
              )}
            </div>
            <div className={styles.uploadColumn}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Current Image:</label>
                <div className={styles.fileInputContainer}>
                  <label htmlFor="currentImage" className={styles.fileInputLabel}>
                    Choose File {currentImage && <span className={styles.fileName}>{currentImage.name}</span>}
                  </label>
                  <input
                    type="file"
                    id="currentImage"
                    name="currentImage"
                    onChange={handleImageChange}
                    className={styles.fileInput}
                    accept="image/*"
                  />
                </div>
              </div>
              {currentImage && (
                <div className={styles.previewContainer}>
                  <img src={URL.createObjectURL(currentImage)} alt="Current" className={styles.imagePreview} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.select}>
            <option value="foundation">Foundation</option>
            <option value="superstructure">Super Structure</option>
            <option value="furnishing">furnishing</option>
            <option value="interiors">Interiors</option>
          </select>
        </div>

        <div className={styles.advancedOptionsToggle}>
          <button
            type="button"
            onClick={toggleAdvancedOptions}
            className={`${styles.toggleButton} ${advancedOptionsVisible ? styles.toggleButtonActive : ''}`}
          >
            Advanced Options
          </button>

          {advancedOptionsVisible && (
            <div className={styles.advancedOptions}>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={steadyCamera}
                    onChange={(e) => setSteadyCamera(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Steady Camera (Images taken from same position)
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Resize Width:</label>
                <input
                  type="number"
                  value={resizeWidth}
                  onChange={(e) => setResizeWidth(parseInt(e.target.value))}
                  className={styles.numberInput}
                  min="100"
                  max="2000"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Window Size:</label>
                <div className={styles.inputGroup}>
                  <input
                    type="number"
                    value={winSizeWidth}
                    onChange={(e) => setWinSizeWidth(parseInt(e.target.value))}
                    className={styles.smallNumberInput}
                    min="1"
                    max="50"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={winSizeHeight}
                    onChange={(e) => setWinSizeHeight(parseInt(e.target.value))}
                    className={styles.smallNumberInput}
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Resize Factor:</label>
                <input
                  type="number"
                  value={resizeFactor}
                  onChange={(e) => setResizeFactor(parseInt(e.target.value))}
                  className={styles.numberInput}
                  min="1"
                  max="10"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Noise Threshold (%):</label>
                <input
                  type="number"
                  value={noiseThreshold}
                  onChange={(e) => setNoiseThreshold(parseInt(e.target.value))}
                  className={styles.numberInput}
                  min="0"
                  max="50"
                />
              </div>
            </div>
          )}
        </div>

        <button type="submit" className={styles.button}>Analyze Images</button>
      </form>

      {progressData && (
        <div className={styles.result}>
          <h2 className={styles.resultTitle}>Analysis Results</h2>

          <div className={styles.resultMetrics}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Category</div>
              <div className={styles.metricValue}>{progressData.category}</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Similarity Score</div>
              <div className={styles.metricValue}>{(progressData.similarity_score * 100).toFixed(2)}%</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Work Done Percentage</div>
              <div className={styles.metricValue}>{progressData.work_done_percentage}%</div>
            </div>
          </div>

          {/* Progress bar visualization */}
          <h3 className={styles.sectionTitle}>Work Progress</h3>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${progressData.work_done_percentage}%` }}
            ></div>
            <div className={styles.progressPercentage}>{progressData.work_done_percentage}% Complete</div>
          </div>

          <h3 className={styles.sectionTitle}>Progress Visualizations</h3>

          <div className={styles.imageGrid}>
            {/* Previous image with overlap */}
            {progressData.img1_overlap && (
              <div className={styles.imageCard}>
                <h4>Previous Image Overlap</h4>
                <img
                  src={`data:image/jpeg;base64,${progressData.img1_overlap}`}
                  alt="Previous Image Overlap"
                  className={styles.resultImage}
                />
              </div>
            )}

            {/* Current image with overlap */}
            {progressData.img2_overlap && (
              <div className={styles.imageCard}>
                <h4>Current Image Overlap</h4>
                <img
                  src={`data:image/jpeg;base64,${progressData.img2_overlap}`}
                  alt="Current Image Overlap"
                  className={styles.resultImage}
                />
              </div>
            )}

            {/* Outlined comparison */}
            {progressData.outlined && (
              <div className={styles.imageCard}>
                <h4>Outlined Comparison</h4>
                <img
                  src={`data:image/jpeg;base64,${progressData.outlined}`}
                  alt="Outlined Comparison"
                  className={styles.resultImage}
                />
              </div>
            )}

            {/* SSIM Image */}
            {progressData.ssim_img && (
              <div className={styles.imageCard}>
                <h4>Similarity Map</h4>
                <img
                  src={`data:image/jpeg;base64,${progressData.ssim_img}`}
                  alt="SSIM Visualization"
                  className={styles.resultImage}
                />
              </div>
            )}

            {/* Overlap Mask - only show if steadyCamera is false */}
            {progressData.overlap_mask && !steadyCamera && (
              <div className={styles.imageCard}>
                <h4>Overlap Mask</h4>
                <img
                  src={`data:image/png;base64,${progressData.overlap_mask}`}
                  alt="Overlap Mask"
                  className={styles.resultImage}
                />
              </div>
            )}
          </div>

          {/* Show homography matrix if present */}
          {progressData.homography && !steadyCamera &&(
            <div className={styles.chartContainer}>
              <h3>Homography Matrix</h3>
              <table className={styles.matrixTable}>
                <tbody>
                  {progressData.homography.map((row, i) => (
                    <tr key={i}>
                      {row.map((val, j) => (
                        <td key={j}>{val.toExponential ? val.toExponential(3) : val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bar chart for work done */}
          <div className={styles.chartContainer}>
            <h3>Work Done Distribution</h3>
            {barData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value">
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default ImageUpload;
