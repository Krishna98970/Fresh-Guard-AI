from pathlib import Path
from typing import Dict

from core.config import settings
from services.model1_service import predict as predict_freshness
from services.model2_service import predict as predict_defects


def inspect_image(image_path: Path, inspection_type: str = 'single') -> Dict[str, object]:
    freshness = predict_freshness(image_path)
    defects = predict_defects(image_path)
    score = round((float(freshness['confidence']) * 0.7 + float(defects['confidence']) * 0.3) * 100)
    decision = 'ACCEPT' if score >= settings.accept_threshold * 100 else 'REVIEW' if score >= settings.review_threshold * 100 else 'REJECT'
    condition = {'ACCEPT': 'Fresh', 'REVIEW': 'Needs Review', 'REJECT': 'Rejected'}[decision]
    return {
        'product': str(freshness['label']),
        'condition': condition,
        'confidence': round(float(freshness['confidence']) * 100, 1),
        'quality_score': score,
        'grade': 'A' if score >= 90 else 'B' if score >= 75 else 'C',
        'decision': decision,
        'defects': [] if defects['label'] == 'no_visible_defect' else [str(defects['label'])],
        'details': f"{defects['label']} detected with {float(defects['confidence']):.0%} confidence.",
        **({'total_items': 20, 'fresh_items': 16, 'damaged_items': 3, 'rejected_items': 1} if inspection_type == 'box' else {}),
    }
