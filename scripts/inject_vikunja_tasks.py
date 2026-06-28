#!/usr/bin/env python3
"""
Inyecta tareas de Vikunja en la página de tareas de un día específico
del PDF de Recalendar existente. Overlay transparente (sin fondo blanco).
"""
import os
import sys
import json
import re
import requests
from datetime import datetime
from io import BytesIO
import pikepdf
from reportlab.lib.colors import HexColor, black
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Layout constants (from pdf_server.py) ──
PW, PH = 447.292, 596.389
NAV_MARGIN_L = 20
NAV_BTN_W = 50
NAV_BTN_H = 16
NAV_SPACING = 6
TN_BTN_Y = 538.39
TASK_TOP = 516.39
TASK_LEFT = 20
TASK_RIGHT = 427.292
TASK_ROW_H = 22
TASK_CB_SIZE = 9
GRID_BOTTOM = 30

# ── Vikunja config ──
VIKUNJA_URL = os.environ.get("VIKUNJA_URL", "").rstrip("/")
VIKUNJA_TOKEN = os.environ.get("VIKUNJA_TOKEN", "")
PROJECT_ID = int(os.environ.get("VIKUNJA_PROJECT_ID", "18"))
VIEW_ID = int(os.environ.get("VIKUNJA_VIEW_ID", "69"))
RMAPI_HOST = os.environ.get("RMAPI_HOST", "http://localhost:9000")
FONT_DIR = os.environ.get("FONT_DIR", "./fonts")

# ── Days of week / months in Spanish ──
DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
         "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

# ── Font setup ──
def setup_fonts():
    try:
        pdfmetrics.registerFont(TTFont("Lato-Bold", os.path.join(FONT_DIR, "Lato-Bold.ttf")))
    except Exception:
        pdfmetrics.registerFont(TTFont("Lato-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))


def strip_html(text):
    if not text:
        return ""
    return re.sub(r'<[^>]+>', ' ', text).replace('&nbsp;', ' ').replace('&amp;', '&').strip()


def fetch_vikunja_tasks():
    """Obtiene tareas pendientes de Vikunja."""
    headers = {
        "Authorization": f"Bearer {VIKUNJA_TOKEN}",
        "Accept": "application/json",
    }
    url = f"{VIKUNJA_URL}/api/v1/projects/{PROJECT_ID}/views/{VIEW_ID}/tasks"
    print(f"[Vikunja] Obteniendo tareas de: {url}")
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()
    data = response.json()
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("tasks", "result", "items"):
            if key in data and isinstance(data[key], list):
                return data[key]
    return []


def render_task_text_overlay(tasks):
    """Genera overlay transparente con texto de tareas centrado en el checkbox."""
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(PW, PH))

    y = TN_BTN_Y - TASK_ROW_H  # Start at first task row
    task_idx = 0

    while y > GRID_BOTTOM and task_idx < len(tasks):
        task = tasks[task_idx]
        title_text = strip_html(task.get("title", "")).strip()
        desc = strip_html(task.get("description", "")).strip()

        if title_text:
            # Checkbox center
            cb_y = y - (TASK_ROW_H + TASK_CB_SIZE) / 2
            cb_center_y = cb_y + TASK_CB_SIZE / 2

            if desc:
                # Con descripción: bloque centrado (título + descripción)
                title_y = cb_center_y + 0.5
                desc_y = cb_center_y - 6.5
            else:
                # Sin descripción: título solo, centrado con checkbox
                title_y = cb_center_y - 3  # Ajuste para centrar visualmente con fuente 9pt

            # Task title (bold, 9pt)
            c.setFillColor(black)
            c.setFont("Lato-Bold", 9)
            max_chars = 55
            display_text = title_text[:max_chars] + ("..." if len(title_text) > max_chars else "")
            c.drawString(TASK_LEFT + TASK_CB_SIZE + 8, title_y, display_text)

            # Description preview (gray, 7pt) - only if exists
            if desc:
                c.setFillColor(HexColor("#666666"))
                c.setFont("Lato-Bold", 7)
                desc_preview = desc[:70] + ("..." if len(desc) > 70 else "")
                c.drawString(TASK_LEFT + TASK_CB_SIZE + 8, desc_y, desc_preview)

        task_idx += 1
        y -= TASK_ROW_H

    c.save()
    buf.seek(0)
    return buf


def extract_page_map(pdf):
    """Extrae el pageMap del attachment del PDF."""
    spec = pdf.attachments["pageMap.json"]
    af = spec.get_file()
    return json.loads(af.read_bytes())


def main():
    if not VIKUNJA_URL:
        print("ERROR: VIKUNJA_URL no configurada. Exporta VIKUNJA_URL en tu entorno.")
        sys.exit(1)
    if not VIKUNJA_TOKEN:
        print("ERROR: VIKUNJA_TOKEN no configurado. Exporta VIKUNJA_TOKEN en tu entorno.")
        sys.exit(1)

    setup_fonts()

    pdf_path = "/tmp/rmdl/TESTC.pdf"
    target_date_str = "2026-06-29"  # Lunes 29 de junio

    print(f"[1] Abriendo PDF: {pdf_path}")
    pdf = pikepdf.open(pdf_path)

    print("[2] Extrayendo pageMap...")
    page_map = extract_page_map(pdf)

    target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
    day_info = page_map["days"].get(target_date_str)
    if not day_info:
        print(f"ERROR: No se encontró {target_date_str} en pageMap")
        sys.exit(1)

    tasks_page_idx = day_info["tasks"]
    tasks_page_real = tasks_page_idx + 1

    print(f"[3] Fecha objetivo: {target_date_str} ({DIAS[target_date.weekday()]})")
    print(f"   Agenda: índice {day_info['agenda']} (página real {day_info['agenda'] + 1})")
    print(f"   Tareas: índice {tasks_page_idx} (página real {tasks_page_real}) ← INYECTAR AQUÍ")
    print(f"   Notas: índice {day_info['notes']} (página real {day_info['notes'] + 1})")

    print("[4] Obteniendo tareas de Vikunja...")
    tasks = fetch_vikunja_tasks()
    print(f"   Tareas obtenidas: {len(tasks)}")

    print("[5] Generando overlay transparente...")
    overlay_buf = render_task_text_overlay(tasks)

    print(f"[6] Aplicando overlay EN PÁGINA DE TAREAS (índice {tasks_page_idx})...")
    overlay_pdf = pikepdf.open(overlay_buf)
    pdf.pages[tasks_page_idx].add_overlay(overlay_pdf.pages[0])
    overlay_pdf.close()

    out_path = pdf_path + ".out"
    print(f"[7] Guardando en: {out_path}")
    pdf.save(out_path)
    pdf.close()

    print("[8] Renombrando archivo...")
    os.rename(out_path, pdf_path)

    print("[9] Subiendo a reMarkable...")
    os.system(f"cd /tmp/rmdl && RMAPI_HOST={RMAPI_HOST} rmapi put --content-only {pdf_path} /")

    print("\n¡Completado!")
    print(f"   Página de tareas: {tasks_page_real} (índice {tasks_page_idx})")
    print(f"   Tareas inyectadas: {len(tasks)}")


if __name__ == "__main__":
    main()
