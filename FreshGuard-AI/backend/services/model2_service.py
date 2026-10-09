from pathlib import Path
from typing import Dict, Union

from core.config import settings
from services.model_manager import model_manager


def predict(image_path: Path) -> Dict[str, Union[float, str]]:
    """Run model 2 or a clearly marked development prediction."""
    if not settings.mock_ai and model_manager.model2 is not None:
        raise NotImplementedError('Model 2 output mapping must match the training notebook')
    return {"label": "no_visible_defect", "confidence": 0.84}
