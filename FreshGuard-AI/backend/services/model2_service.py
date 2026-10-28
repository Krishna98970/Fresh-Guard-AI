from pathlib import Path

import numpy as np

from services.model_manager import model_manager

MIN_DETECTION_CONFIDENCE = 0.5
MODEL_CONFIDENCE_FLOOR = 0.01
CARDBOARD_CLASS_NAMES = {
    'cardboard',
    'cardboard box',
    'cardboard carton',
    'carton',
    'corrugated box',
}


def predict(image_path: Path) -> dict[str, object]:
    model = model_manager.cardboard_model
    if model is None:
        raise RuntimeError('Cardboard inspection model is not loaded')

    class_names = model.names
    names_by_id = (
        class_names
        if isinstance(class_names, dict)
        else dict(enumerate(class_names))
    )
    cardboard_class_ids = {
        int(class_id)
        for class_id, name in names_by_id.items()
        if str(name).strip().lower().replace('_', ' ').replace('-', ' ')
        in CARDBOARD_CLASS_NAMES
    }

    if not cardboard_class_ids:
        return {
            'product': 'Cardboard',
            'condition': 'Cardboard class unavailable',
            'confidence': 0.0,
            'quality_score': 0,
            'grade': 'N/A',
            'decision': 'REVIEW',
            'defects': [],
            'details': (
                'The loaded YOLO checkpoint has no cardboard class. '
                'The supplied yolov8n.pt is a general COCO model; fine-tune it '
                'with labeled cardboard images to enable cardboard detection.'
            ),
            'items': [],
        }

    output = model.predict(
        source=str(image_path),
        classes=sorted(cardboard_class_ids),
        conf=MODEL_CONFIDENCE_FLOOR,
        iou=0.45,
        imgsz=640,
        device='cpu',
        verbose=False,
    )[0]

    detections = []
    boxes = output.boxes
    candidate_scores = [] if boxes is None else boxes.conf.tolist()
    if boxes is not None:
        for box, score, label in zip(boxes.xyxy.tolist(), candidate_scores, boxes.cls.tolist()):
            score_value = float(score)
            class_id = int(label)
            if class_id not in cardboard_class_ids or score_value < MIN_DETECTION_CONFIDENCE:
                continue
            x1, y1, x2, y2 = (float(value) for value in box)
            detections.append({
                'class_id': class_id,
                'label': str(names_by_id[class_id]),
                'confidence': round(score_value * 100, 1),
                'x': x1,
                'y': y1,
                'width': max(x2 - x1, 0.0),
                'height': max(y2 - y1, 0.0),
            })

    if detections:
        details = (
            f'Cardboard detector returned {len(detections)} detection(s) at or above '
            f'{MIN_DETECTION_CONFIDENCE:.0%} confidence.'
        )
    else:
        best_confidence = max(candidate_scores, default=0.0)
        details = (
            f'No cardboard detections met the {MIN_DETECTION_CONFIDENCE:.0%} confidence threshold. '
            f'The highest cardboard candidate scored {best_confidence:.1%}. '
            'If this image clearly shows a cardboard box, fine-tune the checkpoint on labeled cardboard images.'
        )

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
        'details': details,
        'items': detections,
    }
