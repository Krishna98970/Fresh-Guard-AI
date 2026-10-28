from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

import torch
from torch.nn import Module

from core.config import settings

if TYPE_CHECKING:
    from ultralytics import YOLO


class ModelManager:
    def __init__(self) -> None:
        self.produce_model: Module | None = None
        self.cardboard_model: YOLO | None = None
        self.produce_classes: list[str] = []
        self.status = {'produce_model': 'not_loaded', 'cardboard_model': 'not_loaded'}

    def load(self) -> None:
        from services.model1_service import FruitFreshnessCNN, load_fruit_checkpoint

        produce_path = Path(settings.produce_model_path).resolve()
        cardboard_path = Path(settings.cardboard_model_path).resolve()
        if not produce_path.is_file():
            raise FileNotFoundError(f'Produce model checkpoint not found: {produce_path}')
        if not cardboard_path.is_file():
            raise FileNotFoundError(f'Cardboard model checkpoint not found: {cardboard_path}')

        checkpoint = load_fruit_checkpoint(produce_path)
        produce_model = FruitFreshnessCNN()
        produce_model.load_checkpoint(checkpoint['state_dict'])
        produce_model.eval()

        try:
            from ultralytics import YOLO
        except ImportError as exc:
            raise ImportError(
                'Ultralytics is required for cardboard inference. Install backend requirements.'
            ) from exc

        cardboard_model = YOLO(str(cardboard_path), task='detect')

        self.produce_model = produce_model
        self.produce_classes = checkpoint['class_names']
        self.cardboard_model = cardboard_model
        cardboard_names = cardboard_model.names
        class_names = cardboard_names.values() if isinstance(cardboard_names, dict) else cardboard_names
        has_cardboard_class = any(
            name.strip().lower().replace('_', ' ').replace('-', ' ')
            in {'cardboard', 'cardboard box', 'cardboard carton', 'carton', 'corrugated box'}
            for name in class_names
        )
        self.status = {
            'produce_model': 'loaded',
            'cardboard_model': 'loaded' if has_cardboard_class else 'loaded_no_cardboard_class',
        }


model_manager = ModelManager()
