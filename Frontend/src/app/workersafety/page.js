"use client";
import React, { useState, useRef } from 'react';
import styles from '../../styles/WorkerSafety.module.css';

function SafetyCompliance() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [result, setResult] = useState(null);
    const [imageName, setImageName] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Group detections into categories for better display
    const categorizeDetections = (detections) => {
        if (!detections) return { safety: [], violations: [], other: [] };
        
        const categories = {
            safety: [],  // Safety equipment properly worn
            violations: [], // Safety violations (NO-*)
            other: []     // Other objects (Person, machinery, etc.)
        };
        
        Object.entries(detections).forEach(([key, value]) => {
            if (key.startsWith('NO-')) {
                categories.violations.push({ name: key, count: value });
            } else if (['Hardhat', 'Mask', 'Safety Vest'].includes(key)) {
                categories.safety.push({ name: key, count: value });
            } else {
                categories.other.push({ name: key, count: value });
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

        if (!selectedFile) {
            alert("Please select a file first.");
            return;
        }

        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('http://7pxr530l-5000.inc1.devtunnels.ms/api/ppe-detection', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to process image. Please try again.');
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

    // Get categories from detection results
    const categories = result?.detailed_counts 
        ? categorizeDetections(result.detailed_counts) 
        : { safety: [], violations: [], other: [] };
    
    return (
        <div className={styles.pageContainer}>
            <div className={styles.card}>
                <h1 className={styles.title}>Worker Safety Detection</h1>
                <p className={styles.subtitle}>Upload an image to detect safety equipment compliance</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <label className={styles.fileInput}>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange} 
                            accept="image/*" 
                        />
                        Choose an Image
                    </label>
                    <button 
                        type="submit" 
                        className={styles.uploadButton}
                        disabled={!selectedFile || isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Upload'}
                    </button>
                </form>

                {/* Show the image name after upload */}
                {imageName && <p className={styles.imageName}>Selected: {imageName}</p>}

                {isLoading && <p className={styles.loadingText}>Processing image, please wait...</p>}

                {result && !isLoading && (
                    <div className={styles.resultsContainer}>
                        <div className={styles.imagesContainer}>
                            <div className={styles.imageBox}>
                                <h3 className={styles.imageTitle}>Detected Objects</h3>
                                {result.annotated_image ? (
                                    <img 
                                        src={`data:image/jpeg;base64,${result.annotated_image}`} 
                                        alt="Annotated" 
                                        className={styles.image} 
                                    />
                                ) : (
                                    <p>No annotated image available</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Display PPE detection counts by category */}
                        <div className={styles.countsContainer}>
                            <h3 className={styles.countTitle}>Safety Analysis Results:</h3>
                            
                            {/* Violations - most important to highlight */}
                            {categories.violations.length > 0 && (
                                <div className={styles.categorySection}>
                                    <h4 className={styles.categoryTitle} style={{color: '#e74c3c'}}>
                                        Safety Violations Detected
                                    </h4>
                                    <ul className={styles.countsList}>
                                        {categories.violations.map(({name, count}) => (
                                            <li 
                                                key={name} 
                                                className={styles.countItem}
                                                style={{
                                                    backgroundColor: count > 0 ? '#fff8f8' : 'white',
                                                    borderLeft: count > 0 ? '3px solid #e74c3c' : '3px solid #2ecc71'
                                                }}
                                            >
                                                <span className={styles.countLabel}>
                                                    Missing {formatLabel(name)}
                                                </span>
                                                <span 
                                                    className={styles.countValue}
                                                    style={{
                                                        backgroundColor: count > 0 ? '#fadbd8' : '#ebf5fb',
                                                        color: count > 0 ? '#e74c3c' : '#3498db'
                                                    }}
                                                >
                                                    {count}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* Safety equipment properly worn */}
                            {categories.safety.length > 0 && (
                                <div className={styles.categorySection}>
                                    <h4 className={styles.categoryTitle} style={{color: '#2ecc71'}}>
                                        Safety Equipment Detected
                                    </h4>
                                    <ul className={styles.countsList}>
                                        {categories.safety.map(({name, count}) => (
                                            <li 
                                                key={name} 
                                                className={styles.countItem}
                                                style={{
                                                    backgroundColor: 'white',
                                                    borderLeft: '3px solid #2ecc71'
                                                }}
                                            >
                                                <span className={styles.countLabel}>
                                                    {formatLabel(name)}
                                                </span>
                                                <span 
                                                    className={styles.countValue}
                                                    style={{
                                                        backgroundColor: '#e8f8f5',
                                                        color: '#2ecc71'
                                                    }}
                                                >
                                                    {count}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* Other detections */}
                            {categories.other.length > 0 && (
                                <div className={styles.categorySection}>
                                    <h4 className={styles.categoryTitle} style={{color: '#3498db'}}>
                                        Other Objects Detected
                                    </h4>
                                    <ul className={styles.countsList}>
                                        {categories.other.map(({name, count}) => (
                                            <li 
                                                key={name} 
                                                className={styles.countItem}
                                                style={{
                                                    backgroundColor: 'white',
                                                    borderLeft: '3px solid #3498db'
                                                }}
                                            >
                                                <span className={styles.countLabel}>
                                                    {formatLabel(name)}
                                                </span>
                                                <span 
                                                    className={styles.countValue}
                                                    style={{
                                                        backgroundColor: '#ebf5fb',
                                                        color: '#3498db'
                                                    }}
                                                >
                                                    {count}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* No detections case */}
                            {!result.detailed_counts || Object.keys(result.detailed_counts).length === 0 && (
                                <p>No detection results available</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SafetyCompliance;
