#!/usr/bin/env python3
"""
Task 1 — Data Foundation: builds data/curated/{roles,competencies,courses,assessment_seed}.json
from hand-curation (this script) + traceable ESCO ids looked up from data/raw/esco/.

Implements specs/002-task-1-data-foundation/spec.md FR-001..FR-008 and the shapes in that
feature's data-model.md. Domain and role titles match the already-built frontend prototype
(sk/sk/src/mock/demoData.ts) — a civil-service / National Statistical Office competency
platform — per specs/012-task-11-frontend-foundation/spec.md's Assumptions.

Proficiency scale is 1-4 (Foundation/Working/Advanced/Expert), matching the frontend's
CompetencyLevelNumber type, not the 1-5 scale this feature's data-model.md originally sketched
before the frontend prototype was adopted as ground truth (see that doc's updated note).

Re-run safely: this script only writes to data/curated/, never touches data/raw/esco/.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CURATED_DIR = ROOT / "data" / "curated"

# ---------------------------------------------------------------------------
# Competencies (34) — derived from ESCO (real conceptUris looked up from
# data/raw/esco/skills_en.csv where a clean mapping exists, per spec Edge Cases;
# omitted where the MVP competency doesn't map cleanly to one ESCO skill).
# ---------------------------------------------------------------------------

ESCO_SKILL = "http://data.europa.eu/esco/skill/{}"

COMPETENCIES = [
    # SQL family
    {"id": "sql", "name": "SQL", "description": "Writing and reasoning about SQL queries against relational databases.",
     "parent_competency_id": None, "esco_source_id": ESCO_SKILL.format("598de5b0-5b58-4ea7-8058-a4bc4d18c742")},
    {"id": "sql_select_filtering", "name": "SQL SELECT & Filtering", "description": "Basic SELECT statements, WHERE clauses, and filtering rows.",
     "parent_competency_id": "sql", "esco_source_id": None},
    {"id": "sql_joins", "name": "SQL Joins", "description": "Combining rows from multiple tables with INNER/LEFT/RIGHT/FULL joins.",
     "parent_competency_id": "sql", "esco_source_id": None},
    {"id": "sql_aggregation", "name": "SQL Aggregation & HAVING", "description": "GROUP BY, aggregate functions, and filtering aggregated results.",
     "parent_competency_id": "sql", "esco_source_id": None},
    {"id": "sql_window_functions", "name": "SQL Window Functions", "description": "Ranking, running totals, and partitioned analytics with window functions.",
     "parent_competency_id": "sql", "esco_source_id": None},
    {"id": "sql_ctes", "name": "SQL CTEs", "description": "Structuring complex queries with common table expressions.",
     "parent_competency_id": "sql", "esco_source_id": None},
    {"id": "sql_query_optimization", "name": "SQL Query Optimization", "description": "Reading execution plans and tuning slow queries over large datasets.",
     "parent_competency_id": "sql", "esco_source_id": None},

    # Python family
    {"id": "python", "name": "Python", "description": "General-purpose Python programming for data and analysis tasks.",
     "parent_competency_id": None, "esco_source_id": ESCO_SKILL.format("ccd0a1d9-afda-43d9-b901-96344886e14d")},
    {"id": "python_data_manipulation", "name": "Python Data Manipulation", "description": "Cleaning, reshaping, and joining datasets with pandas.",
     "parent_competency_id": "python", "esco_source_id": None},
    {"id": "python_statistical_computing", "name": "Python Statistical Computing", "description": "Applying statistical methods and modelling in Python (NumPy/SciPy/statsmodels).",
     "parent_competency_id": "python", "esco_source_id": None},

    # Statistics family
    {"id": "statistics", "name": "Statistics", "description": "Applying statistical analysis techniques to real datasets.",
     "parent_competency_id": None, "esco_source_id": ESCO_SKILL.format("382c11ed-20d5-4ae7-b60e-15fec527fa6c")},
    {"id": "descriptive_statistics", "name": "Descriptive Statistics", "description": "Summarizing data with measures of central tendency and dispersion.",
     "parent_competency_id": "statistics", "esco_source_id": None},
    {"id": "inferential_statistics", "name": "Inferential Statistics", "description": "Hypothesis testing, confidence intervals, and generalizing from samples.",
     "parent_competency_id": "statistics", "esco_source_id": None},
    {"id": "survey_methodology", "name": "Survey Methodology", "description": "Sampling design, weighting, and variance estimation for complex surveys.",
     "parent_competency_id": "statistics", "esco_source_id": None},
    {"id": "regression_analysis", "name": "Regression Analysis", "description": "Linear and logistic regression modelling and interpretation.",
     "parent_competency_id": "statistics", "esco_source_id": None},

    # Data visualization family
    {"id": "data_visualization", "name": "Data Visualization", "description": "Communicating data findings through effective visual design.",
     "parent_competency_id": None, "esco_source_id": ESCO_SKILL.format("65e58886-bd1e-4c5b-8ca5-8d9b353c8aa1")},
    {"id": "dashboard_design", "name": "Dashboard Design", "description": "Building interactive dashboards for non-technical stakeholders.",
     "parent_competency_id": "data_visualization", "esco_source_id": None},
    {"id": "statistical_charting", "name": "Statistical Charting", "description": "Choosing and building the right chart type for a statistical claim.",
     "parent_competency_id": "data_visualization", "esco_source_id": None},

    # Machine learning family
    {"id": "machine_learning", "name": "Machine Learning", "description": "Applying machine learning techniques to structured data problems.",
     "parent_competency_id": None, "esco_source_id": ESCO_SKILL.format("3a2d5b45-56e4-4f5a-a55a-4a4a65afdc43")},
    {"id": "supervised_learning", "name": "Supervised Learning", "description": "Training and validating classification/regression models.",
     "parent_competency_id": "machine_learning", "esco_source_id": None},
    {"id": "model_evaluation", "name": "Model Evaluation", "description": "Choosing metrics and diagnosing over/underfitting.",
     "parent_competency_id": "machine_learning", "esco_source_id": None},

    # GIS family
    {"id": "gis", "name": "Geographic Information Systems", "description": "Working with geospatial data and GIS software.",
     "parent_competency_id": None, "esco_source_id": ESCO_SKILL.format("377861af-f966-4c87-a2db-7e99904312b9")},
    {"id": "spatial_data_analysis", "name": "Spatial Data Analysis", "description": "Analysing spatial patterns and relationships in geographic data.",
     "parent_competency_id": "gis", "esco_source_id": None},
    {"id": "gis_software_tools", "name": "GIS Software Tools", "description": "Practical use of GIS software for mapping and analysis.",
     "parent_competency_id": "gis", "esco_source_id": ESCO_SKILL.format("440f64e5-e66c-45ee-bc29-53c14a2ad720")},

    # Database management family
    {"id": "database_management", "name": "Database Management", "description": "Designing and operating relational database management systems.",
     "parent_competency_id": None, "esco_source_id": ESCO_SKILL.format("ab1e97ed-2319-4293-a8b7-072d2648822f")},
    {"id": "relational_database_design", "name": "Relational Database Design", "description": "Schema design, normalization, and indexing strategy.",
     "parent_competency_id": "database_management", "esco_source_id": None},
    {"id": "database_administration", "name": "Database Administration", "description": "Operating, securing, and maintaining a production database.",
     "parent_competency_id": "database_management", "esco_source_id": ESCO_SKILL.format("7369f779-4b71-4aab-8836-48b69c676eec")},

    # Data engineering family
    {"id": "data_engineering", "name": "Data Engineering", "description": "Building pipelines that move and transform data reliably.",
     "parent_competency_id": None, "esco_source_id": None},
    {"id": "etl_pipelines", "name": "ETL Pipelines", "description": "Extracting, transforming, and loading data between systems.",
     "parent_competency_id": "data_engineering", "esco_source_id": None},
    {"id": "data_quality_cleaning", "name": "Data Quality & Cleaning", "description": "Detecting and correcting data quality issues before analysis.",
     "parent_competency_id": "data_engineering", "esco_source_id": None},

    # Standalone / domain competencies
    {"id": "survey_sampling_design", "name": "Survey Sampling Design", "description": "Designing probability samples for official statistics collection.",
     "parent_competency_id": None, "esco_source_id": None},
    {"id": "statistical_report_writing", "name": "Statistical Report Writing", "description": "Writing clear, accurate statistical reports for policy audiences.",
     "parent_competency_id": None, "esco_source_id": None},
    {"id": "data_governance_ethics", "name": "Data Governance & Ethics", "description": "Applying data privacy, security, and governance standards to official data.",
     "parent_competency_id": None, "esco_source_id": None},
    {"id": "stakeholder_communication", "name": "Stakeholder Communication", "description": "Explaining technical findings to non-technical decision-makers.",
     "parent_competency_id": None, "esco_source_id": None},
]

for c in COMPETENCIES:
    c["proficiency_scale_max"] = 4  # Foundation(1) / Working(2) / Advanced(3) / Expert(4)

# ---------------------------------------------------------------------------
# Roles (6) — titles match the frontend prototype's mock role catalog
# (sk/sk/src/mock/demoData.ts), extended with two more roles to broaden gap
# coverage. ESCO occupation ids looked up from data/raw/esco/occupations_en.csv.
# ---------------------------------------------------------------------------

ESCO_OCC = "http://data.europa.eu/esco/occupation/{}"

ROLES = [
    {
        "id": "role-sso-01", "name": "Senior Statistical Officer",
        "description": "Leads official statistics production: survey design, estimation, and reporting for government data programmes.",
        "esco_occupation_id": ESCO_OCC.format("ac8b3cd1-a127-4e6a-8208-5cfcf7111955"),  # statistician
        "required_competencies": [
            {"competency_id": "sql", "required_level": 4, "priority": 1},
            {"competency_id": "sql_window_functions", "required_level": 3, "priority": 2},
            {"competency_id": "statistics", "required_level": 4, "priority": 1},
            {"competency_id": "inferential_statistics", "required_level": 4, "priority": 1},
            {"competency_id": "survey_methodology", "required_level": 3, "priority": 2},
            {"competency_id": "python", "required_level": 3, "priority": 2},
            {"competency_id": "statistical_report_writing", "required_level": 3, "priority": 3},
            {"competency_id": "data_governance_ethics", "required_level": 2, "priority": 3},
        ],
    },
    {
        "id": "role-da-02", "name": "Senior Data Analyst",
        "description": "Turns raw administrative and survey data into decision-ready analysis and dashboards.",
        "esco_occupation_id": ESCO_OCC.format("d3edb8f8-3a06-47a0-8fb9-9b212c006aa2"),  # data analyst
        "required_competencies": [
            {"competency_id": "sql", "required_level": 4, "priority": 1},
            {"competency_id": "sql_joins", "required_level": 3, "priority": 2},
            {"competency_id": "sql_aggregation", "required_level": 3, "priority": 2},
            {"competency_id": "python", "required_level": 3, "priority": 1},
            {"competency_id": "python_data_manipulation", "required_level": 3, "priority": 2},
            {"competency_id": "data_visualization", "required_level": 3, "priority": 2},
            {"competency_id": "dashboard_design", "required_level": 3, "priority": 3},
            {"competency_id": "descriptive_statistics", "required_level": 3, "priority": 3},
        ],
    },
    {
        "id": "role-ds-03", "name": "Lead Data Scientist",
        "description": "Builds predictive models and advanced analytics on top of official statistics datasets.",
        "esco_occupation_id": ESCO_OCC.format("258e46f9-0075-4a2e-adae-1ff0477e0f30"),  # data scientist
        "required_competencies": [
            {"competency_id": "python", "required_level": 4, "priority": 1},
            {"competency_id": "python_statistical_computing", "required_level": 4, "priority": 1},
            {"competency_id": "machine_learning", "required_level": 4, "priority": 1},
            {"competency_id": "supervised_learning", "required_level": 3, "priority": 2},
            {"competency_id": "model_evaluation", "required_level": 3, "priority": 2},
            {"competency_id": "statistics", "required_level": 3, "priority": 2},
            {"competency_id": "regression_analysis", "required_level": 3, "priority": 2},
            {"competency_id": "sql", "required_level": 3, "priority": 3},
        ],
    },
    {
        "id": "role-sp-04", "name": "Statistical Programmer",
        "description": "Implements and optimizes the data pipelines and queries behind official statistics products.",
        "esco_occupation_id": None,
        "required_competencies": [
            {"competency_id": "sql", "required_level": 4, "priority": 1},
            {"competency_id": "sql_query_optimization", "required_level": 4, "priority": 1},
            {"competency_id": "sql_ctes", "required_level": 3, "priority": 2},
            {"competency_id": "python", "required_level": 4, "priority": 1},
            {"competency_id": "python_data_manipulation", "required_level": 3, "priority": 2},
            {"competency_id": "database_administration", "required_level": 3, "priority": 2},
            {"competency_id": "data_quality_cleaning", "required_level": 3, "priority": 3},
        ],
    },
    {
        "id": "role-gis-05", "name": "GIS Analyst",
        "description": "Produces spatial statistics and mapping products from geographic and survey data.",
        "esco_occupation_id": ESCO_OCC.format("9af8907f-56a7-4170-83b1-3c6ba0997cfa"),  # geographic information systems specialist
        "required_competencies": [
            {"competency_id": "gis", "required_level": 4, "priority": 1},
            {"competency_id": "spatial_data_analysis", "required_level": 4, "priority": 1},
            {"competency_id": "gis_software_tools", "required_level": 3, "priority": 2},
            {"competency_id": "sql", "required_level": 3, "priority": 2},
            {"competency_id": "python", "required_level": 2, "priority": 3},
            {"competency_id": "data_visualization", "required_level": 3, "priority": 3},
        ],
    },
    {
        "id": "role-de-06", "name": "Data Engineer",
        "description": "Builds and maintains the data pipelines and databases that feed the statistical office's systems.",
        "esco_occupation_id": ESCO_OCC.format("8c57af09-719c-42b3-be40-6ed4946236cc"),  # database administrator
        "required_competencies": [
            {"competency_id": "sql", "required_level": 4, "priority": 1},
            {"competency_id": "database_management", "required_level": 4, "priority": 1},
            {"competency_id": "relational_database_design", "required_level": 3, "priority": 2},
            {"competency_id": "etl_pipelines", "required_level": 4, "priority": 1},
            {"competency_id": "data_quality_cleaning", "required_level": 3, "priority": 2},
            {"competency_id": "python", "required_level": 3, "priority": 2},
            {"competency_id": "data_governance_ethics", "required_level": 2, "priority": 3},
        ],
    },
]

# ---------------------------------------------------------------------------
# Courses (30) — providers match the frontend prototype's Course.provider
# literal union exactly (sk/sk/src/types/index.ts), so seeded data is directly
# renderable by the already-built Courses/CourseDetail screens.
# ---------------------------------------------------------------------------

PROVIDERS = [
    "iGOT Karmayogi",
    "National Statistical Academy",
    "Ministry of Statistics (MoSPI)",
    "UN Statistics Division",
    "GovTech Institute",
]

COURSES = [
    {"id": "sql-foundations-01", "title": "SQL Foundations for Official Statistics", "provider": PROVIDERS[0],
     "level": "beginner", "duration_hours": 6, "priority": 2,
     "competencies_covered": [{"competency_id": "sql", "coverage_weight": 1.0}, {"competency_id": "sql_select_filtering", "coverage_weight": 1.0}]},
    {"id": "sql-joins-aggregation-02", "title": "SQL Joins & Aggregation in Practice", "provider": PROVIDERS[0],
     "level": "intermediate", "duration_hours": 8, "priority": 1,
     "competencies_covered": [{"competency_id": "sql_joins", "coverage_weight": 1.0}, {"competency_id": "sql_aggregation", "coverage_weight": 1.0}]},
    {"id": "sql-window-analytics-03", "title": "Advanced SQL Analytics", "provider": PROVIDERS[1],
     "level": "advanced", "duration_hours": 10, "priority": 1,
     "competencies_covered": [{"competency_id": "sql_window_functions", "coverage_weight": 1.0}, {"competency_id": "sql_ctes", "coverage_weight": 0.7}]},
    {"id": "sql-performance-tuning-04", "title": "SQL Query Optimization for Large Statistical Datasets", "provider": PROVIDERS[1],
     "level": "advanced", "duration_hours": 8, "priority": 1,
     "competencies_covered": [{"competency_id": "sql_query_optimization", "coverage_weight": 1.0}]},
    {"id": "python-foundations-05", "title": "Python Programming Foundations", "provider": PROVIDERS[0],
     "level": "beginner", "duration_hours": 10, "priority": 2,
     "competencies_covered": [{"competency_id": "python", "coverage_weight": 1.0}]},
    {"id": "python-data-wrangling-06", "title": "Applied Python for Survey Data & Imputation", "provider": PROVIDERS[2],
     "level": "intermediate", "duration_hours": 12, "priority": 1,
     "competencies_covered": [{"competency_id": "python_data_manipulation", "coverage_weight": 1.0}]},
    {"id": "python-stat-computing-07", "title": "Statistical Computing with Python", "provider": PROVIDERS[3],
     "level": "advanced", "duration_hours": 14, "priority": 1,
     "competencies_covered": [{"competency_id": "python_statistical_computing", "coverage_weight": 1.0}]},
    {"id": "applied-statistics-08", "title": "Applied Statistics for Government Analysts", "provider": PROVIDERS[1],
     "level": "beginner", "duration_hours": 10, "priority": 2,
     "competencies_covered": [{"competency_id": "statistics", "coverage_weight": 1.0}, {"competency_id": "descriptive_statistics", "coverage_weight": 1.0}]},
    {"id": "inferential-statistics-09", "title": "Inferential Statistics & Regression Modelling", "provider": PROVIDERS[1],
     "level": "advanced", "duration_hours": 14, "priority": 1,
     "competencies_covered": [{"competency_id": "inferential_statistics", "coverage_weight": 1.0}, {"competency_id": "regression_analysis", "coverage_weight": 1.0}]},
    {"id": "survey-methodology-10", "title": "Complex Survey Design & Variance Estimation", "provider": PROVIDERS[2],
     "level": "intermediate", "duration_hours": 12, "priority": 1,
     "competencies_covered": [{"competency_id": "survey_methodology", "coverage_weight": 1.0}, {"competency_id": "survey_sampling_design", "coverage_weight": 1.0}]},
    {"id": "statistical-reporting-11", "title": "Writing Statistical Reports for Policy Audiences", "provider": PROVIDERS[2],
     "level": "intermediate", "duration_hours": 6, "priority": 2,
     "competencies_covered": [{"competency_id": "statistical_report_writing", "coverage_weight": 1.0}, {"competency_id": "stakeholder_communication", "coverage_weight": 0.6}]},
    {"id": "dataviz-essentials-12", "title": "Data Visualization Essentials", "provider": PROVIDERS[0],
     "level": "intermediate", "duration_hours": 8, "priority": 2,
     "competencies_covered": [{"competency_id": "data_visualization", "coverage_weight": 1.0}, {"competency_id": "dashboard_design", "coverage_weight": 1.0}]},
    {"id": "advanced-charting-13", "title": "Statistical Charting for Public Communication", "provider": PROVIDERS[4],
     "level": "intermediate", "duration_hours": 5, "priority": 3,
     "competencies_covered": [{"competency_id": "statistical_charting", "coverage_weight": 1.0}]},
    {"id": "ml-foundations-14", "title": "Machine Learning Foundations for Analysts", "provider": PROVIDERS[3],
     "level": "advanced", "duration_hours": 16, "priority": 1,
     "competencies_covered": [{"competency_id": "machine_learning", "coverage_weight": 1.0}, {"competency_id": "supervised_learning", "coverage_weight": 1.0}]},
    {"id": "model-evaluation-15", "title": "Model Evaluation & Validation Metrics", "provider": PROVIDERS[3],
     "level": "advanced", "duration_hours": 8, "priority": 2,
     "competencies_covered": [{"competency_id": "model_evaluation", "coverage_weight": 1.0}]},
    {"id": "gis-fundamentals-16", "title": "GIS Fundamentals for Government Analysts", "provider": PROVIDERS[4],
     "level": "beginner", "duration_hours": 10, "priority": 1,
     "competencies_covered": [{"competency_id": "gis", "coverage_weight": 1.0}, {"competency_id": "gis_software_tools", "coverage_weight": 1.0}]},
    {"id": "spatial-data-analysis-17", "title": "Spatial Data Analysis for Statistical Programmes", "provider": PROVIDERS[4],
     "level": "advanced", "duration_hours": 12, "priority": 1,
     "competencies_covered": [{"competency_id": "spatial_data_analysis", "coverage_weight": 1.0}]},
    {"id": "database-mgmt-essentials-18", "title": "Database Management Essentials", "provider": PROVIDERS[0],
     "level": "intermediate", "duration_hours": 10, "priority": 1,
     "competencies_covered": [{"competency_id": "database_management", "coverage_weight": 1.0}, {"competency_id": "relational_database_design", "coverage_weight": 1.0}]},
    {"id": "database-admin-advanced-19", "title": "Advanced Database Administration", "provider": PROVIDERS[1],
     "level": "advanced", "duration_hours": 12, "priority": 2,
     "competencies_covered": [{"competency_id": "database_administration", "coverage_weight": 1.0}]},
    {"id": "data-engineering-etl-20", "title": "Data Engineering & ETL Pipelines for Official Statistics", "provider": PROVIDERS[3],
     "level": "advanced", "duration_hours": 14, "priority": 1,
     "competencies_covered": [{"competency_id": "data_engineering", "coverage_weight": 1.0}, {"competency_id": "etl_pipelines", "coverage_weight": 1.0}]},
    {"id": "data-quality-cleaning-21", "title": "Data Quality & Cleaning in Practice", "provider": PROVIDERS[2],
     "level": "intermediate", "duration_hours": 6, "priority": 2,
     "competencies_covered": [{"competency_id": "data_quality_cleaning", "coverage_weight": 1.0}]},
    {"id": "data-governance-ethics-22", "title": "Data Governance & Ethics for Public Institutions", "provider": PROVIDERS[2],
     "level": "beginner", "duration_hours": 4, "priority": 3,
     "competencies_covered": [{"competency_id": "data_governance_ethics", "coverage_weight": 1.0}]},
    {"id": "stakeholder-communication-23", "title": "Communicating Data to Non-Technical Stakeholders", "provider": PROVIDERS[4],
     "level": "beginner", "duration_hours": 4, "priority": 3,
     "competencies_covered": [{"competency_id": "stakeholder_communication", "coverage_weight": 1.0}]},
    {"id": "sql-for-analysts-24", "title": "SQL for Data Analysts", "provider": PROVIDERS[2],
     "level": "beginner", "duration_hours": 6, "priority": 3,
     "competencies_covered": [{"competency_id": "sql", "coverage_weight": 1.0}, {"competency_id": "sql_aggregation", "coverage_weight": 0.6}]},
    {"id": "python-for-data-science-25", "title": "Python for Data Science", "provider": PROVIDERS[3],
     "level": "intermediate", "duration_hours": 12, "priority": 3,
     "competencies_covered": [{"competency_id": "python", "coverage_weight": 1.0}, {"competency_id": "python_data_manipulation", "coverage_weight": 0.7}]},
    {"id": "advanced-survey-variance-26", "title": "Advanced Survey Variance Estimation", "provider": PROVIDERS[1],
     "level": "advanced", "duration_hours": 10, "priority": 2,
     "competencies_covered": [{"competency_id": "survey_methodology", "coverage_weight": 1.0}, {"competency_id": "inferential_statistics", "coverage_weight": 0.6}]},
    {"id": "dashboard-design-govt-27", "title": "Dashboard Design for Government Reporting", "provider": PROVIDERS[0],
     "level": "intermediate", "duration_hours": 6, "priority": 3,
     "competencies_covered": [{"competency_id": "dashboard_design", "coverage_weight": 1.0}]},
    {"id": "big-data-fundamentals-28", "title": "Big Data Fundamentals for Statistical Agencies", "provider": PROVIDERS[3],
     "level": "intermediate", "duration_hours": 10, "priority": 3,
     "competencies_covered": [{"competency_id": "data_engineering", "coverage_weight": 1.0}, {"competency_id": "etl_pipelines", "coverage_weight": 0.6}]},
    {"id": "relational-db-design-29", "title": "Relational Database Design Deep Dive", "provider": PROVIDERS[1],
     "level": "intermediate", "duration_hours": 8, "priority": 3,
     "competencies_covered": [{"competency_id": "relational_database_design", "coverage_weight": 1.0}]},
    {"id": "ml-model-evaluation-lab-30", "title": "Machine Learning Model Evaluation Lab", "provider": PROVIDERS[4],
     "level": "advanced", "duration_hours": 8, "priority": 3,
     "competencies_covered": [{"competency_id": "model_evaluation", "coverage_weight": 1.0}, {"competency_id": "supervised_learning", "coverage_weight": 0.6}]},
]

# ---------------------------------------------------------------------------
# Assessment seed questions (29) — one per competency required by at least one
# curated role (spec SC-003), MCQ only (Task 6 fallback shape, Rule 5).
# ---------------------------------------------------------------------------

REQUIRED_COMPETENCY_IDS = sorted({
    rc["competency_id"] for role in ROLES for rc in role["required_competencies"]
})

# (competency_id, question, options[4], correct_index, difficulty[1-5], explanation)
SEED_SPECS: list[tuple[str, str, list[str], int, int, str]] = [
    ("sql", "Which SQL clause filters rows before any grouping happens?", ["GROUP BY", "WHERE", "HAVING", "ORDER BY"], 1, 2,
     "WHERE filters individual rows before GROUP BY forms groups; HAVING filters after grouping."),
    ("sql_window_functions", "Which function assigns a running rank to rows within a partition without skipping numbers for ties?", ["RANK()", "DENSE_RANK()", "ROW_NUMBER()", "NTILE()"], 1, 3,
     "DENSE_RANK() never skips rank numbers after a tie, unlike RANK()."),
    ("statistics", "A dataset's mean is much higher than its median. What does this most likely indicate?", ["The data is perfectly symmetric", "The data is right-skewed by high outliers", "The sample size is too small", "The data has no variance"], 1, 2,
     "A mean pulled above the median usually signals right-skew from high-value outliers."),
    ("inferential_statistics", "A 95% confidence interval for a survey estimate means:", ["95% of the population falls in this range", "If repeated sampling were done, 95% of such intervals would contain the true value", "There is a 95% chance the sample mean is correct", "The margin of error is exactly 5%"], 1, 3,
     "The 95% refers to the long-run capture rate of the interval procedure, not a probability about one specific interval."),
    ("survey_methodology", "In a complex survey with unequal selection probabilities, what must be applied before estimating a population total?", ["Nothing — raw counts are unbiased", "Design weights", "A larger sample size", "Removing all missing values"], 1, 3,
     "Design weights correct for unequal selection probabilities so estimates remain unbiased for the population."),
    ("python", "What does the following return? `len([x for x in range(10) if x % 2 == 0])`", ["4", "5", "10", "0"], 1, 2,
     "range(10) has 10 values 0-9; the even ones are 0,2,4,6,8 — five values."),
    ("statistical_report_writing", "What is the primary purpose of an executive summary in a statistical report for policymakers?", ["List every table and figure in the report", "State the key findings and implications in plain language up front", "Describe the statistical software used", "Provide the full methodology appendix"], 1, 1,
     "An executive summary gives busy policy readers the key findings and implications without requiring them to read the full report."),
    ("data_governance_ethics", "Under standard data governance practice, personally identifiable survey respondent data should be:", ["Shared freely for research convenience", "Anonymized/de-identified and access-controlled before wider use", "Stored in plain text for easy access", "Ignored since it's government data"], 1, 2,
     "Personally identifiable data must be de-identified and access-controlled to protect respondent privacy."),
    ("sql_joins", "Which join returns all rows from the left table and matching rows from the right, with NULLs where there's no match?", ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"], 1, 2,
     "LEFT JOIN keeps every row from the left table, filling unmatched right-side columns with NULL."),
    ("sql_aggregation", "Which clause filters groups after aggregation, e.g. `HAVING COUNT(*) > 5`?", ["WHERE", "HAVING", "GROUP BY", "LIMIT"], 1, 2,
     "HAVING operates on aggregated group results, unlike WHERE which filters rows before grouping."),
    ("python_data_manipulation", "In pandas, which method removes rows containing any missing values?", ["df.fillna()", "df.dropna()", "df.drop_duplicates()", "df.isnull()"], 1, 2,
     "dropna() removes rows (or columns) containing missing values; fillna() fills them instead."),
    ("data_visualization", "For comparing a value across many categories, which chart type is generally most effective?", ["Pie chart with 20 slices", "Sorted bar chart", "3D scatter plot", "Word cloud"], 1, 2,
     "A sorted bar chart makes category-to-category comparison far easier to read accurately than a many-slice pie chart."),
    ("dashboard_design", "What is a key principle of dashboard design for non-technical stakeholders?", ["Show every available metric on one screen", "Surface the few metrics that drive decisions, with drill-down for detail", "Use as many colors as possible", "Avoid any labels to keep it clean"], 1, 2,
     "Good dashboards prioritize the handful of decision-relevant metrics, with detail available on demand rather than all at once."),
    ("descriptive_statistics", "Which measure of central tendency is most resistant to extreme outliers?", ["Mean", "Median", "Range", "Standard deviation"], 1, 1,
     "The median is far less affected by extreme values than the mean, since it depends only on rank order."),
    ("python_statistical_computing", "Which Python library is most commonly used for classical statistical modelling (e.g. OLS regression) with R-like formulas?", ["statsmodels", "matplotlib", "requests", "flask"], 0, 3,
     "statsmodels provides R-style formula APIs for classical statistical models like OLS regression."),
    ("machine_learning", "What is the main risk of training a model with too many features relative to the number of observations?", ["Underfitting", "Overfitting", "Faster training only", "No risk at all"], 1, 3,
     "Too many features relative to observations lets the model fit noise in the training data, causing overfitting."),
    ("supervised_learning", "In supervised learning, what does the training set provide that unsupervised learning does not use?", ["Labelled outcomes/targets", "More rows of data", "Faster computation", "Unlabelled clusters"], 0, 2,
     "Supervised learning trains on labelled examples (inputs paired with known outcomes); unsupervised learning does not use labels."),
    ("model_evaluation", "For an imbalanced classification problem (95% negative class), which metric is most misleading if used alone?", ["Accuracy", "Precision", "Recall", "F1 score"], 0, 3,
     "A model predicting the majority class every time scores 95% accuracy despite being useless — accuracy alone is misleading on imbalanced data."),
    ("regression_analysis", "In a simple linear regression, what does the R-squared value represent?", ["The correlation between residuals", "The proportion of variance in the outcome explained by the model", "The number of predictors used", "The p-value of the slope"], 1, 3,
     "R-squared measures how much of the outcome variable's variance is explained by the regression model."),
    ("sql_query_optimization", "What is typically the first thing to check when a query on a large table is slow?", ["Whether an appropriate index exists for the filtered/joined columns", "The font used in the SQL editor", "The number of columns in SELECT *", "The database's backup schedule"], 0, 3,
     "Missing indexes on filtered or joined columns are the most common cause of slow queries on large tables."),
    ("sql_ctes", "What is a key benefit of using a CTE (WITH clause) over a deeply nested subquery?", ["It always runs faster", "It improves readability by naming intermediate result sets", "It removes the need for JOINs", "It bypasses the query optimizer"], 1, 2,
     "CTEs primarily improve readability and structure by giving intermediate result sets a name, not a guaranteed performance boost."),
    ("database_administration", "Which practice most directly protects a production database against data loss?", ["Regular, tested backups", "Disabling all indexes", "Removing all constraints", "Increasing the connection pool size"], 0, 2,
     "Regular, tested backups are the primary safeguard against data loss in a production database."),
    ("data_quality_cleaning", "A dataset has duplicate rows from a failed retry during ingestion. What is the correct first step?", ["Delete the entire dataset", "Identify and remove the duplicate rows based on a natural key", "Average all duplicate values together", "Ignore it — duplicates rarely matter"], 1, 2,
     "Identifying duplicates by a natural/business key and removing the redundant rows is the standard first remediation step."),
    ("gis", "In GIS, what does a 'coordinate reference system' (CRS) define?", ["The color scheme of a map", "How 2D/3D coordinates relate to real locations on Earth", "The file format of the dataset", "The name of the map layer"], 1, 2,
     "A CRS defines how coordinates map to actual locations on the Earth's surface, essential for combining spatial datasets correctly."),
    ("spatial_data_analysis", "What does a 'spatial join' do that a regular attribute join cannot?", ["Joins tables based on geographic relationship (e.g. contains, intersects)", "Joins tables faster than SQL", "Removes the need for a coordinate system", "Joins only numeric columns"], 0, 3,
     "A spatial join matches records based on their geometric relationship (e.g. one polygon containing a point), not shared key values."),
    ("gis_software_tools", "Which of these is a common vector data format used in GIS software?", ["Shapefile (.shp)", "MP3", "CSV without coordinates", "JPEG"], 0, 1,
     "The Shapefile format is one of the most widely used vector formats for storing geographic feature data."),
    ("database_management", "What is the main purpose of normalization in relational database design?", ["To reduce data redundancy and improve integrity", "To make every table have exactly one column", "To remove all foreign keys", "To speed up every query automatically"], 0, 2,
     "Normalization organizes data to reduce redundancy and protect data integrity, though it can trade off against some query performance."),
    ("relational_database_design", "What does a foreign key constraint enforce between two tables?", ["That a column's values must exist in a referenced table's key column", "That both tables have the same number of rows", "That the tables use the same storage engine", "That indexes are automatically created on every column"], 0, 2,
     "A foreign key constraint ensures referential integrity: values in the referencing column must exist in the referenced table's key."),
    ("etl_pipelines", "In an ETL pipeline, at which stage is data typically validated and cleaned?", ["Extract only", "Transform", "Load only", "Never — validation happens downstream"], 1, 2,
     "The Transform stage is where data is typically cleaned, validated, and reshaped before loading into the target system."),
]

_missing_seed_coverage = set(REQUIRED_COMPETENCY_IDS) - {s[0] for s in SEED_SPECS}
assert not _missing_seed_coverage, (
    f"Seed question competency coverage must include every role-required competency id "
    f"(spec SC-003). Missing: {_missing_seed_coverage}"
)

ASSESSMENT_SEED = [
    {
        "id": f"seed-{i:03d}",
        "competency_id": comp_id,
        "question": question,
        "type": "mcq",
        "options": options,
        "correct_answer_index": correct_index,
        "difficulty": difficulty,
        "explanation": explanation,
    }
    for i, (comp_id, question, options, correct_index, difficulty, explanation) in enumerate(SEED_SPECS, start=1)
]


def fill_course_descriptions() -> None:
    """FR-003 requires every course to have a description; derive one from its title, level,
    provider, and covered competencies rather than leaving 30 courses hand-authored one by one."""
    comp_names = {c["id"]: c["name"] for c in COMPETENCIES}
    for course in COURSES:
        covered = ", ".join(comp_names[cc["competency_id"]] for cc in course["competencies_covered"])
        article = "An" if course["level"][0] in "aeiou" else "A"
        course["description"] = (
            f"{article} {course['level']}-level {course['provider']} course on {course['title'].lower()}, "
            f"covering: {covered}."
        )


def write_json(name: str, data) -> None:
    path = CURATED_DIR / name
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)} ({len(data)} entries)")


def validate_referential_integrity() -> None:
    """Mirrors specs/002-task-1-data-foundation/quickstart.md's validation steps."""
    competency_ids = {c["id"] for c in COMPETENCIES}
    errors: list[str] = []

    for c in COMPETENCIES:
        if c["parent_competency_id"] and c["parent_competency_id"] not in competency_ids:
            errors.append(f"competency {c['id']}: parent {c['parent_competency_id']} not found")

    for role in ROLES:
        for rc in role["required_competencies"]:
            if rc["competency_id"] not in competency_ids:
                errors.append(f"role {role['id']}: required competency {rc['competency_id']} not found")

    for course in COURSES:
        for cc in course["competencies_covered"]:
            if cc["competency_id"] not in competency_ids:
                errors.append(f"course {course['id']}: covered competency {cc['competency_id']} not found")

    for seed in ASSESSMENT_SEED:
        if seed["competency_id"] not in competency_ids:
            errors.append(f"seed {seed['id']}: competency {seed['competency_id']} not found")

    # SC-002: every role-required competency has >= 1 covering course
    covered_by_course = {cc["competency_id"] for course in COURSES for cc in course["competencies_covered"]}
    for cid in REQUIRED_COMPETENCY_IDS:
        if cid not in covered_by_course:
            errors.append(f"SC-002 violation: required competency {cid} has no covering course")

    # SC-003: every role-required competency has >= 1 seed question
    seeded = {s["competency_id"] for s in ASSESSMENT_SEED}
    for cid in REQUIRED_COMPETENCY_IDS:
        if cid not in seeded:
            errors.append(f"SC-003 violation: required competency {cid} has no seed question")

    if errors:
        raise SystemExit("Referential integrity check FAILED:\n" + "\n".join(f"  - {e}" for e in errors))

    print(f"Referential integrity OK: {len(COMPETENCIES)} competencies, {len(ROLES)} roles, "
          f"{len(COURSES)} courses, {len(ASSESSMENT_SEED)} seed questions, "
          f"{len(REQUIRED_COMPETENCY_IDS)} distinct required competencies all covered.")


def main() -> None:
    CURATED_DIR.mkdir(parents=True, exist_ok=True)
    fill_course_descriptions()
    validate_referential_integrity()
    write_json("competencies.json", COMPETENCIES)
    write_json("roles.json", ROLES)
    write_json("courses.json", COURSES)
    write_json("assessment_seed.json", ASSESSMENT_SEED)


if __name__ == "__main__":
    main()
