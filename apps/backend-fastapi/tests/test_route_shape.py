"""Guards on the shape of the mounted route table.

The notifications and analytics routers each declared their own prefix AND
received one from main.py, so every one of their routes was served at
/api/notifications/notifications/... and /api/analytics/api/analytics/...
Both features were 404 for their whole existence. These tests make that class
of mistake fail in CI instead of in production.
"""
import main


def _paths():
    return sorted({r.path for r in main.app.routes if getattr(r, "path", "").startswith("/api")})


def test_no_route_repeats_a_path_segment():
    offenders = []
    for path in _paths():
        segs = [s for s in path.split("/") if s]
        if any(a == b for a, b in zip(segs, segs[1:])):
            offenders.append(path)
    assert not offenders, f"double-prefixed routes: {offenders}"


def test_api_appears_once_per_path():
    offenders = [p for p in _paths() if [s for s in p.split("/") if s].count("api") > 1]
    assert not offenders, f"routes with a duplicated /api segment: {offenders}"


def test_notification_routes_are_where_the_frontend_looks():
    paths = set(_paths())
    for expected in (
        "/api/notifications/",
        "/api/notifications/unread-count",
        "/api/notifications/mark-all-read",
        "/api/notifications/broadcast",
        "/api/notifications/{notification_id}/read",
    ):
        assert expected in paths, f"missing {expected}"


def test_analytics_routes_are_where_the_frontend_looks():
    paths = set(_paths())
    for expected in (
        "/api/analytics/platform",
        "/api/analytics/secret-event/{event_id}",
        "/api/analytics/membership-trends",
    ):
        assert expected in paths, f"missing {expected}"
