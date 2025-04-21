import json
import os

import torch
from dotenv import load_dotenv
from roboflow import Roboflow
from roboflow.core.dataset import Dataset
from roboflow.core.project import Project
from roboflow.core.version import Version
from ultralytics import YOLO

print('CUDA available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('GPU:', torch.cuda.get_device_name(0))
else:
    print('Training will use CPU. Consider enabling GPU for faster training.')

# Load or SET environment variables
load_dotenv()
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
MODEL_DIR = os.getenv("MODEL_DIR", "Model")
MODEL_BASENAME = os.getenv("MODEL_BASENAME", "ibcm-ppe")


class DataModel:
    def __init__(self, project_name, version_number, dataset_path, model_dir=MODEL_DIR, model_basename=MODEL_BASENAME,
                 model_weights="yolo11n.pt"):
        self.project_name = project_name
        self.version_number = version_number
        self.dataset_path = dataset_path

        os.makedirs(MODEL_DIR, exist_ok=True)
        self.model_dir = model_dir
        self.model_basename = model_basename
        self.model_weights = model_weights

        # Initialize YOLO model
        self.model = YOLO(self.model_weights)

    def export(self, *args, **kwargs):
        """
        Export the model to a different format suitable for deployment.

        This method facilitates the export of the model to various formats (e.g., ONNX, TorchScript) for deployment
        purposes. It uses the 'Exporter' class for the export process, combining model-specific overrides, method
        defaults, and any additional arguments provided.

        Args:
            **kwargs (Any): Arbitrary keyword arguments to customize the export process. These are combined with
                the model's overrides and method defaults. Common arguments include:
                format (str): Export format (e.g., 'onnx', 'engine', 'coreml').
                half (bool): Export model in half-precision.
                int8 (bool): Export model in int8 precision.
                device (str): Device to run the export on.
                workspace (int): Maximum memory workspace size for TensorRT engines.
                nms (bool): Add Non-Maximum Suppression (NMS) module to model.
                simplify (bool): Simplify ONNX model.

        Returns:
            (str): The path to the exported model file.

        Raises:
            AssertionError: If the model is not a PyTorch model.
            ValueError: If an unsupported export format is specified.
            RuntimeError: If the export process fails due to errors.

        Examples:
            >>> model = YOLO("yolo11n.pt")
            >>> model.export(format="onnx", dynamic=True, simplify=True)
            'path/to/exported/model.onnx'
        """
        return self.model.export(*args, **kwargs)

    @property
    def model_path(self):
        return os.path.join(self.model_dir, f"{self.model_basename}.pt")

    @property
    def metadata_path(self):
        return os.path.join(self.model_dir, f"{self.model_basename}.json")

    @property
    def onnx_path(self):
        return os.path.join(self.model_dir, f"{self.model_basename}.onnx")

    def get_details(self):
        return {
            "project_name": self.project_name,
            "version_number": self.version_number,
            "dataset_path": self.dataset_path,
            "model_dir": self.model_dir,
            "model_basename": self.model_basename,
            "model_weights": self.model_weights,
        }

    def train(self, trainer=None, **kwargs):
        """
        Train the YOLO model using the provided dataset and dynamic parameters.

        Args:
            trainer (BaseTrainer | None): Custom trainer instance for model training. If None, uses default.
            **kwargs: Arbitrary keyword arguments for training configuration. Common options include:
                data (str): Path to dataset configuration file.
                epochs (int): Number of training epochs.
                batch_size (int): Batch size for training.
                imgsz (int): Input image size.
                device (str): Device to run training on (e.g., 'cuda', 'cpu').
                workers (int): Number of worker threads for data loading.
                optimizer (str): Optimizer to use for training.
                lr0 (float): Initial learning rate.
                patience (int): Epochs to wait for no observable improvement for early stopping of training.

        Returns:
            (Dict | None): Training metrics if available and training is successful; otherwise, None.
        """
        data_yaml = os.path.join(self.dataset_path, "data.yaml")
        kwargs["data"] = data_yaml  # Ensure the dataset path is included
        metrics = self.model.train(trainer=trainer, **kwargs)
        print("Training complete.")
        return metrics

    def save(self, save_model: bool = True, save_metadata: bool = True, save_to: str = None):
        """
        Save the trained model and/or metadata.

        Args:
            save_model (bool): Whether to save the model weights.
            save_metadata (bool): Whether to save the metadata.
            save_to (str): Directory to save the files. Defaults to self.model_dir.
        """
        save_to = save_to or self.model_dir

        if save_model:
            model_path = os.path.join(save_to, f"{self.model_basename}.pt")
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            self.model.save(model_path)
            print(f"Model saved to {model_path}.")

        if save_metadata:
            metadata_path = os.path.join(save_to, f"{self.model_basename}.json")
            os.makedirs(os.path.dirname(metadata_path), exist_ok=True)
            with open(metadata_path, "w", encoding="utf-8") as f:
                json.dump(self.get_details(), f)
            print(f"Metadata saved to {metadata_path}.")


def main() -> None:
    # Acknowledge dataset source for compliance with CC BY 4.0 license
    # Dataset: Construction Site Safety by Roboflow Universe Projects
    # URL: https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety
    # License: CC BY 4.0
    rf: Roboflow = Roboflow(api_key=ROBOFLOW_API_KEY)
    project: Project = rf.workspace("roboflow-universe-projects").project("construction-site-safety")
    version: Version = project.version(27)
    dataset: Dataset = version.download("yolo11")

    data_model = DataModel(
        project_name=project.name,
        version_number=version.version,
        dataset_path=dataset.location,
        model_dir=MODEL_DIR,
        model_basename=MODEL_BASENAME,
        model_weights="yolo11n.pt",  # YOLO11 nano model for minimum latency
    )

    print("Dataset details:", data_model.get_details())
    print("Dataset path:", data_model.dataset_path)
    print("Model path:", data_model.model_path)
    print("Metadata path:", data_model.metadata_path)
    print("ONNX path:", data_model.onnx_path)

    train_params = {
        "epochs": 100,  # Reduce epochs for faster training
        "device": 'cuda' if torch.cuda.is_available() else 'cpu',  # Use GPU for faster training
        "imgsz": 640,  # Lower image size for faster training and less VRAM usage
        "workers": 8,  # Increase number of data loader workers for faster data loading
        "batch": 16,  # Try 24, reduce if you get out-of-memory errors
        "optimizer": "AdamW",  # Use AdamW optimizer for better convergence
        # "lr0": 0.001,  # Set an appropriate learning rate
        "augment": True,  # Enable data augmentation
        # "amp": torch.cuda.is_available(),  # Enable mixed precision for faster training and less memory usage
    }

    # Train and export the model using the modular method
    data_model.train(**train_params)

    data_model.save(save_to=MODEL_DIR)
    data_model.export(export_format="onnx", optimize=True, dynamic=True, simplify=True)


if __name__ == "__main__":
    main()
