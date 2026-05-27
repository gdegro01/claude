#!/usr/bin/env python3
"""
Creates a YouTube playlist from the tracks found in the chat screenshots.
Uses YouTube Data API v3 with OAuth2.
"""

import os
import json
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
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
PLAYLIST_DESCRIPTION = "Rodrigue Gauthier, Nany, Deodato, MYEL, Laser, K.C. And The Internationals, Cito Jarvis, C. Thompson"

CREDENTIALS_FILE = Path(__file__).parent / "client_secret.json"
TOKEN_FILE = Path(__file__).parent / "token.json"


def get_credentials():
    creds = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_FILE.write_text(creds.to_json())
        return creds

    if not CREDENTIALS_FILE.exists():
        print("\n╔══════════════════════════════════════════════════════════════╗")
        print("║  client_secret.json niet gevonden!                          ║")
        print("║                                                              ║")
        print("║  Volg deze stappen:                                          ║")
        print("║  1. Ga naar https://console.cloud.google.com                 ║")
        print("║  2. Maak een project (of selecteer een bestaand)             ║")
        print("║  3. Zoek 'YouTube Data API v3' → Enable                      ║")
        print("║  4. Ga naar Credentials → Create Credentials → OAuth 2.0    ║")
        print("║  5. Kies 'Desktop app' als type                             ║")
        print("║  6. Download de JSON en sla op als:                          ║")
        print(f"║     {CREDENTIALS_FILE}  ║")
        print("║  7. Run dit script opnieuw                                   ║")
        print("╚══════════════════════════════════════════════════════════════╝\n")
        sys.exit(1)

    flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_FILE), SCOPES)

    print("\n→ Een browser-URL wordt geopend voor authenticatie.")
    print("  Als de redirect niet werkt (remote omgeving), kopieer de URL")
    print("  uit je adresbalk na het inloggen en plak die hieronder.\n")

    try:
        creds = flow.run_local_server(port=0, open_browser=False)
    except Exception:
        creds = flow.run_console()

    TOKEN_FILE.write_text(creds.to_json())
    return creds


def create_playlist(youtube):
    request = youtube.playlists().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": PLAYLIST_TITLE,
                "description": PLAYLIST_DESCRIPTION,
            },
            "status": {"privacyStatus": "private"},
        },
    )
    response = request.execute()
    playlist_id = response["id"]
    print(f"\n✓ Playlist aangemaakt: {PLAYLIST_TITLE}")
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
    creds = get_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    playlist_id = create_playlist(youtube)
    add_videos(youtube, playlist_id)

    print(f"\n✓ Klaar! Playlist: https://www.youtube.com/playlist?list={playlist_id}")
    print("  (Status: private — je kunt dit wijzigen op YouTube)")


if __name__ == "__main__":
    main()
