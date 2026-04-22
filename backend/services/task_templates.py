"""Predefined example tasks for the workshop."""

from __future__ import annotations

EXAMPLE_TASKS = {
    "clinical_trial": {
        "id": "clinical_trial",
        "title": "Clinical Trial Landscaping",
        "description": "Summarize the clinical trial landscape for a disease area.",
        "prompt": (
            "Summarize the clinical trial landscape for non-small cell lung cancer (NSCLC) "
            "immunotherapy combinations, focusing on trial phase distribution, primary and "
            "secondary endpoints, sponsor activity (pharma vs. academic), and key "
            "differentiators between the most advanced programs. Highlight any notable "
            "gaps or emerging trends."
        ),
    },
    "single_cell": {
        "id": "single_cell",
        "title": "Single-Cell Analysis Reasoning",
        "description": "Outline an analysis plan for a single-cell or spatial transcriptomics study.",
        "prompt": (
            "A research team has generated a 10x Visium spatial transcriptomics dataset from "
            "treatment-naive pancreatic ductal adenocarcinoma (PDAC) resections, paired with "
            "matched single-cell RNA-seq from dissociated tumor and adjacent normal tissue. "
            "Outline the likely analysis plan, key biological signals to look for (e.g., "
            "tumor microenvironment composition, spatial niches, ligand-receptor interactions), "
            "likely pitfalls (batch effects, deconvolution artifacts), and possible next steps "
            "for translational follow-up."
        ),
    },
    "biomarker": {
        "id": "biomarker",
        "title": "Biomarker / Translational Reasoning",
        "description": "Propose and justify a multi-marker diagnostic or prognostic panel.",
        "prompt": (
            "Given a cohort of 500 early-stage hepatocellular carcinoma (HCC) patients with "
            "matched tumor/normal whole-exome sequencing, bulk RNA-seq, and serum proteomics, "
            "propose and justify a multi-marker prognostic panel. Consider genomic alterations "
            "(TP53, CTNNB1, TERT promoter), transcriptomic signatures (immune infiltration, "
            "Wnt/beta-catenin activation), and circulating protein biomarkers (AFP, DCP, "
            "GPC3). Explain how you would validate the panel and discuss potential clinical "
            "utility for treatment stratification."
        ),
    },
}

BIOREASON_EXAMPLES = {
    "protein_case_1": {
        "id": "protein_case_1",
        "title": "BRCA1 DNA Repair Function",
        "description": "Predict functional properties of the BRCA1 tumor suppressor protein.",
        "payload": {
            "protein_id": "P38398",
            "organism": "Homo sapiens",
            "sequence": "MDLSALRVEEVQNVINAMQKILECPICLELIKEPVSTKCDHIFCKFCMLKLLNQKKGPSQCPLCKNDI",
        },
    },
    "protein_case_2": {
        "id": "protein_case_2",
        "title": "TP53 Tumor Suppressor",
        "description": "Analyze the functional role of the TP53 protein in cell cycle regulation.",
        "payload": {
            "protein_id": "P04637",
            "organism": "Homo sapiens",
            "sequence": "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGP",
        },
    },
    "protein_case_3": {
        "id": "protein_case_3",
        "title": "Insulin Receptor Signaling",
        "description": "Predict functional properties of the human insulin receptor.",
        "payload": {
            "protein_id": "P06213",
            "organism": "Homo sapiens",
            "sequence": "MATGGRRGAAAAPLLVAVAALLLGAAGHLYPGEVCPGMDIRNNLTRLHELENCSVIEGHLQILLMFKTR",
        },
    },
}


def get_task(task_id: str) -> dict | None:
    return EXAMPLE_TASKS.get(task_id)


def get_bioreason_example(example_id: str) -> dict | None:
    return BIOREASON_EXAMPLES.get(example_id)
