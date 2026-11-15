#!/usr/bin/env python3
"""Import the authored event CSV into the simulation-unit JSON used by the game.

Run from any directory: python scripts/import_event_cards.py [input.csv] [--check]
Blank influences mean zero. Input percentages are points of resource capacity.
The CSV stays untouched; categories, short labels and image captions are editorial.
"""
import argparse
import csv
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / 'Cartas de evento - Página1.csv'
COLUMNS = {
    'oxygen': 'Influência no atributo Oxygen',
    'shield': 'Influência no atributo Shield Protection',
    'energy': 'Influência no atributo Energy Supply',
    'food': 'Influência no atributo Food Stock',
    'water': 'Influência no atributo Water Stock',
}
# category, short left label, short right label, accurate description of the image
EDITORIAL = {
    '1': ('emergency', 'Use a backup tank', 'Wait and see', 'Oxygen tanks inside a spacecraft.'),
    '2': ('emergency', 'Use LiOH canisters', 'Keep working', 'A view from a spacecraft.'),
    '3': ('maintenance', 'Use reserve water', 'Push the recycler', 'Water processing equipment.'),
    '4': ('routine', 'Open the valves', 'Limit the flow', 'An astronaut repairs station equipment.'),
    '5': ('maintenance', 'Cool the machine', 'Make less oxygen', 'An astronaut holds a drink pouch.'),
    '6': ('maintenance', 'Use stored oxygen', 'Keep reactor on', 'An astronaut works on life-support equipment.'),
    '7': ('science', 'Plant lettuce', 'Plant soybeans', 'Plants grow inside a space experiment.'),
    '8': ('maintenance', 'Pause charging', 'Keep charging', 'Solar collectors at a power facility on Earth.'),
    '9': ('exploration', 'Clean the panels', 'Stay inside', 'Dust over the surface of Mars.'),
    '10': ('maintenance', 'Turn off extras', 'Keep systems on', 'A dusty solar panel on Mars.'),
    '11': ('emergency', 'Use the shelter', 'Work outside', 'An illustration of a spacecraft near the Sun.'),
    '12': ('maintenance', 'Flush the recycler', 'Keep it running', 'An illustration of a space base.'),
    '13': ('maintenance', 'Use stored water', 'Run it anyway', 'A technician tests life-support equipment.'),
}
# These labels were missing in the supplied sheet; completion was authorized.
COMPLETED_RESPONSES = {
    ('7', 'right'): 'Choose soybeans for a larger harvest later.',
    ('8', 'left'): 'Pause battery charging and let the power lines cool.',
    ('8', 'right'): 'Keep charging the battery while watching the hot power lines.',
}
# Independent random draws must read sensibly without a preceding event, and the
# station's 15 kWh example must not redefine this game's configured base battery.
DISPLAY_DESCRIPTIONS = {
    '1': 'An oxygen tank is leaking. The air pressure is falling!',
    '2': 'The carbon dioxide filter broke. The crew has headaches.',
    '3': 'Water recycling has failed. We need clean drinking water.',
    '4': 'The crew needs more oxygen. How much should we release?',
    '5': 'The machine that uses water to make oxygen is overheating!',
    '6': "The Sabatier reactor broke. Use stored oxygen or keep it on?",
    '7': 'An empty growing tray is ready. Lettuce or soybeans?',
    '8': 'The battery is almost full. Its power lines are hot!',
    '9': 'A Martian dust storm is covering our solar panels.',
    '10': 'Dust blocks sunlight. The base is making less power.',
    '11': 'A solar flare is coming. Should we use the storm shelter?',
    '12': 'The water recycler is clogged. Flush it or keep it running?',
    '13': 'The water recycler stopped. Wastewater is piling up!',
}
DISPLAY_RESPONSES = {
    ('10', 'left'): 'Shut down non-vital habitat systems to save the remaining battery power.',
}
INSTITUTIONS = {
    'www.esa.int': 'ESA', 'images.nasa.gov': 'NASA', 'www.nasa.gov': 'NASA',
    'science.nasa.gov': 'NASA', 'spinoff.nasa.gov': 'NASA Spinoff',
    'www.jpl.nasa.gov': 'NASA JPL', 'www.space.com': 'Space.com',
    'www.boletin.upiita.ipn.mx': 'IPN', 'esemag.com': 'ES&E Magazine',
}


def clean(text):
    return text.strip().strip('"').strip()


def number(value):
    return int(value) if value == value.to_integral_value() else float(value)


def pair(text, card_id, key):
    text = text.strip()
    if not text.strip('\\/ \t'):
        return Decimal(0), Decimal(0)
    parts = re.split(r'[\\/]', text)
    if len(parts) != 2 or not all(re.fullmatch(r'[+-]?\d+(?:[.,]\d+)?', p.strip()) for p in parts):
        raise ValueError(f'Card {card_id}: invalid {key} pair {text!r}')
    return tuple(Decimal(p.strip().replace(',', '.')) for p in parts)


def convert(source):
    from urllib.parse import urlparse
    with source.open(encoding='utf-8-sig', newline='') as file:
        sheet = list(csv.reader(file))
    header_index = next(i for i, row in enumerate(sheet) if row and row[0].strip() == 'Id')
    header = sheet[header_index]
    records = [dict(zip(header, row)) for row in sheet[header_index + 1:] if row and row[0].strip().isdigit()]
    ids = [row['Id'].strip() for row in records]
    if len(ids) != 13 or len(set(ids)) != 13 or set(ids) != set(EDITORIAL):
        raise ValueError('Expected exactly the 13 unique IDs from 1 through 13')
    resources = json.loads((ROOT / 'data/resources.json').read_text())['quantities']
    counts = Counter(EDITORIAL[card_id][0] for card_id in ids)
    cards = []
    for row in sorted(records, key=lambda r: int(r['Id'])):
        card_id = row['Id'].strip()
        category, left_label, right_label, caption = EDITORIAL[card_id]
        images = list((ROOT / 'images/cards').glob(card_id + '.*'))
        if len(images) != 1:
            raise ValueError(f'Card {card_id}: expected one matching image, found {len(images)}')
        image_source = row['Imagem da carta'].strip()
        reference = row.get('Referência', '').strip()
        source_url = reference
        institution = INSTITUTIONS.get(urlparse(source_url).netloc, urlparse(source_url).netloc)
        card = {
            'id': card_id, 'category': category, 'probability': 1 / counts[category],
            'difficulty': row['Dificuldade do evento'].strip().lower(),
            'description': DISPLAY_DESCRIPTIONS[card_id],
            'sourceDescription': clean(row['Descrição da carta']),
            'image': images[0].relative_to(ROOT).as_posix(), 'imageAlt': caption, 'imageCaption': caption,
            'imageSource': image_source,
        }
        if reference:
            card['source'] = {'institution': institution, 'url': reference, 'kind': 'reference'}
        pairs = {key: pair(row.get(column, ''), card_id, key) for key, column in COLUMNS.items()}
        for index, (side, label) in enumerate([('left', left_label), ('right', right_label)]):
            source_response = clean(row.get(f'Resposta {index + 1}', ''))
            description = source_response or COMPLETED_RESPONSES.get((card_id, side), '')
            if not description:
                raise ValueError(f'Card {card_id}: missing {side} response')
            if '/ consequence:' in description:
                description = description.split('/ consequence:', 1)[1].strip()
            description = DISPLAY_RESPONSES.get((card_id, side), description)
            percentages = {key: number(values[index]) for key, values in pairs.items() if values[index]}
            effects = {key: number(Decimal(str(resources[key]['max'])) * Decimal(str(value)) / 100) for key, value in percentages.items()}
            card[side] = {'label': label, 'description': description, 'sourceResponse': source_response, 'effectPercentages': percentages, 'effects': effects}
        cards.append(card)
    return cards


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', nargs='?', type=Path, default=DEFAULT_INPUT)
    parser.add_argument('--check', action='store_true', help='Fail if cards.json differs; do not write it')
    args = parser.parse_args()
    cards = convert(args.csv)
    target = ROOT / 'data/cards.json'
    if args.check:
        if json.loads(target.read_text()) != cards:
            raise SystemExit('cards.json differs from the CSV conversion; run the importer')
        print('CSV conversion: 13 cards match cards.json')
    else:
        target.write_text(json.dumps(cards, ensure_ascii=False, indent=2) + '\n')
        print('Imported 13 cards; percentages converted to resource capacity units')


if __name__ == '__main__':
    main()
