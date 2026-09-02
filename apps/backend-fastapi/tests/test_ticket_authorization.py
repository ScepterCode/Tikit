"""Authorization tests for the tickets router.

Guarantee under test: only the organizer of an event (or an admin) may validate
or burn a ticket for that event. Before this was enforced, any authenticated
user could mark anyone's ticket as used.
"""
import pytest

from routers import tickets


ORGANIZER = {"user_id": "org-1", "role": "organizer"}
OTHER_ORGANIZER = {"user_id": "org-2", "role": "organizer"}
ATTENDEE = {"user_id": "att-1", "role": "attendee"}
ADMIN = {"user_id": "admin-1", "role": "admin"}

EVENT = {"id": "evt-1", "title": "Test Event", "organizer_id": "org-1"}


@pytest.fixture
def event_lookup(monkeypatch):
    async def fake_get_event(event_id):
        return EVENT if event_id == "evt-1" else None

    monkeypatch.setattr(tickets.event_service, "get_event", fake_get_event)


@pytest.mark.asyncio
async def test_owning_organizer_is_allowed(event_lookup):
    event = await tickets._assert_event_organizer("evt-1", ORGANIZER)
    assert event["id"] == "evt-1"


@pytest.mark.asyncio
async def test_admin_is_allowed(event_lookup):
    event = await tickets._assert_event_organizer("evt-1", ADMIN)
    assert event["id"] == "evt-1"


@pytest.mark.asyncio
async def test_other_organizer_is_forbidden(event_lookup):
    with pytest.raises(tickets.HTTPException) as exc:
        await tickets._assert_event_organizer("evt-1", OTHER_ORGANIZER)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_attendee_is_forbidden(event_lookup):
    with pytest.raises(tickets.HTTPException) as exc:
        await tickets._assert_event_organizer("evt-1", ATTENDEE)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_unknown_event_is_404(event_lookup):
    with pytest.raises(tickets.HTTPException) as exc:
        await tickets._assert_event_organizer("evt-missing", ORGANIZER)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_missing_event_id_is_400(event_lookup):
    with pytest.raises(tickets.HTTPException) as exc:
        await tickets._assert_event_organizer(None, ORGANIZER)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_mark_used_rejects_non_organizer(event_lookup, monkeypatch):
    """End-to-end through the endpoint: the ticket must NOT be burned."""
    used = []

    async def fake_get_ticket(ticket_id):
        return {"id": ticket_id, "event_id": "evt-1", "status": "active"}

    async def fake_use_ticket(ticket_id):
        used.append(ticket_id)
        return True

    monkeypatch.setattr(tickets.ticket_service, "get_ticket", fake_get_ticket)
    monkeypatch.setattr(tickets.ticket_service, "use_ticket", fake_use_ticket)

    with pytest.raises(tickets.HTTPException) as exc:
        await tickets.mark_ticket_used("tkt-1", current_user=ATTENDEE)

    assert exc.value.status_code == 403
    assert used == [], "ticket must not be marked used by a non-organizer"


@pytest.mark.asyncio
async def test_mark_used_allows_owning_organizer(event_lookup, monkeypatch):
    used = []

    async def fake_get_ticket(ticket_id):
        return {"id": ticket_id, "event_id": "evt-1", "status": "active"}

    async def fake_use_ticket(ticket_id):
        used.append(ticket_id)
        return True

    monkeypatch.setattr(tickets.ticket_service, "get_ticket", fake_get_ticket)
    monkeypatch.setattr(tickets.ticket_service, "use_ticket", fake_use_ticket)

    result = await tickets.mark_ticket_used("tkt-1", current_user=ORGANIZER)
    assert result["success"] is True
    assert used == ["tkt-1"]
