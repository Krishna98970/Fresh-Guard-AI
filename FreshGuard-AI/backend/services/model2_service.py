from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch import Tensor

from services.model_manager import model_manager


def predict(image_path: Path) -> dict[str, object]:
    model = model_manager.cardboard_model
    if model is None:
        raise RuntimeError('Cardboard inspection model is not loaded')

    with Image.open(image_path) as image:
        image_array = np.asarray(image.convert('RGB'), dtype=np.float32) / 255.0
    image_tensor: Tensor = torch.from_numpy(image_array).permute(2, 0, 1)

    with torch.inference_mode():
        output = model([image_tensor])[0]

    detections = []
    for box, score, label in zip(output['boxes'], output['scores'], output['labels']):
        x1, y1, x2, y2 = (float(value) for value in box.tolist())
        class_id = int(label.item())
        detections.append({
            'class_id': class_id,
            'label': f'Class {class_id}',
            'confidence': round(float(score.item()) * 100, 1),
            'x': x1,
            'y': y1,
            'width': max(x2 - x1, 0.0),
            'height': max(y2 - y1, 0.0),
        })

    confidence = (
        round(sum(float(item['confidence']) for item in detections) / len(detections), 1)
        if detections else 0.0
    )
    return {
        'product': 'Cardboard',
        'condition': f'{len(detections)} detected object(s)',
        'confidence': confidence,
        'quality_score': round(confidence),
        'grade': 'N/A',
        'decision': 'REVIEW',
        'defects': [f"{item['label']} detected" for item in detections],
        'details': f'Cardboard object detector returned {len(detections)} detection(s).',
        'items': detections,
    }
