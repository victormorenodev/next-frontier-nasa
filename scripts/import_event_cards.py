#!/usr/bin/env python3
"""Import Página2. Resource effects are explicit units, not percentages.
Run: python scripts/import_event_cards.py [input.csv] [--check]
"""
import argparse
import csv
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / 'Cartas de evento - Página2.csv'
COLUMNS = {'oxygen': ('Oxygen Level','kg'), 'water': ('Water Stock','L'),
           'shield': ('Radiation Shield','p'), 'energy': ('Power Supply','kWh'), 'food': ('Food Stock','kg')}
# Short, simple front text and labels; complete original answers remain on the back.
EDITORIAL = {
 '5': ('The oxygen machine needs repairs. Stop it or keep it running?', 'Repair the machine', 'Keep it running', 'An astronaut replaces a filter in the space station.'),
 '9': ('A dust storm is coming. Our solar panels will get less light!', 'Save energy', 'Keep working', 'A dust storm sweeps across Mars.'),
 '11': ('A solar storm is coming. Should the crew use the shelter?', 'Use the shelter', 'Keep working', 'A bright eruption rises from the surface of the Sun.'),
 '14': ('MOXIE can make oxygen from Martian air, but it needs power.', 'Make more oxygen', 'Stop for now', 'MOXIE equipment with pipes and cables.'),
 '15': ('A pipe is leaking! Fix it now or save energy and wait?', 'Fix the leak', 'Watch and wait', 'An astronaut works on pipes inside the space station.'),
 '16': ('Our greenhouse can grow food, but it needs water and power.', 'Grow fresh food', 'Use stored food', 'Astronauts work beside a plant experiment.'),
 '17': ('We found ice underground! Use power to collect water?', 'Dig for ice', 'Use stored water', 'A map shows where ice may lie below the surface of Mars.'),
 '18': ('A plant experiment could help us grow food. Use extra power?', 'Run the experiment', 'Save energy', 'An astronaut works outside the space station.'),
 '19': ('Food is running low. Should we serve smaller meals?', 'Plan smaller meals', 'Keep full meals', 'Astronauts share a meal aboard the space station.'),
 '20': ('The shelter has a crack. Use spare parts or local regolith?', 'Use spare parts', 'Use regolith', 'The crew capsule of a space shuttle in orbit.'),
 '21': ('The air filter is getting full. Replace it or reduce work?', 'Replace the filter', 'Reduce lab work', 'An astronaut repairs air-cleaning equipment inside the space station.'),
 '22': ('Water recycling has failed. Use backup equipment or wait?', 'Use the backup', 'Store waste and wait', 'An astronaut services equipment behind a large panel.'),
 '23': ('Air is escaping from a module! Repair it or use a quick patch?', 'Isolate and repair', 'Use a quick patch', 'A crew member inspects the wall inside a spacecraft.'),
 '24': ('The antenna broke. Send an astronaut or inspect it with a rover?', 'Send an astronaut', 'Use the rover', 'Spacewalking astronauts work outside the space station.'),
 '26': ('The greenhouse lights broke. Use backup lights or wait?', 'Use backup lights', 'Wait for repairs', 'A plant habitat prototype glows under red lights.'),
 '27': ('Spots on our plants may be fungus. Remove them or treat them?', 'Remove sick plants', 'Treat the plants', 'Plants grow under purple lights on the space station.'),
 '29': ('Some food got too warm. Throw it away or inspect each pack?', 'Throw it away', 'Check the packs', 'An open can of food floats inside the space station.'),
}

def number(value):
 return int(value) if value == value.to_integral_value() else float(value)

def pair(text, card_id, key, unit):
 parts=text.strip().split('//')
 if len(parts)!=2: raise ValueError(f'Card {card_id}: invalid {key} pair {text!r}')
 values=[]
 for part in parts:
  # The sheet includes stray dots immediately before // on water rows 15/16.
  part=part.strip().rstrip('.').strip()
  match=re.fullmatch(r'([+-]?)\s*(\d+(?:[.,]\d+)?)\s*'+re.escape(unit),part,re.I)
  if not match: raise ValueError(f'Card {card_id}: invalid {key} amount {part!r}')
  values.append(number(Decimal((match[1] or '')+match[2].replace(',','.'))))
 return values

def convert(source):
 with source.open(encoding='utf-8-sig',newline='') as f: sheet=list(csv.reader(f))
 header_index=next(i for i,row in enumerate(sheet) if 'ID' in row and 'Card Description' in row)
 header=sheet[header_index];records=[dict(zip(header,row)) for row in sheet[header_index+1:] if len(row)>1 and row[1].strip().isdigit()]
 ids=[r['ID'].strip() for r in records]
 if len(set(ids))!=len(ids) or set(ids)!=set(EDITORIAL): raise ValueError('Expected the 17 unique authored Página2 IDs')
 counts=Counter(r['Category'].strip().lower() for r in records)
 cards=[]
 for row in sorted(records,key=lambda r:int(r['ID'])):
  card_id=row['ID'].strip();description,left,right,caption=EDITORIAL[card_id]
  category=row['Category'].strip().lower()
  source_url=row['Sources'].strip();image_source=row['Imagem da carta'].strip()
  card=dict(id=card_id,category=category,probability=1/counts[category],difficulty=row['Difficulty'].strip().lower(),
   description=description,sourceDescription=row['Card Description'].strip(),image=f'images/cards/{card_id}.jpg',imageById=True,
   imageCaption=caption,imageAlt=caption,imageSource=image_source,
   sourceSideEffects=row['Side effects'].strip(),sourceNotes=row['Extra informations'].strip(),sourceVerified=row['Source Verified?'].strip().upper()=='TRUE')
  if source_url:
   host=urlparse(source_url).netloc
   institution='NASA' if host.endswith('nasa.gov') else 'CSA' if host.endswith('asc-csa.gc.ca') else 'AGU' if host.endswith('onlinelibrary.wiley.com') else host.removeprefix('www.')
   card['source']=dict(institution=institution,url=source_url,kind='reference')
  pairs={key:pair(row[column],card_id,key,unit) for key,(column,unit) in COLUMNS.items()}
  for index,(side,label) in enumerate([('left',left),('right',right)]):
   response=re.sub(r'\s+',' ',row[f'Answer {index+1}']).strip()
   card[side]=dict(label=label,description=response,sourceResponse=row[f'Answer {index+1}'].strip(),effects={k:v[index] for k,v in pairs.items() if v[index]})
  cards.append(card)
 return cards

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('csv',nargs='?',type=Path,default=DEFAULT_INPUT);parser.add_argument('--check',action='store_true');args=parser.parse_args()
 cards=convert(args.csv);target=ROOT/'data/cards.json'
 if args.check:
  if json.loads(target.read_text())!=cards: raise SystemExit('cards.json differs from the CSV conversion; run the importer')
  print(f'CSV conversion: {len(cards)} cards match cards.json')
 else:
  target.write_text(json.dumps(cards,ensure_ascii=False,indent=2)+'\n');print(f'Imported {len(cards)} cards; explicit resource units preserved')
if __name__=='__main__':main()
