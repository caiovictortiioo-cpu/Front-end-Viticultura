import pytest
from pydantic import ValidationError

from app.config import Settings


def test_field_mapping_is_configurable_and_limited_to_thingSpeak_fields():
    settings = Settings(thingspeak_field_map={"temperature": "field3", "soilHumidity": "field8"})
    assert settings.thingspeak_field_map == {"temperature": "field3", "soilHumidity": "field8"}


def test_rejects_invalid_channel_id_and_wildcard_origin_is_not_defaulted():
    with pytest.raises(ValidationError):
        Settings(thingspeak_channel_id="123/../../admin")
    assert "*" not in Settings().configured_origins


def test_internal_key_must_be_long_enough_to_enable_service_to_service_ingestion():
    assert Settings(internal_api_key="short").internal_key_configured is False
    assert Settings(internal_api_key="x" * 32).internal_key_configured is True
