import io


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_rejects_unsupported_extension(client):
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_rejects_empty_file(client):
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("meeting.mp3", io.BytesIO(b""), "audio/mpeg")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_accepts_valid_audio_and_returns_pending(client):
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("meeting.mp3", io.BytesIO(b"fake-audio-bytes"), "audio/mpeg")},
    )
    assert response.status_code == 202
    body = response.json()
    assert body["status"] in {"pending", "transcribing", "analyzing", "failed"}
    assert body["meeting_id"]


def test_get_missing_meeting_returns_404(client):
    response = client.get("/api/meetings/does-not-exist")
    assert response.status_code == 404


def test_status_missing_meeting_returns_404(client):
    response = client.get("/api/meetings/does-not-exist/status")
    assert response.status_code == 404


def test_delete_missing_meeting_returns_404(client):
    response = client.delete("/api/meetings/does-not-exist")
    assert response.status_code == 404


def test_list_meetings_empty(client):
    response = client.get("/api/meetings")
    assert response.status_code == 200
    assert response.json() == []


def test_upload_and_delete_flow(client):
    upload = client.post(
        "/api/meetings/upload",
        files={"file": ("meeting.wav", io.BytesIO(b"fake-audio-bytes"), "audio/wav")},
    )
    meeting_id = upload.json()["meeting_id"]

    get_response = client.get(f"/api/meetings/{meeting_id}")
    assert get_response.status_code == 200

    delete_response = client.delete(f"/api/meetings/{meeting_id}")
    assert delete_response.status_code == 204

    get_after_delete = client.get(f"/api/meetings/{meeting_id}")
    assert get_after_delete.status_code == 404
