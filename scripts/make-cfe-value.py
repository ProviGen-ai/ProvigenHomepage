"""The cell-free value figures for the release page (13 Nov 2026).

From the Olsen et al. 2026 data (Nat Commun 17:3478, Supplementary Data 2, CC BY 4.0) as prepared in
BiofoundryDemo_AI (src/bo/cfe.py), and the cell-free benchmark runs there (10 campaigns per stage, 200
experiments one at a time, 5 random starting points):
  - share of campaigns that reach a top-1% formulation of their stage within 25 and 50 experiments, per method;
  - where the lab's own campaign first reached a top-1% formulation, in the order it tested them;
  - best yield so far against experiments (g/L) on the last stage (rounds 30 to 44, where the best formulations
    are), for the lab in its own order and for each method (mean over campaigns, with the 25th to 75th percentile).
Writes content/release/cfe-value.json. Run with the BiofoundryDemo env:
  ~/miniconda3/envs/biofoundryDemo-env/bin/python -I scripts/make-cfe-value.py
"""
import json
from pathlib import Path

import numpy as np

DATA = Path('/home/orthodim/data/BiofoundryDemo_AI')
POOL = DATA / 'data_store' / 'olsen2026_cfe' / 'v1'
RUNS = DATA / 'results' / 'experiments' / 'meta-search-benchmark'
OUT = Path(__file__).resolve().parent.parent / 'content' / 'release' / 'cfe-value.json'

STAGES = [('ex1-11', 13), ('ex12-29', 28), ('ex30-44', 21)]
# method key -> (study, file tag, method name in the runs file)
METHODS = {
    'sdm-1': ('20261030-s1-004-046-cfe-freighter', 'main', 'model-ei-body'),
    'gp-ts': ('20261030-s1-004-037-cfe-discovery-freighter', None, 'gp-ts'),
    'baybe': ('20261030-s1-004-046-cfe-freighter', 'baybe', 'baybe'),
    'bofire': ('20261030-s1-004-046-cfe-freighter', 'bofire', 'bofire'),
    'random': ('20261030-s1-004-046-cfe-freighter', 'main', 'random'),
}


def runs_for(stage, d, method):
    study, tag, name = METHODS[method]
    folder = RUNS / study
    files = [folder / (f'runs-{stage}_{d}-{tag}.json' if tag else f'runs-{stage}.json')]
    out = [r for f in files for r in json.loads(f.read_text())['runs'] if r['method'] == name]
    assert len(out) == 10, (stage, method, len(out))
    return out


def first_hit(found):
    """1-based experiment at which the first top-1% formulation was found, or None."""
    for i, n in enumerate(found):
        if n >= 1:
            return i + 1
    return None


lab = {r['problem'].split(':')[1]: r for r in json.loads((POOL / 'lab' / 'runs.json').read_text())['runs']}
result = {'methods': {}, 'stages': {}, 'lab': {}}
offset = 0
for stage, d in STAGES:
    z = np.load(POOL / f'{stage}.npz')
    y, idx = z['y'], z['index']
    lo, hi = float(z['y_min']), float(z['y_max'])
    n_good = int(np.ceil(0.01 * len(y)))
    top = set(np.argsort(-y)[:n_good].tolist())
    # The lab's order: every reading, mapped to its formulation.
    order = idx.tolist()
    hit = next(i + 1 for i, c in enumerate(order) if c in top)
    rounds = lab[stage]['rounds']
    result['lab'][stage] = {
        'readings': len(order),
        'first_top1': hit,
        'first_top1_global': offset + hit,
        'first_top1_round': rounds[hit - 1],
        'top1_threshold_g_per_L': round(float(np.sort(y)[-n_good]) / 1000, 3),
    }
    offset += len(order)
    result['stages'][stage] = {'formulations': int(len(y)), 'top1_count': n_good, 'best_g_per_L': round(float(y.max()) / 1000, 3), 'methods': {}}
    for method in METHODS:
        hits = [first_hit(r['discovery']['found'][0]) for r in runs_for(stage, d, method)]
        m = result['methods'].setdefault(method, {'hits': []})
        m['hits'] += hits
        result['stages'][stage]['methods'][method] = {
            'top1_within_25': sum(1 for h in hits if h is not None and h <= 25),
            'top1_within_50': sum(1 for h in hits if h is not None and h <= 50),
            'first_top1': hits,
        }

for method, m in result['methods'].items():
    hits = m.pop('hits')
    n = len(hits)
    m['campaigns'] = n
    for k in (25, 50, 100, 200):
        m[f'top1_within_{k}'] = round(sum(1 for h in hits if h is not None and h <= k) / n, 3)
    reached = sorted(h for h in hits if h is not None)
    m['median_first_top1'] = float(np.median(reached)) if len(reached) * 2 > n else None

# Convergence on the last stage, in g/L.
stage, d = STAGES[-1]
z = np.load(POOL / f'{stage}.npz')
lo, hi = float(z['y_min']), float(z['y_max'])
g = lambda v: (np.asarray(v) * (hi - lo) + lo) / 1000
# The npz holds each formulation's mean yield in ug/mL; the runs hold it min-max normalised over the stage's readings.
lab_best = np.maximum.accumulate(z['y'][z['index']] / 1000)
curves = {'lab': [round(float(v), 3) for v in lab_best]}
# Every formulation the lab tested in this stage, in its order, at that formulation's mean yield (g/L): the
# plot's dots. The same mean the best-so-far line and the benchmark use, so no dot sits above the line.
curves['lab_points'] = [round(max(0.0, float(v)) / 1000, 3) for v in z['y'][z['index']]]
for method in ('sdm-1', 'gp-ts', 'random'):
    best = np.array([np.maximum.accumulate(g(r['y'])) for r in runs_for(stage, d, method)])
    curves[method] = {
        'mean': [round(float(v), 3) for v in best.mean(0)],
        'q25': [round(float(v), 3) for v in np.percentile(best, 25, 0)],
        'q75': [round(float(v), 3) for v in np.percentile(best, 75, 0)],
    }
# One typical SDM-1 campaign to draw with its own points: the one whose first top-1% formulation is closest to the
# median over the 10 campaigns (ties: the later one, the less flattering).
sdm_runs = runs_for(stage, d, 'sdm-1')
hits = [first_hit(r['discovery']['found'][0]) for r in sdm_runs]
mid = float(np.median([h for h in hits if h is not None]))
pick = min(range(len(sdm_runs)), key=lambda i: (abs(hits[i] - mid), -hits[i]))
run = sdm_runs[pick]
curves['sdm-1_campaign'] = {
    'seed': run['seed'],
    'first_top1': hits[pick],
    'points': [round(max(0.0, float(v)), 3) for v in g(run['y'])],
    'best': [round(float(v), 3) for v in np.maximum.accumulate(g(run['y']))],
}
result['convergence'] = {'stage': stage, 'rounds': [30, 44], 'curves': curves}

# The served model (S1-004-077, 14 Nov 2026: oracle-gamma, v4 + H1 + r1, the path the SDM-1 API serves) on the last
# stage, budget 50, at batch 1, 5 and 8, 10 paired seeds. Per campaign: the experiment of the first top-1%
# formulation and the round it came in (round 0 = the 5 starting formulations). Its batch-1 campaign closest to the
# median is the plot's SDM-1 line, and its rounds at batch 5 replace the earlier assumption about calendar time.
SERVED = RUNS.parent / 'meta-search-benchmark'
served = {}
for b in (1, 5, 8):
    path = RUNS / f'20261114-s1-004-077-cfe-b{b}-n50' / 'runs-ex30-44-served.json'
    runs = [r for r in json.loads(path.read_text())['runs'] if r['method'] == 'oracle-gamma']
    assert len(runs) == 10, (b, len(runs))
    hits = [first_hit(r['discovery']['found'][0]) for r in runs]
    served[f'batch{b}'] = {
        'first_top1': hits,
        'first_round': [r['batch'][h - 1] if h else None for r, h in zip(runs, hits)],
    }
    if b == 1:
        mid = float(np.median([h for h in hits if h is not None]))
        pick = min(range(len(runs)), key=lambda i: (abs(hits[i] - mid), -hits[i]))
        run = runs[pick]
        curves['sdm-1_served_campaign'] = {
            'seed': run['seed'],
            'first_top1': hits[pick],
            'points': [round(max(0.0, float(v)), 3) for v in g(run['y'])],
            'best': [round(float(v), 3) for v in np.maximum.accumulate(g(run['y']))],
        }
result['served'] = served

# The served model on each of the three stages in turn (founder, 14 Nov 2026: SDM-1's count is phase 1 + phase 2 +
# phase 3, each searched until it reaches that stage's top 1%, then on to the next). Budget 200, one at a time, the
# same 10 seeds (S1-004-077, the cfe-doe-b1-n200 study, which also ran the served model). Per stage: the experiment of
# the first top-1% formulation per campaign, its median, the stage's top-1% threshold (g/L), and the campaign closest
# to the median (ties: the later one, the less flattering), its yields (g/L) up to and including that hit.
served_stages = {}
for st, _ in STAGES:
    zz = np.load(POOL / f'{st}.npz')
    lo_s, hi_s = float(zz['y_min']), float(zz['y_max'])
    g_s = lambda v: (np.asarray(v) * (hi_s - lo_s) + lo_s) / 1000
    path = RUNS / '20261114-s1-004-077-cfe-doe-b1-n200' / f'runs-{st}-served.json'
    runs = [r for r in json.loads(path.read_text())['runs'] if r['method'] == 'oracle-gamma']
    assert len(runs) == 10, (st, len(runs))
    hits = [first_hit(r['discovery']['found'][0]) for r in runs]
    reached = [h for h in hits if h is not None]
    mid = float(np.median(reached))
    pick = min(range(len(runs)), key=lambda i: (abs((hits[i] or 10**6) - mid), -(hits[i] or 0)))
    run = runs[pick]
    served_stages[st] = {
        'first_top1': hits,
        'median_first_top1': mid,
        'top1_threshold_g_per_L': result['lab'][st]['top1_threshold_g_per_L'],
        'campaign': {
            'seed': run['seed'],
            'first_top1': hits[pick],
            'points': [round(max(0.0, float(v)), 3) for v in g_s(run['y'])[: hits[pick]]],
        },
    }
result['served_stages'] = served_stages

# The served model in rounds of 27 (founder, 14 Nov 2026: to match Olsen et al.'s round size, 1,231 formulations over
# 43 rounds), agent-004's S1-004-077 cfe-b27 study: 10 seeds per set, 5 starting formulations, then rounds of 27,
# choosing among the formulations Olsen et al. tested. Per set: the experiment and the round of the first top-1%
# formulation per campaign (round 0 = the 5 starting formulations), their medians, and the campaign closest to the
# median experiment (ties: the later one), its yields (g/L) up to and including that hit.
served_b27 = {}
for st, _ in STAGES:
    zz = np.load(POOL / f'{st}.npz')
    lo_s, hi_s = float(zz['y_min']), float(zz['y_max'])
    g_s = lambda v: (np.asarray(v) * (hi_s - lo_s) + lo_s) / 1000
    path = RUNS / '20261114-s1-004-077-cfe-b27' / f'runs-{st}-served.json'
    runs = [r for r in json.loads(path.read_text())['runs'] if r['method'] == 'oracle-gamma']
    assert len(runs) == 10, (st, len(runs))
    hits = [first_hit(r['discovery']['found'][0]) for r in runs]
    assert all(h is not None for h in hits), (st, hits)
    rounds = [r['batch'][h - 1] for r, h in zip(runs, hits)]
    mid = float(np.median(hits))
    pick = min(range(len(runs)), key=lambda i: (abs(hits[i] - mid), -hits[i]))
    run = runs[pick]
    served_b27[st] = {
        'batch': 27,
        'first_top1': hits,
        'first_round': rounds,
        'median_first_top1': mid,
        'median_first_round': float(np.median(rounds)),
        'campaign': {
            'seed': run['seed'],
            'first_top1': hits[pick],
            'first_round': rounds[pick],
            'points': [round(max(0.0, float(v)), 3) for v in g_s(run['y'])[: hits[pick]]],
        },
    }
# The plot draws one whole campaign: the seed whose three-set total is closest to the sum of the per-set medians (the
# headline's count; ties: the later one), its yields up to each set's hit.
_runs27 = {st: [r for r in json.loads((RUNS / '20261114-s1-004-077-cfe-b27' / f'runs-{st}-served.json').read_text())['runs']
                if r['method'] == 'oracle-gamma'] for st, _ in STAGES}
_target = sum(v['median_first_top1'] for v in served_b27.values())
_totals = [sum(served_b27[st]['first_top1'][i] for st, _ in STAGES) for i in range(10)]
_seed_i = min(range(10), key=lambda i: (abs(_totals[i] - _target), -_totals[i]))
for st, _ in STAGES:
    zz = np.load(POOL / f'{st}.npz')
    lo_s, hi_s = float(zz['y_min']), float(zz['y_max'])
    run, h = _runs27[st][_seed_i], served_b27[st]['first_top1'][_seed_i]
    served_b27[st]['shown'] = {
        'seed': run['seed'], 'first_top1': h, 'first_round': served_b27[st]['first_round'][_seed_i],
        'points': [round(max(0.0, float(v)), 3) for v in ((np.asarray(run['y']) * (hi_s - lo_s) + lo_s) / 1000)[:h]],
    }
result['served_b27'] = served_b27

# The whole campaign, all 1,231 formulations in the order tested, across the three stages: each at its
# formulation's mean yield (g/L), and the best so far. The stages test different reagent sets, so the
# comparison with SDM-1 stays inside the last one; the earlier stages are context.
points, starts = [], []
for st, _ in STAGES:
    zz = np.load(POOL / f'{st}.npz')
    starts.append(len(points))
    points += [round(max(0.0, float(v)) / 1000, 3) for v in zz['y'][zz['index']]]
result['campaign'] = {
    'formulations': len(points),
    'stage_starts': starts,
    'points': points,
    'best': [round(float(v), 3) for v in np.maximum.accumulate(points)],
}
result['source'] = 'Olsen et al., Nat Commun 17:3478 (2026), Supplementary Data 2; BiofoundryDemo_AI cell-free benchmark (S1-004-037, S1-004-046)'

OUT.write_text(json.dumps(result, indent=1) + '\n')
summary = {k: v for k, v in result.items() if k != 'convergence'}
print(json.dumps(summary, indent=1))
