#!/usr/bin/env python3
import os
import requests
import re
from datetime import datetime

VIKUNJA_URL = os.environ.get("VIKUNJA_URL", "").rstrip("/")
VIKUNJA_TOKEN = os.environ.get("VIKUNJA_TOKEN", "")
PROJECT_ID = int(os.environ.get("VIKUNJA_PROJECT_ID", "18"))
VIEW_ID = int(os.environ.get("VIKUNJA_VIEW_ID", "69"))

def fmt_date(value):
    if not value or value.startswith("0001-"):
        return "-"
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except Exception:
        return value

def strip_html(text):
    if not text:
        return ""
    return re.sub(r'<[^>]+>', ' ', text).replace('&nbsp;', ' ').replace('&amp;', '&').strip()

def extract_tasks(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("tasks", "result", "items"):
            if key in data and isinstance(data[key], list):
                return data[key]
    raise RuntimeError(f"Respuesta inesperada: {type(data)} {data}")

def main():
    if not VIKUNJA_URL:
        print("ERROR: VIKUNJA_URL no configurada. Exporta VIKUNJA_URL en tu entorno.")
        return
    if not VIKUNJA_TOKEN:
        print("ERROR: VIKUNJA_TOKEN no configurado. Exporta VIKUNJA_TOKEN en tu entorno.")
        return

    headers = {
        "Authorization": f"Bearer {VIKUNJA_TOKEN}",
        "Accept": "application/json",
    }

    # El endpoint de vista ya filtra done=false, no enviar filter
    url = f"{VIKUNJA_URL}/api/v1/projects/{PROJECT_ID}/views/{VIEW_ID}/tasks"
    print(f"Conectando a: {url}")
    print(f"Project ID: {PROJECT_ID}, View ID: {VIEW_ID}")
    print()

    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()

    tasks = extract_tasks(response.json())

    print(f"Tareas pendientes recuperadas: {len(tasks)}")
    print("=" * 80)

    for i, task in enumerate(tasks, start=1):
        task_id = task.get("id", "-")
        identifier = task.get("identifier", "")
        title = task.get("title", "").strip()
        due_date = fmt_date(task.get("due_date"))
        priority = task.get("priority", 0)
        bucket_id = task.get("bucket_id", "-")
        description = strip_html(task.get("description", ""))
        attachments = task.get("attachments") or []

        print(f"{i:02d}. {identifier} | {title}")
        print(f"    vence: {due_date} | prioridad: {priority} | bucket: {bucket_id}")

        if description:
            print(f"    desc: {description[:150]}")
        if attachments:
            names = [a.get("file", {}).get("name", "?") for a in attachments]
            print(f"    adjuntos: {', '.join(names)}")
        print()

if __name__ == "__main__":
    main()
