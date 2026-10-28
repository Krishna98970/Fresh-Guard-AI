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
    names = {0: 'person', 1: 'cardboard'}

    def __init__(self):
        super().__init__()
        self.predict_kwargs = None

    def predict(self, **kwargs):
        self.predict_kwargs = kwargs
        boxes = type('Boxes', (), {
            'xyxy': torch.tensor([[1.0, 2.0, 10.0, 12.0], [3.0, 4.0, 8.0, 9.0]]),
            'conf': torch.tensor([0.9, 0.2]),
            'cls': torch.tensor([1, 1]),
        })()
        return [type('Result', (), {'boxes': boxes})()]


class LowConfidenceCardboardModel:
    names = {0: 'cardboard'}

    def predict(self, **kwargs):
        boxes = type('Boxes', (), {
            'xyxy': torch.tensor([[10.0, 20.0, 30.0, 40.0]]),
            'conf': torch.tensor([0.2]),
            'cls': torch.tensor([0]),
        })()
        return [type('Result', (), {'boxes': boxes})()]


class CocoModel:
    names = {0: 'person', 24: 'backpack', 73: 'book'}

    def predict(self, **kwargs):
        raise AssertionError('A checkpoint without a cardboard class must not be used for cardboard prediction')


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
        'class_id': 1,
        'label': 'cardboard',
        'confidence': 90.0,
        'x': 1.0,
        'y': 2.0,
        'width': 9.0,
        'height': 10.0,
    }]
    assert 'detection(s) at or above 50% confidence' in result['details']
    assert model_manager.cardboard_model.predict_kwargs == {
        'source': str(image_path),
        'classes': [1],
        'conf': 0.01,
        'iou': 0.45,
        'imgsz': 640,
        'device': 'cpu',
        'verbose': False,
    }

def test_cardboard_inspection_reports_low_confidence_checkpoint(tmp_path, monkeypatch):
    image_path = tmp_path / 'cardboard.png'
    Image.new('RGB', (32, 32), 'brown').save(image_path)
    monkeypatch.setattr(model_manager, 'cardboard_model', LowConfidenceCardboardModel())

    result = model2_service.predict(image_path)

    assert result['items'] == []
    assert result['condition'] == '0 detected object(s)'
    assert 'highest cardboard candidate scored 20.0%' in result['details']
    assert 'fine-tune the checkpoint' in result['details']


def test_generic_yolo_checkpoint_does_not_label_coco_objects_as_cardboard(tmp_path, monkeypatch):
    image_path = tmp_path / 'coco.png'
    Image.new('RGB', (32, 32), 'brown').save(image_path)
    monkeypatch.setattr(model_manager, 'cardboard_model', CocoModel())

    result = model2_service.predict(image_path)

    assert result['items'] == []
    assert result['condition'] == 'Cardboard class unavailable'
    assert 'general COCO model' in result['details']


def test_inspection_type_routes_to_only_its_model(tmp_path, monkeypatch):
    image_path = tmp_path / 'image.png'
    monkeypatch.setattr(inspection_service, 'predict_freshness', lambda _: {'model': 'produce'})
    monkeypatch.setattr(inspection_service, 'predict_defects', lambda _: {'model': 'cardboard'})

    assert inspection_service.inspect_image(image_path, 'single') == {'model': 'produce'}
    assert inspection_service.inspect_image(image_path, 'box') == {'model': 'cardboard'}
