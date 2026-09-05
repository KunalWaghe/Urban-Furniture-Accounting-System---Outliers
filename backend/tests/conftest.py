"""
Pytest configuration and global fixtures for backend test suites.
"""

import pytest
from app.main import app
from app.core.deps import get_current_user
from app.models.user import User


@pytest.fixture(autouse=True)
def default_auth_override(request):
    """
    Automatically provide an authenticated admin user dependency override
    for all integration/unit tests, except for test_auth where real JWT tokens
    and unauthenticated/role validation are explicitly asserted.
    """
    if "test_auth" in request.node.nodeid or "test_rbac" in request.node.nodeid:
        # Never override auth dependencies during auth testing
        app.dependency_overrides.pop(get_current_user, None)
        yield
        app.dependency_overrides.pop(get_current_user, None)
    else:
        # Inject standard admin test principal into FastAPI dependency resolution
        admin_principal = User(
            id=9999,
            login_id="admin_test",
            email="admin_test@urbanfurniture.com",
            name="Test Admin User",
            role="admin",
            is_active=True,
        )
        app.dependency_overrides[get_current_user] = lambda: admin_principal
        yield
        app.dependency_overrides.pop(get_current_user, None)
