import pytest
from pydantic import ValidationError

from app.schemas.meeting import ActionItem, MeetingAnalysis


def test_valid_meeting_analysis():
    analysis = MeetingAnalysis(
        title="Sprint Planning",
        executive_summary="The team planned the next sprint and assigned tasks.",
        key_points=["Reviewed backlog"],
        decisions=["Sprint length stays at 2 weeks"],
        action_items=[
            {"task": "Update roadmap", "assignee": "Priya", "deadline": "Friday", "priority": "high"}
        ],
    )
    assert analysis.action_items[0].assignee == "Priya"


def test_action_item_missing_assignee_becomes_none():
    item = ActionItem(task="Do the thing", assignee="unknown", deadline=None, priority="low")
    assert item.assignee is None


def test_action_item_missing_deadline_becomes_none():
    item = ActionItem(task="Do the thing", assignee="Sam", deadline="", priority="medium")
    assert item.deadline is None


def test_action_item_invalid_priority_raises():
    with pytest.raises(ValidationError):
        ActionItem(task="Do the thing", assignee=None, deadline=None, priority="urgent!!")


def test_action_item_defaults_priority_to_medium():
    item = ActionItem(task="Do the thing")
    assert item.priority == "medium"


def test_meeting_analysis_defaults_empty_lists():
    analysis = MeetingAnalysis(title="Quick Sync", executive_summary="Brief check-in.")
    assert analysis.key_points == []
    assert analysis.decisions == []
    assert analysis.action_items == []
