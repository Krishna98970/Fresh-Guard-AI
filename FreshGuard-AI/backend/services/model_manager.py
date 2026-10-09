from pathlib import Path
from typing import Any

from core.config import settings


class ModelManager:
    def __init__(self) -> None:
        self.model1: Any = None
        self.model2: Any = None
        self.status = {'model1': 'mock', 'model2': 'mock'}

    def load(self) -> None:
        if settings.mock_ai:
            return
        try:
            from tensorflow import keras
            self.model1 = keras.models.load_model(Path(settings.model1_path))
            self.model2 = keras.models.load_model(Path(settings.model2_path))
            self.status = {'model1': 'loaded', 'model2': 'loaded'}
        except Exception as exc:
            raise RuntimeError(f'Unable to load AI models: {exc}') from exc


model_manager = ModelManager()
