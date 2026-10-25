from pathlib import Path

import torch
from torch.nn import Module

from core.config import settings


class ModelManager:
    def __init__(self) -> None:
        self.produce_model: Module | None = None
        self.cardboard_model: Module | None = None
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

        cardboard_model = torch.load(cardboard_path, map_location='cpu', weights_only=False)
        if not isinstance(cardboard_model, Module):
            raise TypeError('Cardboard checkpoint must contain a torchvision detector model')
        cardboard_model.eval()

        self.produce_model = produce_model
        self.produce_classes = checkpoint['class_names']
        self.cardboard_model = cardboard_model
        self.status = {'produce_model': 'loaded', 'cardboard_model': 'loaded'}


model_manager = ModelManager()
