"""The T-cell media figures for the release page's Use Case #2 (founder, 17 Nov 2026).

From the media benchmark's export (BiofoundryDemo_AI results/experiments/s1-003-057-bio/media_use_case.json, made by
media_use_case_export.py from study 20261116-s1-003-057-media-aws, no new runs): Kim and Audet 2019's primary T-cell
expansion data as packaged by Parsaee et al. 2026, 535 distinct formulations, each scored by the mean of
log1p(Cell count / PosCont FC) over its readings; the top 1% is the 6 best (ceil 1%, ties counted in).

  - Kim and Audet's own search, in its generations ("gen #"): when a top-1% formulation first appeared. Their order
    within a generation is not recorded, so the count is a lower bound: the formulations of the earlier generations,
    plus one.
  - SDM-1 (H1, model-ei-body), 10 campaigns, each from 10 random formulations, budget 50, choosing among the 535: the
    experiment of its first top-1% formulation; one typical campaign (closest to the median; ties: the later, the less
    flattering) with its values and best so far. Bayesian optimization and random kept in the data, not shown.
Writes content/release/media-value.json. Run with the BiofoundryDemo env:
  ~/miniconda3/envs/biofoundryDemo-env/bin/python -I scripts/make-media-value.py
"""
import json
from pathlib import Path

import numpy as np

SRC = Path('/home/orthodim/data/BiofoundryDemo_AI/results/experiments/s1-003-057-bio/media_use_case.json')
OUT = Path(__file__).resolve().parent.parent / 'content' / 'release' / 'media-value.json'

d = json.loads(SRC.read_text())
pool = d['pools']['tcell']
rows = pool['rows']
values = np.array([r['value'] for r in rows])
lo, hi = float(values.min()), float(values.max())
scale = lambda v: round((float(v) - lo) / (hi - lo) * 100, 2)  # 0 to 100 over the pool
top = set(pool['top1']['pool_rows'])

# Kim and Audet in generations: each formulation counted in the first generation it appears in.
first_gen = {r['i']: min(r['gen']) for r in rows}
gens = sorted(set(first_gen.values()))
lab_gens, before, hit_gen, hit_before, hit_in = [], 0, None, None, None
for g in gens:
    new = sorted(i for i, fg in first_gen.items() if fg == g)
    has_top = any(i in top for i in new)
    lab_gens.append({'gen': g, 'new': len(new), 'points': [scale(values[i]) for i in new], 'has_top1': has_top})
    if has_top and hit_gen is None:
        hit_gen, hit_before, hit_in = g, before, len(new)
    before += len(new)

hits, campaigns = {}, {}
for arm in ('sdm1', 'gp_bo', 'random'):
    cs = sorted((c for c in d['campaigns'] if c['pool'] == 'tcell' and c['arm'] == arm), key=lambda c: c['seed'])
    assert len(cs) == 10, (arm, len(cs))
    hits[arm] = [c['first_top1'] for c in cs]
    campaigns[arm] = cs
reached = [h for h in hits['sdm1'] if h is not None]
assert len(reached) == 10  # every SDM-1 campaign reached it, so its median is not censored
mid = float(np.median(reached))
pick = min(range(10), key=lambda k: (abs(hits['sdm1'][k] - mid), -hits['sdm1'][k], k))
run = campaigns['sdm1'][pick]

out = {
    'source': f"{SRC.name} ({d['study']}), made by scripts/make-media-value.py",
    'pool': {'formulations': len(rows), 'top1_count': len(top), 'top1_threshold': scale(pool['top1']['cutoff_value']),
             'value': pool['value_definition'], 'scaled': 'min-max over the 535 formulations, 0 to 100'},
    'lab': {'generations': lab_gens, 'first_top1_generation': hit_gen, 'formulations_before': hit_before,
            'formulations_in_generation': hit_in, 'first_top1_at_least': hit_before + 1,
            'first_top1_at_most': hit_before + hit_in},
    'sdm1': {'first_top1': hits['sdm1'], 'median_first_top1': mid, 'reached': len(reached), 'campaigns': 10,
             'shown': {'seed': run['seed'], 'first_top1': run['first_top1'],
                       'points': [scale(v) for v in run['value']],
                       'best': [scale(v) for v in run['best_so_far']]}},
    'kept_not_shown': {'gp_bo_first_top1': hits['gp_bo'], 'random_first_top1': hits['random']},
    'n_init': d['n_init'], 'budget': d['budget'],
    'caveat': d['caveat'],
}
OUT.write_text(json.dumps(out, indent=1) + '\n')
print(f"lab: generation {hit_gen}, at least {hit_before + 1} (at most {hit_before + hit_in}); "
      f"SDM-1 median {mid} over {len(reached)}/10; shown seed {run['seed']} ({run['first_top1']})")
