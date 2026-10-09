from flask import jsonify


def result_response(result: dict[str, object]):
    return jsonify(result), 200


def error_response(message: str, status: int):
    return jsonify({"error": message}), status
