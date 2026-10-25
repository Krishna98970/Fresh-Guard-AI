from pathlib import Path

from services.model1_service import predict as predict_freshness
from services.model2_service import predict as predict_defects


def inspect_image(image_path: Path, inspection_type: str = 'single') -> dict[str, object]:
    if inspection_type == 'single':
        return predict_freshness(image_path)
    if inspection_type == 'box':
        return predict_defects(image_path)
    raise ValueError(f'Unsupported inspection type: {inspection_type}')
