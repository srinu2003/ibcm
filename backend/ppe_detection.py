from typing import Tuple, List

import cv2
import numpy as np
from dotenv import load_dotenv
from ultralytics import YOLO
from ultralytics.engine.results import Boxes, Results

load_dotenv()  # Load environment variables from .env file

class_colors: dict = {
    "Person": (255, 0, 0),  # Blue
    "Hardhat": (0, 0, 255),  # Red
    "NO-Hardhat": (0, 0, 128),  # Dark Red
    "Mask": (0, 255, 0),  # Green
    "NO-Mask": (128, 128, 0),  # Dark Yellow
    "NO-Safety Vest": (64, 0, 64),  # Dark Magenta
    "Safety Cone": (128, 0, 128),  # Purple
    "Safety Vest": (0, 128, 64),  # Darker Green
    "machinery": (0, 128, 128),  # Teal
    "vehicle": (128, 128, 128)  # Gray
}


def draw_text_with_background(
        frame: cv2.Mat,
        text: str,
        position: Tuple[int, int],
        font_scale: float = 0.4,
        color: Tuple[int, int, int] = (255, 255, 255),
        thickness: int = 1,
        bg_color: Tuple[int, int, int] = (0, 0, 0),
        alpha: float = 0.7,
        padding: int = 5
) -> None:
    """
    Draws text with a background rectangle on the given frame.

    Args:
        frame: The image frame to draw on.
        text: The text to display.
        position: The (x, y) position of the text.
        font_scale: The scale of the font.
        color: The color of the text.
        thickness: The thickness of the text.
        bg_color: The background color of the text.
        alpha: The transparency of the background.
        padding: Padding around the text.
    """
    font = cv2.FONT_HERSHEY_SIMPLEX
    text_size = cv2.getTextSize(text, font, font_scale, thickness)[0]
    text_width, text_height = text_size

    overlay = frame.copy()
    x, y = position
    cv2.rectangle(overlay, (x - padding, y - text_height - padding), (x + text_width + padding, y + padding), bg_color,
                  -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    cv2.putText(frame, text, (x, y), font, font_scale, color, thickness)


def main() -> None:
    try:
        model: YOLO = YOLO("Model/ibcm-ppe.pt")  # Load model
        model.to("cuda")  # Move model to GPU
        # model: YOLO = YOLO("runs/detect/train2/weights/best.onnx")  # Load model
        # # ONNX models do not support .to("cuda"), use device argument in predict instead
        print("Model can predict the following classes:", model.names)
    except Exception as e:
        print(f"Error: Unable to load the YOLO model. Exception: {e}")
        return

    image_path: str = "sample.jpg"
    frame: cv2.Mat = cv2.imread(image_path)
    if frame is None:
        print(f"Error: Unable to load the image from {image_path}.")
        return

    # Perform YOLO inference
    try:
        results: List[Results] = model(frame)
        # # For ONNX, pass device argument directly to predict
        # results: List[Results] = model.predict(frame, device=0)
    except Exception as e:
        print(f"Error during inference: {e}")
        return

    # Initialize class_counts before processing
    class_counts = {}

    # Process detection results - optimized with NumPy
    for result in results:
        if result.boxes is not None:
            # Extract all boxes data at once
            boxes: Boxes = result.boxes
            xyxy = boxes.xyxy.cpu().numpy().astype(int)
            conf = boxes.conf.cpu().numpy()
            cls_ids = boxes.cls.cpu().numpy().astype(int)

            # Filter detections with confidence <= 50%
            valid_indices = np.where(conf >= 0.5)[0]
            xyxy = xyxy[valid_indices]
            conf = conf[valid_indices]
            cls_ids = cls_ids[valid_indices]

            unique_classes, counts = np.unique([model.names[c] for c in cls_ids], return_counts=True)
            class_counts = dict(zip(unique_classes, counts))

            print("===== Classes Detected and Counts =====")
            for cls, count in class_counts.items():
                print(f"{cls}: {count}")
            print("=======================================")

            # Extract counts for specific classes and their opposites
            hardhat_count = class_counts.get("Hardhat", 0)
            no_hardhat_count = class_counts.get("NO-Hardhat", 0)
            vest_count = class_counts.get("Safety Vest", 0)
            no_vest_count = class_counts.get("NO-Safety Vest", 0)
            mask_count = class_counts.get("Mask", 0)
            no_mask_count = class_counts.get("NO-Mask", 0)

            print("===== Detailed PPE Analysis =====")
            print(f"Hardhat: {hardhat_count}, NO-Hardhat: {no_hardhat_count}")
            print(f"Safety Vest: {vest_count}, NO-Safety Vest: {no_vest_count}")
            print(f"Mask: {mask_count}, NO-Mask: {no_mask_count}")
            print("=================================")

            # Process each detection (still needed for drawing)
            for i in range(len(xyxy)):
                x1, y1, x2, y2 = xyxy[i]
                confidence = conf[i]
                cls = int(cls_ids[i])
                label = f"{model.names[cls]} ({confidence:.2f})"

                # Select color for the class
                color = class_colors.get(model.names[cls], (255, 255, 255))

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                draw_text_with_background(frame, label, (x1, y1 - 10), font_scale=0.4, color=(255, 255, 255),
                                          bg_color=color, alpha=0.8, padding=4)

    # Prepare sideboard text with counts
    sideboard_text: List[str] = [f"{cls}: {count}" for cls, count in class_counts.items()]
    sideboard_text.insert(0, "PPE Detection Results:")

    # Add sideboard text to the frame
    y_position: int = 30
    for text in sideboard_text:
        draw_text_with_background(
            frame,
            text,
            (10, y_position),
            font_scale=0.5,
            color=(255, 255, 255),
            bg_color=(0, 0, 0),
            alpha=0.7,
            padding=5
        )
        y_position += 30

    # Save the annotated image
    output_path: str = "output_image.jpg"
    cv2.imwrite(output_path, frame)
    print(f"Annotated image saved to {output_path}.")


if __name__ == "__main__":
    main()
