import torch
from PIL import Image
from torch import Tensor, nn

from services import model1_service, model2_service
from services import inspection_service
from services.model_manager import model_manager


class ProduceModel(nn.Module):
    def forward(self, image: Tensor) -> Tensor:
        return torch.tensor([[0.0, 4.0, 0.0, 0.0, 0.0, 0.0]])


class LowConfidenceProduceModel(nn.Module):
    def forward(self, image: Tensor) -> Tensor:
        return torch.zeros((1, 6))


class CardboardModel(nn.Module):
    def forward(self, images: list[Tensor]) -> list[dict[str, Tensor]]:
        return [{
            'boxes': torch.tensor([[1.0, 2.0, 10.0, 12.0]]),
            'scores': torch.tensor([0.9]),
            'labels': torch.tensor([2]),
        }]


def test_produce_inspection_uses_classifier_output(tmp_path, monkeypatch):
    image_path = tmp_path / 'produce.png'
    Image.new('RGB', (32, 32), 'green').save(image_path)
    monkeypatch.setattr(model_manager, 'produce_model', ProduceModel())
    monkeypatch.setattr(model_manager, 'produce_classes', [
        'freshapples', 'freshbanana', 'freshoranges', 'rottenapples', 'rottenbanana', 'rottenoranges',
    ])

    result = model1_service.predict(image_path)

    assert result['product'] == 'Banana'
    assert result['condition'] == 'Fresh'
    assert result['decision'] == 'ACCEPT'


def test_low_confidence_produce_inspection_requires_review(tmp_path, monkeypatch):
    image_path = tmp_path / 'produce.png'
    Image.new('RGB', (32, 32), 'green').save(image_path)
    monkeypatch.setattr(model_manager, 'produce_model', LowConfidenceProduceModel())
    monkeypatch.setattr(model_manager, 'produce_classes', [
        'freshapples', 'freshbanana', 'freshoranges', 'rottenapples', 'rottenbanana', 'rottenoranges',
    ])

    result = model1_service.predict(image_path)

    assert result['condition'] == 'Fresh'
    assert result['decision'] == 'REVIEW'


def test_cardboard_inspection_returns_detector_boxes(tmp_path, monkeypatch):
    image_path = tmp_path / 'cardboard.png'
    Image.new('RGB', (32, 32), 'brown').save(image_path)
    monkeypatch.setattr(model_manager, 'cardboard_model', CardboardModel())

    result = model2_service.predict(image_path)

    assert result['product'] == 'Cardboard'
    assert result['decision'] == 'REVIEW'
    assert result['items'] == [{
        'class_id': 2,
        'label': 'Class 2',
        'confidence': 90.0,
        'x': 1.0,
        'y': 2.0,
        'width': 9.0,
        'height': 10.0,
    }]


def test_inspection_type_routes_to_only_its_model(tmp_path, monkeypatch):
    image_path = tmp_path / 'image.png'
    monkeypatch.setattr(inspection_service, 'predict_freshness', lambda _: {'model': 'produce'})
    monkeypatch.setattr(inspection_service, 'predict_defects', lambda _: {'model': 'cardboard'})

    assert inspection_service.inspect_image(image_path, 'single') == {'model': 'produce'}
    assert inspection_service.inspect_image(image_path, 'box') == {'model': 'cardboard'}
