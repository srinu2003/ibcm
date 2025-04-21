from typing import Tuple, List, Dict, Any
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

def detect_ppe(image: np.ndarray) -> Dict[str, Any]:
    """
    Perform PPE detection on the input image.

    Args:
        image: Input image as a numpy array (BGR).

    Returns:
        dict: {
            'class_counts': {class_name: count, ...},
            'detailed_counts': {
                'Hardhat': int,
                'NO-Hardhat': int,
                'Safety Vest': int,
                'NO-Safety Vest': int,
                'Mask': int,
                'NO-Mask': int
            },
            'annotated_image': np.ndarray
        }
    """
    try:
        model: YOLO = YOLO("Model/ibcm-ppe.pt")
        model.to("cuda")
    except Exception as e:
        raise RuntimeError(f"Unable to load the YOLO model: {e}")

    frame = image.copy()
    try:
        results: List[Results] = model(frame)
    except Exception as e:
        raise RuntimeError(f"Error during inference: {e}")

    class_counts = {}
    detailed_counts = {
        "Hardhat": 0,
        "NO-Hardhat": 0,
        "Safety Vest": 0,
        "NO-Safety Vest": 0,
        "Mask": 0,
        "NO-Mask": 0
    }

    for result in results:
        if result.boxes is not None:
            boxes: Boxes = result.boxes
            xyxy = boxes.xyxy.cpu().numpy().astype(int)
            conf = boxes.conf.cpu().numpy()
            cls_ids = boxes.cls.cpu().numpy().astype(int)

            valid_indices = np.where(conf >= 0.5)[0]
            xyxy = xyxy[valid_indices]
            conf = conf[valid_indices]
            cls_ids = cls_ids[valid_indices]

            unique_classes, counts = np.unique([model.names[c] for c in cls_ids], return_counts=True)
            class_counts = dict(zip(unique_classes, counts))

            # Fill detailed_counts
            for key in detailed_counts.keys():
                detailed_counts[key] = class_counts.get(key, 0)

            for i in range(len(xyxy)):
                x1, y1, x2, y2 = xyxy[i]
                confidence = conf[i]
                cls = int(cls_ids[i])
                label = f"{model.names[cls]} ({confidence:.2f})"
                color = class_colors.get(model.names[cls], (255, 255, 255))
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                draw_text_with_background(frame, label, (x1, y1 - 10), font_scale=0.4, color=(255, 255, 255),
                                         bg_color=color, alpha=0.8, padding=4)

    # Add sideboard text
    sideboard_text: List[str] = [f"{cls}: {count}" for cls, count in class_counts.items()]
    sideboard_text.insert(0, "PPE Detection Results:")
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

    return {
        "class_counts": class_counts,
        "detailed_counts": detailed_counts,
        "annotated_image": frame
    }

if __name__ == "__main__":
    print(YOLO("Model/ibcm-ppe.pt").names)