import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from typing import Optional, Sequence, Tuple, Dict, Any

def resize_image_preserve_aspect(
    image: np.ndarray, width: Optional[int] = None, height: Optional[int] = None, inter: int = cv2.INTER_AREA
) -> np.ndarray:
    (h, w) = image.shape[:2]
    if width is None and height is None:
        return image
    if width is None:
        r = height / float(h)
        dim = (int(w * r), height)
    else:
        r = width / float(w)
        dim = (width, int(h * r))
    return cv2.resize(image, dim, interpolation=inter)

def align_images_orb_homography(
    img1: np.ndarray, img2: np.ndarray, max_features: int = 500, good_match_percent: float = 0.15
) -> Tuple[np.ndarray, np.ndarray]:
    img1_gray = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    img2_gray = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB.create(max_features)
    keypoints1: Sequence[cv2.KeyPoint]
    keypoints1: Sequence[cv2.KeyPoint]
    keypoints1, descriptors1 = orb.detectAndCompute(img1_gray, None)
    keypoints2, descriptors2 = orb.detectAndCompute(img2_gray, None)
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = matcher.match(descriptors1, descriptors2)
    matches = sorted(matches, key=lambda x: x.distance)
    num_good_matches = int(len(matches) * good_match_percent)
    matches = matches[:num_good_matches]
    points1 = np.float32([keypoints1[m.queryIdx].pt for m in matches])
    points2 = np.float32([keypoints2[m.trainIdx].pt for m in matches])
    h, _ = cv2.findHomography(points2, points1, cv2.RANSAC)
    height, width = img1.shape[:2]
    img2_aligned = cv2.warpPerspective(img2, h, (width, height))
    return img2_aligned, h

def compute_overlap_mask(img1: np.ndarray, img2_aligned: np.ndarray) -> np.ndarray:
    mask1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY) > 0
    mask2 = cv2.cvtColor(img2_aligned, cv2.COLOR_BGR2GRAY) > 0
    return np.bitwise_and(mask1, mask2).astype(np.uint8) * 255

def extract_image_overlap(img: np.ndarray, mask: np.ndarray) -> np.ndarray:
    return cv2.bitwise_and(img, img, mask=mask)

def calculate_ssim_on_overlap(
    img1_overlap: np.ndarray, img2_overlap: np.ndarray, win_size: Tuple[int, int] = (11, 11)
) -> Tuple[float, np.ndarray]:
    img1_v = cv2.cvtColor(img1_overlap, cv2.COLOR_BGR2HSV)[..., 2]
    img2_v = cv2.cvtColor(img2_overlap, cv2.COLOR_BGR2HSV)[..., 2]
    img1_blur = cv2.blur(img1_v, ksize=win_size)
    img2_blur = cv2.blur(img2_v, ksize=win_size)
    score, ssim_img = ssim(img1_blur, img2_blur, full=True)
    ssim_img = (ssim_img * 255).astype('uint8')
    return score, ssim_img

def highlight_differences_on_image(
    img2_overlap: np.ndarray, ssim_img: np.ndarray, image_width: int, resize_factor: int = 1, win_size: Tuple[int, int] = (11, 11)
) -> np.ndarray:
    ssim_img = cv2.medianBlur(ssim_img, win_size[0])
    _, diff_binary = cv2.threshold(ssim_img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(diff_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    outlined = img2_overlap.copy()
    area_thresh = (6.7568 * image_width - 11972.973) // resize_factor
    for c in contours:
        if cv2.contourArea(c) > area_thresh:
            cv2.drawContours(outlined, [c], 0, (0, 0, 255), 2)
    return outlined

def analyze_images_api(
    previous_image_path: str, current_image_path: str, steady_camera: bool = False, resize_width: int = 500, win_size: Tuple[int, int] = (11, 11), resize_factor: int = 1
) -> Dict[str, Any]:
    """
    Analyzes and compares two images by aligning them, extracting their overlapping regions, and computing similarity metrics.

    Args:
        previous_image_path (str): Path to the previous (reference) image file.
        current_image_path (str): Path to the current (to be aligned and compared) image file.
        resize_width (int, optional): Width to resize images to while maintaining aspect ratio. Defaults to 500.
        win_size (Tuple[int, int], optional): Window size for SSIM computation. Defaults to (11, 11).
        resize_factor (int, optional): Factor to scale coordinates when drawing differences. Defaults to 1.

    Returns:
        Dict[str, Any]: A dictionary containing:
            - "score": SSIM similarity score between overlapping regions.
            - "img1_overlap": Overlapping region from the first image.
            - "img2_overlap": Overlapping region from the aligned second image.
            - "outlined": Image with differences outlined.
            - "ssim_img": SSIM map image.
            - "overlap_mask": Binary mask of the overlapping region.
            - "homography": Homography matrix used for alignment.

    Note:
        This function assumes the existence of helper functions for resizing, alignment, overlap extraction, SSIM computation, and difference outlining.
    
    API Documentation: Image Alignment and Difference Detection

    This module provides the `analyze_images_api` function for image alignment, overlap extraction, and difference detection.
    It is suitable for use in a Flask API for comparing two images.

    API Endpoint Example (Flask):
    -----------------------------

    POST /api/compare-images

    Request (multipart/form-data):
        - previous_image: File (required) - The reference image.
        - current_image: File (required) - The image to compare.
        - steady_camera: Boolean (optional, default: false)
        - resize_width: Integer (optional, default: 500)
        - win_size: String or JSON (optional, default: [11, 11])
        - resize_factor: Integer (optional, default: 1)

    Response (application/json):
        {
            "score": float,                # SSIM similarity score between overlapping regions
            "homography": [[...], ...],    # 3x3 homography matrix (list of lists)
            "img1_overlap": "base64...",   # Overlapping region from the first image (base64-encoded JPEG)
            "img2_overlap": "base64...",   # Overlapping region from the aligned second image (base64-encoded JPEG)
            "outlined": "base64...",       # Image with differences outlined (base64-encoded JPEG)
            "ssim_img": "base64...",       # SSIM map image (base64-encoded JPEG)
            "overlap_mask": "base64..."    # Binary mask of the overlapping region (base64-encoded PNG)
        }

    Usage Notes:
    ------------
    - Use `cv2.imencode` and `base64.b64encode` to encode images for JSON responses.
    - The function expects file paths; in Flask, save uploaded files to disk or use temporary files.
    - The "score" field is a float between -1 and 1 (higher means more similar).
    - The "homography" field is a 3x3 transformation matrix used for alignment.

    Example Flask Integration:
    --------------------------
    ```python
    from flask import Flask, request, jsonify
    import cv2
    import numpy as np
    import base64
    from image_alignment_pipeline import analyze_images_api

    app = Flask(__name__)

    def encode_image(img, ext='.jpg'):
        _, buffer = cv2.imencode(ext, img)
        return base64.b64encode(buffer).decode('utf-8')

    @app.route('/api/compare-images', methods=['POST'])
    def compare_images():
        prev_file = request.files['previous_image']
        curr_file = request.files['current_image']
        prev_path = '/tmp/prev.jpg'
        curr_path = '/tmp/curr.jpg'
        prev_file.save(prev_path)
        curr_file.save(curr_path)
        # Parse optional parameters...
        results = analyze_images_api(prev_path, curr_path)
        return jsonify({
            "score": results["score"],
            "homography": results["homography"].tolist(),
            "img1_overlap": encode_image(results["img1_overlap"]),
            "img2_overlap": encode_image(results["img2_overlap"]),
            "outlined": encode_image(results["outlined"]),
            "ssim_img": encode_image(results["ssim_img"]),
            "overlap_mask": encode_image(results["overlap_mask"], ext='.png')
        })
    ```
    """
    img1 = cv2.imread(previous_image_path)
    img2 = cv2.imread(current_image_path)
    img1 = resize_image_preserve_aspect(img1, width=resize_width)
    img2 = resize_image_preserve_aspect(img2, width=resize_width)
    if not steady_camera:
        img2_aligned, h = align_images_orb_homography(img1, img2)
    else:
        img2_aligned = img2.copy()
        h = np.eye(3)
    overlap_mask = compute_overlap_mask(img1, img2_aligned)
    img1_overlap = extract_image_overlap(img1, overlap_mask)
    img2_overlap = extract_image_overlap(img2_aligned, overlap_mask)
    score, ssim_img = calculate_ssim_on_overlap(img1_overlap, img2_overlap, win_size)
    outlined = highlight_differences_on_image(img2_overlap, ssim_img, img1.shape[1], resize_factor, win_size)
    return {
        "score": score,
        "img1_overlap": img1_overlap,
        "img2_overlap": img2_overlap,
        "outlined": outlined,
        "ssim_img": ssim_img,
        "overlap_mask": overlap_mask,
        "homography": h
    }

if __name__ == "__main__":
    previous_image_path = "TNB_3_1.jpg"
    current_image_path = "TNB_3_2.jpg"
    resize_width = 500
    results = analyze_images_api(
        previous_image_path,
        current_image_path,
        steady_camera=True,
        resize_width=resize_width,
    )
    print("SSIM Score:", results["score"])
    cv2.imwrite("outlined.jpg", results["outlined"], [int(cv2.IMWRITE_JPEG_QUALITY), 95])
