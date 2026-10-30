import pytest
from fastapi import HTTPException

from routes.workflow import (
    CustomerFeedbackInput,
    _require_role,
    _alert_role_filter,
    classify_transit_event,
    customer_tracking,
    recommend_packaging,
    serialize_order,
    submit_customer_feedback,
    validate_dispatch_eligibility,
)


def test_packaging_recommendation_separates_mixed_categories():
    recommendation = recommend_packaging({
        'items': [
            {'category': 'FRUITS'},
            {'category': 'VEGETABLES'},
        ],
    })

    assert recommendation['packaging_type'] == 'SEPARATED_CORRUGATED'
    assert recommendation['source'] == 'RULE_BASED'


def test_packaging_recommendation_uses_protective_tray_for_delicate_produce():
    recommendation = recommend_packaging({'items': [{'category': 'BERRIES'}]})

    assert recommendation['packaging_type'] == 'VENTILATED_CUSHIONED_TRAY'


def test_order_serialization_does_not_expose_customer_tracking_token():
    serialized = serialize_order({'order_id': 'order-1', 'tracking_id': 'secret-token'})

    assert serialized == {'order_id': 'order-1'}


def test_role_guard_rejects_unauthorized_user():
    with pytest.raises(HTTPException) as error:
        _require_role({'role': 'WAREHOUSE_EMPLOYEE'}, 'DISPATCH_MANAGER')

    assert error.value.status_code == 403


def test_dispatch_manager_can_manage_dispatches_but_not_warehouse_work():
    dispatch_user = {'role': 'DISPATCH_MANAGER'}

    _require_role(dispatch_user, 'ADMIN', 'DISPATCH_MANAGER')

    for permitted_roles in (
        ('ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER'),
        ('ADMIN', 'WAREHOUSE_EMPLOYEE', 'PACKING_OPERATOR'),
    ):
        with pytest.raises(HTTPException) as error:
            _require_role(dispatch_user, *permitted_roles)
        assert error.value.status_code == 403


def test_dispatch_manager_alert_scope_excludes_quality_alerts():
    assert _alert_role_filter({'role': 'DISPATCH_MANAGER'}) == {
        'category': {'$in': ['DELIVERY', 'TEMPERATURE', 'TRANSIT']},
    }
    assert _alert_role_filter({'role': 'ADMIN'}) == {}


@pytest.mark.parametrize(
    ('event_type', 'magnitude', 'expected'),
    [
        ('SHOCK', 0.4, 'INFO'),
        ('SHOCK', 1.0, 'WARNING'),
        ('SHOCK', 1.8, 'CRITICAL'),
        ('TILT', 50, 'CRITICAL'),
    ],
)
def test_transit_severity_comes_from_threshold_rules(event_type, magnitude, expected):
    assert classify_transit_event(event_type, magnitude) == expected


@pytest.mark.parametrize(
    ('order', 'expected_message'),
    [
        ({'inspection_decision': 'REJECT', 'packing_status': 'COMPLETED', 'dispatch_status': 'NOT_DISPATCHED'}, 'accepted'),
        ({'inspection_decision': 'ACCEPT', 'packing_status': 'IN_PROGRESS', 'dispatch_status': 'NOT_DISPATCHED'}, 'completed packing'),
        ({'inspection_decision': 'ACCEPT', 'packing_status': 'COMPLETED', 'dispatch_status': 'ASSIGNED'}, 'already dispatched'),
    ],
)
def test_dispatch_eligibility_rejects_orders_that_have_not_passed_all_gates(order, expected_message):
    with pytest.raises(HTTPException, match=expected_message) as error:
        validate_dispatch_eligibility(order)

    assert error.value.status_code == 409


def test_dispatch_eligibility_allows_authorized_review_after_complete_packing():
    validate_dispatch_eligibility({
        'inspection_decision': 'REJECT',
        'review_approved': True,
        'packing_status': 'COMPLETED',
        'dispatch_status': 'NOT_DISPATCHED',
    })


def test_customer_feedback_rejects_duplicate_submission():
    class Collection:
        def __init__(self, record):
            self.record = record

        def find_one(self, query):
            return self.record

    class Database:
        orders = Collection({'order_id': 'order-1', 'dispatch_status': 'DELIVERED'})
        customer_feedback = Collection({'order_id': 'order-1'})

    with pytest.raises(HTTPException, match='already been submitted') as error:
        submit_customer_feedback(
            CustomerFeedbackInput(tracking_id='private-token', rating=5),
            Database(),
        )

    assert error.value.status_code == 409


def test_customer_tracking_returns_only_safe_order_progress_fields():
    class Collection:
        def __init__(self, record=None):
            self.record = record

        def find_one(self, query, **kwargs):
            return self.record

    class Database:
        orders = Collection({
            'order_id': 'order-1',
            'order_number': 'FG-123',
            'tracking_id': 'private-token',
            'dispatch_status': 'NOT_DISPATCHED',
            'inspection_status': 'COMPLETED',
            'packing_status': 'PENDING',
            'customer_name': 'Customer',
            'customer_address': 'Private address',
            'customer_phone': 'Private phone',
        })
        dispatches = Collection()
        delivery_tracking = Collection()
        customer_feedback = Collection()

    projection = customer_tracking('private-token', Database())

    assert projection['inspection_status'] == 'COMPLETED'
    assert projection['packing_status'] == 'PENDING'
    assert 'customer_name' not in projection
    assert 'customer_address' not in projection
    assert 'customer_phone' not in projection
    assert 'tracking_id' not in projection
