#!/usr/bin/env python3
"""
Creates a YouTube playlist from the tracks found in the chat screenshots.
Uses YouTube Data API v3 with OAuth2.

Works in remote/headless environments: prints an auth URL, you log in
via your browser, then paste the redirect URL back here.
"""

import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs

os.environ.setdefault("HTTPLIB2_CA_CERTS", "/etc/ssl/certs/ca-certificates.crt")

import httplib2
httplib2.CA_CERTS = "/etc/ssl/certs/ca-certificates.crt"

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/youtube"]

TRACKS = [
    ("BT7zSzinx_c", "Rodrigue Gauthier - Ti Moune Ale Kile"),
    ("VGFuHf4p8wk", "Rodrigue Gauthier - Bon Conseille"),
    ("6ivw5rLuvMs", "Nany - Zeca"),
    ("W4SpitjCaEs", "Deodato - Spanish Boogie"),
    ("6CJ2XOcCnzw", "MYEL - Nataly"),
    ("R93fzgndFWE", "MYEL - Zanmi"),
    ("eu3C__i7sqk", "K.C. And The Internationals - Soca Music"),
    ("ju65dBzIT_c", "Cito Jarvis - Born Again (JOSH FB Edit)"),
    ("0uN0pSMFZ84", "C. Thompson - You Make It Heaven"),
]

PLAYLIST_TITLE = "Chat Discoveries - Antilles / Afro / Boogie / Soca"
PLAYLIST_DESCRIPTION = (
    "Rodrigue Gauthier, Nany, Deodato, MYEL, Laser, "
    "K.C. And The Internationals, Cito Jarvis, C. Thompson"
)

CREDENTIALS_FILE = Path(__file__).parent / "client_secret.json"
TOKEN_FILE = Path(__file__).parent / "token.json"
FLOW_STATE_FILE = Path(__file__).parent / ".oauth_flow_state.json"

def get_credentials():
    creds = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        print("→ Token verlopen, wordt ververst...")
        creds.refresh(Request())
        TOKEN_FILE.write_text(creds.to_json())
        return creds

    if not CREDENTIALS_FILE.exists():
        print("✗ client_secret.json niet gevonden!")
        print("  Download je OAuth credentials van Google Cloud Console")
        print(f"  en sla op als: {CREDENTIALS_FILE}")
        sys.exit(1)

    redirect_uri = "http://localhost:8085/"

    if len(sys.argv) > 1:
        callback_url = sys.argv[1].strip()
        if not FLOW_STATE_FILE.exists():
            print("✗ Geen opgeslagen flow state gevonden. Run eerst zonder argument.")
            sys.exit(1)

        state = json.loads(FLOW_STATE_FILE.read_text())
        flow = InstalledAppFlow.from_client_secrets_file(
            str(CREDENTIALS_FILE), SCOPES, redirect_uri=redirect_uri
        )
        flow.code_verifier = state["code_verifier"]

        parsed = urlparse(callback_url)
        code = parse_qs(parsed.query).get("code")
        if not code:
            print("\n✗ Geen authorization code gevonden in de URL.")
            print("  Zorg dat je de volledige URL plakt inclusief ?code=...")
            sys.exit(1)

        flow.fetch_token(code=code[0])
        creds = flow.credentials
        TOKEN_FILE.write_text(creds.to_json())
        FLOW_STATE_FILE.unlink(missing_ok=True)
        print("✓ Authenticatie gelukt! Token opgeslagen.\n")
        return creds

    flow = InstalledAppFlow.from_client_secrets_file(
        str(CREDENTIALS_FILE), SCOPES, redirect_uri=redirect_uri
    )

    auth_url, state = flow.authorization_url(
        access_type="offline", prompt="consent"
    )

    FLOW_STATE_FILE.write_text(json.dumps({
        "code_verifier": flow.code_verifier,
        "state": state,
    }))

    print("\n╔═══════════════════════════════════════════════════════╗")
    print("║  STAP 1: Open deze URL in je browser:                ║")
    print("╚═══════════════════════════════════════════════════════╝")
    print(f"\n{auth_url}\n")
    print("╔═══════════════════════════════════════════════════════╗")
    print("║  STAP 2: Log in en geef toestemming.                 ║")
    print("║  Je wordt doorgestuurd naar een pagina die NIET      ║")
    print("║  laadt (localhost:8085). Dat is normaal!              ║")
    print("║  Kopieer de VOLLEDIGE URL uit je adresbalk en geef   ║")
    print("║  die aan mij terug.                                   ║")
    print("╚═══════════════════════════════════════════════════════╝\n")
    sys.exit(0)


def create_playlist(youtube):
    response = youtube.playlists().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": PLAYLIST_TITLE,
                "description": PLAYLIST_DESCRIPTION,
            },
            "status": {"privacyStatus": "private"},
        },
    ).execute()

    playlist_id = response["id"]
    print(f"✓ Playlist aangemaakt: {PLAYLIST_TITLE}")
    print(f"  https://www.youtube.com/playlist?list={playlist_id}\n")
    return playlist_id


def add_videos(youtube, playlist_id):
    for i, (video_id, title) in enumerate(TRACKS, 1):
        try:
            youtube.playlistItems().insert(
                part="snippet",
                body={
                    "snippet": {
                        "playlistId": playlist_id,
                        "resourceId": {
                            "kind": "youtube#video",
                            "videoId": video_id,
                        },
                        "position": i - 1,
                    }
                },
            ).execute()
            print(f"  [{i}/{len(TRACKS)}] ✓ {title}")
        except Exception as e:
            print(f"  [{i}/{len(TRACKS)}] ✗ {title} — {e}")


def main():
    print("\n🎵 YouTube Playlist Creator\n")

    creds = get_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    playlist_id = create_playlist(youtube)
    add_videos(youtube, playlist_id)

    url = f"https://www.youtube.com/playlist?list={playlist_id}"
    print(f"\n✓ Klaar! Playlist: {url}")
    print("  (Status: private — je kunt dit wijzigen op YouTube)\n")


if __name__ == "__main__":
    main()
