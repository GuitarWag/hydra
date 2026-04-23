from __future__ import annotations

import pytest

from json_repair import JSONExtractionError, extract_json


class TestCleanJSON:
    def test_plain_json(self):
        assert extract_json('{"subtopics": ["a", "b"]}') == {"subtopics": ["a", "b"]}

    def test_nested_objects(self):
        raw = '{"a": {"b": [1, 2, 3]}}'
        assert extract_json(raw) == {"a": {"b": [1, 2, 3]}}

    def test_empty_object(self):
        assert extract_json("{}") == {}


class TestCodeFenceStripping:
    def test_json_fence(self):
        text = '```json\n{"subtopics": ["x"]}\n```'
        assert extract_json(text) == {"subtopics": ["x"]}

    def test_bare_fence(self):
        text = '```\n{"key": "value"}\n```'
        assert extract_json(text) == {"key": "value"}

    def test_fence_with_surrounding_text(self):
        text = 'Here is the result:\n```json\n{"a": 1}\n```\nDone.'
        assert extract_json(text) == {"a": 1}


class TestBraceExtraction:
    def test_leading_text(self):
        text = 'Sure, here you go: {"subtopics": ["a"]}'
        assert extract_json(text) == {"subtopics": ["a"]}

    def test_trailing_text(self):
        text = '{"subtopics": ["a"]} Hope that helps!'
        assert extract_json(text) == {"subtopics": ["a"]}

    def test_both_surrounding_text(self):
        text = 'Result:\n{"k": "v"}\nEnd'
        assert extract_json(text) == {"k": "v"}


class TestTrailingCommaRepair:
    def test_trailing_comma_in_object(self):
        text = '{"subtopics": ["a", "b",]}'
        assert extract_json(text) == {"subtopics": ["a", "b"]}

    def test_trailing_comma_in_array(self):
        text = '{"items": [1, 2, 3,]}'
        assert extract_json(text) == {"items": [1, 2, 3]}

    def test_trailing_comma_before_closing_brace(self):
        text = '{"a": 1, "b": 2,}'
        assert extract_json(text) == {"a": 1, "b": 2}

    def test_multiple_trailing_commas(self):
        text = '{"a": [1, 2,], "b": [3,],}'
        assert extract_json(text) == {"a": [1, 2], "b": [3]}


class TestSingleQuoteRepair:
    def test_single_quoted_keys_and_values(self):
        text = "{'subtopics': ['alpha', 'beta']}"
        assert extract_json(text) == {"subtopics": ["alpha", "beta"]}

    def test_mixed_quotes(self):
        text = """{'key': "value"}"""
        assert extract_json(text) == {"key": "value"}


class TestCombinedRepairs:
    def test_single_quotes_and_trailing_comma(self):
        text = "{'subtopics': ['a', 'b',],}"
        assert extract_json(text) == {"subtopics": ["a", "b"]}

    def test_code_fence_with_trailing_comma(self):
        text = '```json\n{"items": [1, 2,]}\n```'
        assert extract_json(text) == {"items": [1, 2]}

    def test_surrounding_text_with_repairs(self):
        text = "Here: {'a': [1,]} done"
        assert extract_json(text) == {"a": [1]}


class TestErrorHandling:
    def test_no_braces(self):
        with pytest.raises(JSONExtractionError, match="No JSON object found"):
            extract_json("just some text with no json")

    def test_only_opening_brace(self):
        with pytest.raises(JSONExtractionError, match="No JSON object found"):
            extract_json("{ broken")

    def test_empty_string(self):
        with pytest.raises(JSONExtractionError, match="No JSON object found"):
            extract_json("")

    def test_unparseable_after_repairs(self):
        with pytest.raises(JSONExtractionError, match="Failed to parse JSON after repairs"):
            extract_json("{not: valid: json: at: all}")

    def test_error_includes_original_text_snippet(self):
        original = "{broken content here}" + "x" * 300
        with pytest.raises(JSONExtractionError) as exc_info:
            extract_json(original)
        assert "broken content" in str(exc_info.value)


class TestEdgeCases:
    def test_whitespace_around_json(self):
        text = '   \n  {"a": 1}  \n  '
        assert extract_json(text) == {"a": 1}

    def test_nested_braces(self):
        text = '{"outer": {"inner": {"deep": true}}}'
        assert extract_json(text) == {"outer": {"inner": {"deep": True}}}

    def test_escaped_quotes_in_values(self):
        text = r'{"msg": "he said \"hello\""}'
        assert extract_json(text) == {"msg": 'he said "hello"'}

    def test_unicode_values(self):
        text = '{"topic": "Qu\\u00e9bec"}'
        assert extract_json(text) == {"topic": "Québec"}

    def test_numbers_and_booleans(self):
        text = '{"count": 42, "active": true, "ratio": 3.14, "empty": null}'
        assert extract_json(text) == {"count": 42, "active": True, "ratio": 3.14, "empty": None}

    def test_realistic_llm_response(self):
        text = (
            "Sure! Here are the subtopics:\n\n"
            "```json\n"
            '{"subtopics": ["How does X work?", "What are the implications of Y?",]}\n'
            "```\n\n"
            "Let me know if you need more detail."
        )
        result = extract_json(text)
        assert result == {
            "subtopics": ["How does X work?", "What are the implications of Y?"]
        }
