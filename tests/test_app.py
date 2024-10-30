import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_home_page(client):
    rv = client.get('/')
    assert rv.status_code == 200

def test_send_message(client):
    rv = client.post('/send_message', json={
        'message': 'Hello'
    })
    assert rv.status_code == 200
    assert 'response' in rv.get_json()

def test_empty_message(client):
    rv = client.post('/send_message', json={
        'message': ''
    })
    assert rv.status_code == 400