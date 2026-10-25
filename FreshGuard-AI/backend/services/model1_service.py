import codecs
import io
import pickle
from pathlib import Path
from typing import Any
from zipfile import ZipFile

import numpy as np
import torch
from PIL import Image
from torch import Tensor, nn

from core.config import settings
from services.model_manager import model_manager


class _CheckpointUnpickler(pickle.Unpickler):
    def find_class(self, module: str, name: str) -> Any:
        if (module, name) == ('_codecs', 'encode'):
            return codecs.encode
        if (module, name) == ('numpy._core.multiarray', '_reconstruct'):
            return np._core.multiarray._reconstruct
        if (module, name) == ('numpy', 'ndarray'):
            return np.ndarray
        if (module, name) == ('numpy', 'dtype'):
            return np.dtype
        raise pickle.UnpicklingError(f'Unsupported checkpoint value: {module}.{name}')


class FruitFreshnessCNN(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(32, 64, kernel_size=3),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(64, 128, kernel_size=3),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Flatten(),
        )
        self.classifier = nn.Sequential(
            nn.Linear(86_528, 256),
            nn.ReLU(),
            nn.Linear(256, 6),
        )

    def forward(self, image: Tensor) -> Tensor:
        return self.classifier(self.features(image))

    def load_checkpoint(self, weights: list[np.ndarray]) -> None:
        expected_shapes = [
            (3, 3, 3, 32), (32,), (3, 3, 32, 64), (64,),
            (3, 3, 64, 128), (128,), (86_528, 256), (256,),
            (256, 6), (6,),
        ]
        if len(weights) != len(expected_shapes) or [weight.shape for weight in weights] != expected_shapes:
            raise ValueError('CNN checkpoint weight shapes do not match the configured architecture')

        tensors = [torch.from_numpy(weight.copy()) for weight in weights]
        converted = {
            'features.0.weight': tensors[0].permute(3, 2, 0, 1),
            'features.0.bias': tensors[1],
            'features.3.weight': tensors[2].permute(3, 2, 0, 1),
            'features.3.bias': tensors[3],
            'features.6.weight': tensors[4].permute(3, 2, 0, 1),
            'features.6.bias': tensors[5],
            'classifier.0.weight': tensors[6].reshape(26, 26, 128, 256).permute(3, 2, 0, 1).reshape(256, 86_528),
            'classifier.0.bias': tensors[7],
            'classifier.2.weight': tensors[8].transpose(0, 1),
            'classifier.2.bias': tensors[9],
        }
        self.load_state_dict(converted)


def load_fruit_checkpoint(path: Path) -> dict[str, Any]:
    with ZipFile(path) as archive:
        pickle_path = f'{path.stem}/data.pkl'
        if pickle_path not in archive.namelist():
            raise ValueError('Produce checkpoint is missing its data.pkl record')
        checkpoint = _CheckpointUnpickler(io.BytesIO(archive.read(pickle_path))).load()
    if not isinstance(checkpoint, dict):
        raise ValueError('Produce checkpoint must contain a dictionary')
    class_names = checkpoint.get('class_names')
    weights = checkpoint.get('state_dict')
    if (
        not isinstance(class_names, list)
        or len(class_names) != 6
        or not all(isinstance(name, str) for name in class_names)
        or not isinstance(weights, list)
        or not all(isinstance(weight, np.ndarray) for weight in weights)
    ):
        raise ValueError('Produce checkpoint is missing its class names or NumPy weights')
    return {'class_names': class_names, 'state_dict': weights}


def predict(image_path: Path) -> dict[str, object]:
    model = model_manager.produce_model
    if model is None:
        raise RuntimeError('Produce inspection model is not loaded')

    with Image.open(image_path) as image:
        resized = image.convert('RGB').resize((224, 224), Image.Resampling.BILINEAR)
        image_array = np.asarray(resized, dtype=np.float32) / 255.0
    input_tensor = torch.from_numpy(image_array).permute(2, 0, 1).unsqueeze(0)

    with torch.inference_mode():
        probabilities = torch.softmax(model(input_tensor)[0], dim=0)
    class_index = int(probabilities.argmax().item())
    class_name = model_manager.produce_classes[class_index]
    confidence = float(probabilities[class_index].item())
    product = class_name.removeprefix('fresh').removeprefix('rotten')
    condition = 'Fresh' if class_name.startswith('fresh') else 'Rotten'
    quality_score = confidence if condition == 'Fresh' else 1 - confidence
    decision = (
        'REVIEW' if confidence < settings.review_threshold
        else 'ACCEPT' if condition == 'Fresh' and confidence >= settings.accept_threshold
        else 'REJECT' if condition == 'Rotten'
        else 'REVIEW'
    )

    return {
        'product': product.title(),
        'condition': condition,
        'confidence': round(confidence * 100, 1),
        'quality_score': round(quality_score * 100),
        'grade': 'N/A',
        'decision': decision,
        'defects': [] if condition == 'Fresh' else ['Rotten produce detected by the classifier'],
        'details': f'Produce CNN classified this image as {class_name} with {confidence:.1%} confidence.',
    }
