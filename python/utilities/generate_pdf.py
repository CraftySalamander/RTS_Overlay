# Generate a PDF file from an RTS Overlay JSON file.
import os
import re
import sys
import json
import argparse
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image

from xml.sax.saxutils import escape as xml_escape


class BackgroundDocTemplate(SimpleDocTemplate):
    """Background color for the PDF."""

    def __init__(self, *args, background_color=colors.whitesmoke, **kwargs):
        super().__init__(*args, **kwargs)
        self.background_color = background_color

    def handle_pageBegin(self):
        super().handle_pageBegin()
        self.canv.saveState()
        self.canv.setFillColor(self.background_color)
        self.canv.rect(0, 0, self.pagesize[0], self.pagesize[1], stroke=0, fill=1)
        self.canv.restoreState()


def generate_build_order_pdf(json_content, game_dir, common_dir, output_pdf_path):
    """Generate the PDF for the build order.

    Parameters
    ----------
    json_content       Content of the build order JSON file.
    game_dir           Directory of the game icons.
    common_dir         Directory of the common icons.
    output_pdf_path    Path to the output PDF to create.
    """
    build_order = json_content.get('build_order', [])

    doc = BackgroundDocTemplate(
        output_pdf_path,
        pagesize=A4,
        rightMargin=36, leftMargin=36,
        topMargin=48, bottomMargin=36,
        title=json_content.get('name', 'Build Order'),
        background_color=colors.HexColor('#f7f5f0')
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleLine', parent=styles['Title'], fontSize=20, spaceAfter=12)
    cell_style = ParagraphStyle('Cell', parent=styles['BodyText'], fontSize=9, leading=14, alignment=1)
    cell_style_bold = ParagraphStyle('Cell', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=9,
                                     leading=14, alignment=1)
    notes_style = ParagraphStyle('Notes', parent=styles['BodyText'], fontSize=9, leading=18,
                                 alignment=0)  # relaxed lines
    age_style = ParagraphStyle('AgeHeader', parent=styles['Heading4'], fontSize=12, alignment=0, spaceBefore=6,
                               spaceAfter=4)

    story = []
    # Add title
    title_text = (f'{xml_escape(str(json_content.get("name", "")))} — ' +
                  f'{xml_escape(str(json_content.get("civilization", "")))}')
    story.append(Paragraph(title_text, title_style))
    story.append(Spacer(1, 6))

    def get_image_path(rel_path: str) -> Optional[str]:
        """Get the full path of an image.
        
        Parameters
        ----------
        rel_path    Relative path to the image (from game or common folder).

        Returns
        -------
        Full path to the image (with extension), or None if not found.
        """
        if os.path.exists(os.path.join(game_dir, rel_path)):
            return str(os.path.join(game_dir, rel_path))
        elif os.path.exists(os.path.join(common_dir, rel_path)):
            return str(os.path.join(common_dir, rel_path))
        else:
            return None

    def is_image_path(path) -> bool:
        """Check if a path corresponds to an image."""
        return path and path.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))

    def header_image_cell(rel_path: str, fallback_text: Optional[str] = None, size_pt: int = 14):
        """Add a cell with an image for the header.

        Parameters
        ----------
        rel_path         Relative path to the image.
        fallback_text    Fallback text in case the image is not found.
        size_pt          Size of the image.

        Returns
        -------
        Image or text for PDF insertion.
        """
        image_path = get_image_path(rel_path)  # Get image full path
        if image_path:
            img = Image(image_path, width=size_pt, height=size_pt)
            img.hAlign = 'CENTER'
            return img
        return Paragraph(xml_escape(fallback_text or rel_path or ''), cell_style)

    # Detect image texts and replace them by the correct image, using this token.
    token_re = re.compile(r'@([^@]+)@')

    def notes_to_paragraph(note_text):
        """Convert notes to paragraph with images."""
        parts = token_re.split(note_text or '')
        html_parts = []
        for i, part in enumerate(parts):
            if i % 2 == 1:
                token_path = part.strip()
                if is_image_path(token_path):
                    image_path = get_image_path(token_path)
                    if image_path:
                        html_parts.append(f'<img src="{image_path}" width="18" height="18" valign="middle"/>')
                    else:
                        html_parts.append(xml_escape(f'[{token_path}]'))
                else:
                    html_parts.append(xml_escape(token_path))
            else:
                html_parts.append(xml_escape(part))
        return Paragraph(''.join(html_parts).strip(), notes_style)

    # Check if at least one time and/or builder instruction is provided
    time_present = False
    builder_present = False
    for step in build_order:
        res = step.get('resources', {})
        if step.get('time', '') != '':
            time_present = True
        if res.get('builder', '') != '':
            builder_present = True

    # Number of columns
    columns_count = 6 + (1 if time_present else 0) + (1 if builder_present else 0)

    # Header — last column blank
    header = []
    if time_present:
        header.append(header_image_cell('icon/time_black.png', 'Time'))
    header.append(header_image_cell('resource/MaleVillDE_alpha.png', 'Villagers'))
    if builder_present:
        header.append(header_image_cell('resource/Aoe2de_hammer.png', 'Builder'))
    header.append(header_image_cell('resource/Aoe2de_wood.png', 'Wood'))
    header.append(header_image_cell('resource/Aoe2de_food.png', 'Food'))
    header.append(header_image_cell('resource/Aoe2de_gold.png', 'Gold'))
    header.append(header_image_cell('resource/Aoe2de_stone.png', 'Stone'))
    header.append(Paragraph('', cell_style))  # blank Notes header

    # Labels for the age transitions
    age_labels = {
        1: {'name': 'Dark Age', 'image': 'age/DarkAgeIconDE_alpha.png'},
        2: {'name': 'Feudal Age', 'image': 'age/FeudalAgeIconDE_alpha.png'},
        3: {'name': 'Castle Age', 'image': 'age/CastleAgeIconDE_alpha.png'},
        4: {'name': 'Imperial Age', 'image': 'age/ImperialAgeIconDE_alpha.png'}}

    def parse_age(val):
        """Convert age transition to corresponding text."""
        try:
            a = int(val)
            return a if 1 <= a <= 4 else None
        except Exception:
            return None

    rows = [header]
    spans = []  # list of ('SPAN', (c1,r), (c2,r))
    row_colors = [colors.white, colors.HexColor('#f0ede6')]
    stripe_index = 0
    last_valid_age = None
    step_bg_ranges = []  # (start_row, end_row, color)

    age_up_flag = False  # True after aging up message added for this step

    # Loop on the build order steps
    for step in build_order:
        # Insert age header if age changed and valid
        age = parse_age(step.get('age'))
        if (age is not None) and (age != last_valid_age or age_up_flag):
            label = ''
            if (not age_up_flag) and (last_valid_age is not None):
                image_path = get_image_path('icon/top_arrow.png')
                if image_path:
                    label += f'<img src="{image_path}" width="16" height="16" valign="middle"/> '
                label += 'Aging up to '
                age_up_flag = True
            else:
                image_path = get_image_path(age_labels[age]['image'])
                if image_path:
                    label += f'<img src="{image_path}" width="16" height="16" valign="middle"/> '
                age_up_flag = False
            label += age_labels[age]['name']
            rows.append([Paragraph(label, age_style)] + [Paragraph('', cell_style) for _ in range(columns_count - 1)])
            age_row_idx = len(rows) - 1
            spans.append(('SPAN', (0, age_row_idx), (-1, age_row_idx)))
            last_valid_age = age

        res = step.get('resources', {})  # Get resources

        # Convert value to text for the resources and other fields
        def fmt_num(v):
            try:
                v = int(v)
                return '' if v <= 0 else str(v)
            except Exception:
                return ''

        # Build step rows (multi-note expansion)
        notes_list = step.get('notes', [])
        notes_count = len(notes_list)
        step_rows_start = len(rows)

        row_content = []
        if time_present:
            row_content.append(Paragraph(xml_escape(step.get('time', '')), cell_style))
        row_content.append(Paragraph(fmt_num(step.get('villager_count', '')), cell_style_bold))
        if builder_present:
            row_content.append(Paragraph(fmt_num(res.get('builder', '')), cell_style))
        row_content.append(Paragraph(fmt_num(res.get('wood', '')), cell_style))
        row_content.append(Paragraph(fmt_num(res.get('food', '')), cell_style))
        row_content.append(Paragraph(fmt_num(res.get('gold', '')), cell_style))
        row_content.append(Paragraph(fmt_num(res.get('stone', '')), cell_style))
        if notes_count >= 1:
            row_content.append(notes_to_paragraph(notes_list[0]))
        else:
            row_content.append(Paragraph('', notes_style))
        rows.append(row_content)

        for note_id in range(1, notes_count):
            row_content = []
            for row_id in range(columns_count - 1):
                row_content.append(Paragraph('', cell_style))
            row_content.append(notes_to_paragraph(notes_list[note_id]))
            rows.append(row_content)

        step_rows_end = len(rows) - 1

        # Record background range for this step (exclude age header)
        if step_rows_end >= step_rows_start:
            color = row_colors[stripe_index % 2]
            step_bg_ranges.append((step_rows_start, step_rows_end, color))
            stripe_index += 1

    # Column widths
    col_w = []
    if time_present:
        col_w = col_w + [1.2 * cm]
    col_w = col_w + [1.0 * cm] * (6 if builder_present else 5)
    notes_w = max(doc.width - sum(col_w), 6.0 * cm)
    col_w = col_w + [notes_w]

    table = Table(rows, colWidths=col_w, hAlign='LEFT', repeatRows=1)

    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e6dfd2')),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
        ('GRID', (0, 1), (-1, -1), 0.25, colors.lightgrey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (columns_count - 2, -1), 'CENTER'),
        ('ALIGN', (columns_count - 1, 0), (columns_count - 1, -1), 'LEFT'),
        ('VALIGN', (columns_count - 1, 0), (columns_count - 1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]

    # Apply SPAN for age header rows
    for cmd in spans:
        style_cmds.append(cmd)

    # Apply per-step background striping (age headers excluded)
    for start_row, end_row, color in step_bg_ranges:
        style_cmds.append(('BACKGROUND', (0, start_row), (-1, end_row), color))

    table.setStyle(TableStyle(style_cmds))
    story.append(table)
    doc.build(story)


def parse_args() -> argparse.Namespace:
    """Parse the arguments for build order PDF generation."""
    parser = argparse.ArgumentParser(description='Generate a build order PDF from a RTS Overlay JSON file.')
    parser.add_argument('--json_file', type=Path, required=True,
                        help='Path to the input JSON file (RTS Overlay format).')
    parser.add_argument('--game', type=str, required=True, help='Name of the game (e.g. aoe2).')
    parser.add_argument('--assets_dir', type=Path, required=True, help='Path to the assets directory.')
    parser.add_argument('--output_pdf', type=Path, required=True, help='Path to the output PDF file.')
    return parser.parse_args()


def main():
    args = parse_args()

    # Load the build order content
    try:
        with args.json_file.open('r', encoding='utf-8') as f:
            json_content = json.load(f)
    except json.JSONDecodeError as e:
        print(f'Error: failed to parse JSON: {e}', file=sys.stderr)
        sys.exit(1)
    except OSError as e:
        print(f'Error: failed to read JSON file: {e}', file=sys.stderr)
        sys.exit(1)

    # Ensure the output directory exists
    if args.output_pdf.parent:
        try:
            args.output_pdf.parent.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            print(f'Error: failed to create output directory: {e}', file=sys.stderr)
            sys.exit(1)

    # Invoke the PDF generation function
    generate_build_order_pdf(json_content,
                             os.path.join(args.assets_dir, args.game),
                             os.path.join(args.assets_dir, 'common'),
                             str(args.output_pdf))


if __name__ == '__main__':
    main()
