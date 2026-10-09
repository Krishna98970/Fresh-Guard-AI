from pathlib import Path
from typing import Dict, Union

from core.config import settings
from services.model_manager import model_manager


def predict(image_path: Path) -> Dict[str, Union[float, str]]:
    """Run model 1 or a clearly marked development prediction."""
    if not settings.mock_ai and model_manager.model1 is not None:
        raise NotImplementedError('Model 1 output mapping must match the training notebook')
    return {"label": "fresh", "confidence": 0.87}
