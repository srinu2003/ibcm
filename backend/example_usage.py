import cv2
from ppe_detection import detect_ppe

# Load an image (BGR format)
image = cv2.imread("sample.jpg")

# Run PPE detection
result = detect_ppe(image)

# Access results
print(result["class_counts"])        # Dictionary of detected class counts
print(result["detailed_counts"])     # Dictionary of detailed PPE counts

# Save or display the annotated image
cv2.imwrite("annotated_output.jpg", result["annotated_image"])
# or
# cv2.imshow("PPE Detection", result["annotated_image"])
# cv2.waitKey(0)
