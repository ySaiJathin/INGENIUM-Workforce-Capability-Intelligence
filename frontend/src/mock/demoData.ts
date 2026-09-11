import {
  Candidate,
  TargetRole,
  ExtractedEvidence,
  InitialCapabilityItem,
  AssessmentQuestion,
  AssessmentResultSummary,
  VerifiedCapabilityItem,
  SkillGap,
  Course,
  LearningPath
} from '../types';

export const DEMO_CANDIDATE: Candidate = {
  id: 'cand-0842',
  name: 'Ananya Sharma',
  designation: 'Statistical Officer',
  department: 'National Statistical Office (NSO)',
  cadre: 'Indian Statistical Service / Subordinate Statistical Cadre',
  yearsOfExperience: 4.5,
  location: 'New Delhi, India',
  email: 'ananya.sharma@nso.gov.in',
  employeeCode: 'NSO-2022-8419',
  assessmentStatus: 'Assessment In Progress',
  evidenceSource: 'Resume Uploaded',
  overallConfidence: 'LOW',
  initialProfileGenerated: true,
  selectedRoleId: 'role-sso-01',
  assessmentCompleted: false,
};

export const EXTRACTED_RESUME_EVIDENCE: ExtractedEvidence[] = [
  {
    id: 'ev-1',
    competencyId: 'comp-sql',
    competencyName: 'SQL & Database Querying',
    snippet: '3+ years querying national survey datasets using PostgreSQL and Oracle SQL for tabular reports.',
    estimatedLevel: 3,
    confidence: 'LOW',
    sourceContext: 'Resume: Experience Section (Statistical Officer at NSO 2021-2024)'
  },
  {
    id: 'ev-2',
    competencyId: 'comp-stat-analysis',
    competencyName: 'Statistical Analysis & Inference',
    snippet: 'Conducted sampling weight calculations, variance estimation, and regression modeling on socio-economic sample rounds.',
    estimatedLevel: 3,
    confidence: 'MEDIUM',
    sourceContext: 'Resume: Projects Section (Annual Survey of Industries & PLFS)'
  },
  {
    id: 'ev-3',
    competencyId: 'comp-survey-method',
    competencyName: 'Survey Methodology & Sampling',
    snippet: 'Formulated multi-stage stratified sampling designs and field verification validation rules for regional surveys.',
    estimatedLevel: 3,
    confidence: 'MEDIUM',
    sourceContext: 'Resume: Role Responsibilities & MoSPI Training certification'
  },
  {
    id: 'ev-4',
    competencyId: 'comp-python',
    competencyName: 'Python for Statistical Computing',
    snippet: 'Utilized pandas and numpy for preliminary data munging and exploratory data validation pipelines.',
    estimatedLevel: 2,
    confidence: 'LOW',
    sourceContext: 'Resume: Skills & Tools listed'
  },
  {
    id: 'ev-5',
    competencyId: 'comp-data-viz',
    competencyName: 'Data Visualization & Reporting',
    snippet: 'Built executive summary charts using Power BI and Matplotlib for quarterly ministry publication bulletins.',
    estimatedLevel: 2,
    confidence: 'MEDIUM',
    sourceContext: 'Resume: Reporting Publications Section'
  },
  {
    id: 'ev-6',
    competencyId: 'comp-data-interp',
    competencyName: 'Data Interpretation & Dissemination',
    snippet: 'Drafted analytical briefs interpreting consumer price trends and CPI macro index fluctuations.',
    estimatedLevel: 3,
    confidence: 'LOW',
    sourceContext: 'Resume: Policy Brief contributions'
  },
  {
    id: 'ev-7',
    competencyId: 'comp-sql-opt',
    competencyName: 'SQL Query Optimization',
    snippet: 'Basic query writing referenced; no explicit performance tuning or execution plan optimization cited.',
    estimatedLevel: 2,
    confidence: 'LOW',
    sourceContext: 'Resume: Technical Tools'
  },
  {
    id: 'ev-8',
    competencyId: 'comp-gis-spatial',
    competencyName: 'Spatial & GIS Statistical Analysis',
    snippet: 'No spatial data processing or QGIS integration mentioned in candidate documentation.',
    estimatedLevel: 1,
    confidence: 'LOW',
    sourceContext: 'Resume: Unmentioned'
  }
];

export const INITIAL_CAPABILITY_PROFILE: InitialCapabilityItem[] = [
  {
    competencyId: 'comp-sql',
    competencyName: 'SQL & Database Querying',
    category: 'Technical',
    estimatedLevel: 3,
    evidence: 'Self-reported 3+ years experience in SQL queries for surveys; unverified against large dataset schemas.',
    confidence: 'LOW',
    verificationStatus: 'NEEDS_ASSESSMENT'
  },
  {
    competencyId: 'comp-stat-analysis',
    competencyName: 'Statistical Analysis & Inference',
    category: 'Statistical',
    estimatedLevel: 3,
    evidence: 'Documented involvement in PLFS sampling validation and regression models.',
    confidence: 'MEDIUM',
    verificationStatus: 'NEEDS_ASSESSMENT'
  },
  {
    competencyId: 'comp-survey-method',
    competencyName: 'Survey Methodology & Sampling',
    category: 'Methodological',
    estimatedLevel: 3,
    evidence: 'Completed official MoSPI stratified sampling protocols and field verification training.',
    confidence: 'MEDIUM',
    verificationStatus: 'NEEDS_ASSESSMENT'
  },
  {
    competencyId: 'comp-python',
    competencyName: 'Python for Statistical Computing',
    category: 'Technical',
    estimatedLevel: 2,
    evidence: 'Listed pandas/numpy usage for CSV cleaning; lacks evidence on statistical modeling packages.',
    confidence: 'LOW',
    verificationStatus: 'NEEDS_ASSESSMENT'
  },
  {
    competencyId: 'comp-data-viz',
    competencyName: 'Data Visualization & Reporting',
    category: 'Analytical',
    estimatedLevel: 2,
    evidence: 'PowerBI and matplotlib charts referenced in quarterly bulletin preparation.',
    confidence: 'MEDIUM',
    verificationStatus: 'NEEDS_ASSESSMENT'
  },
  {
    competencyId: 'comp-data-interp',
    competencyName: 'Data Interpretation & Dissemination',
    category: 'Analytical',
    estimatedLevel: 3,
    evidence: 'Drafted CPI index briefs and summary commentary for policy stakeholders.',
    confidence: 'LOW',
    verificationStatus: 'NEEDS_ASSESSMENT'
  },
  {
    competencyId: 'comp-sql-opt',
    competencyName: 'SQL Query Optimization',
    category: 'Technical',
    estimatedLevel: 2,
    evidence: 'Basic SELECT/JOIN syntax used; index tuning and execution plans not demonstrated.',
    confidence: 'LOW',
    verificationStatus: 'NEEDS_ASSESSMENT'
  },
  {
    competencyId: 'comp-gis-spatial',
    competencyName: 'Spatial & GIS Statistical Analysis',
    category: 'Domain',
    estimatedLevel: 1,
    evidence: 'No recorded GIS/spatial analysis coursework or project deliverable found in resume.',
    confidence: 'LOW',
    verificationStatus: 'NEEDS_ASSESSMENT'
  }
];

export const TARGET_ROLES: TargetRole[] = [
  {
    id: 'role-sso-01',
    title: 'Senior Statistical Officer',
    department: 'National Statistical Office / MoSPI',
    band: 'Grade B (Gazetted)',
    summary: 'Leads large-scale nationwide survey rounds, statistical quality audits, data pipelines, and policy indicators.',
    description: 'The Senior Statistical Officer leads analytical pipelines across national sample surveys, manages microdata cleaning, performs advanced statistical inference, optimizes large database queries, and produces high-impact government publications.',
    competencyCount: 8,
    criticalFocus: ['SQL Query Optimization', 'Statistical Analysis', 'Python Statistical Programming', 'Survey Quality Audit'],
    requiredCompetencies: [
      {
        competencyId: 'comp-stat-analysis',
        competencyName: 'Statistical Analysis & Inference',
        category: 'Statistical',
        requiredLevel: 4,
        isCore: true,
        importance: 'CRITICAL',
        rationale: 'Must design multivariate hypothesis tests and population-level estimation algorithms without supervision.'
      },
      {
        competencyId: 'comp-sql',
        competencyName: 'SQL & Database Querying',
        category: 'Technical',
        requiredLevel: 4,
        isCore: true,
        importance: 'CRITICAL',
        rationale: 'Must craft complex window aggregations, recursive CTEs, and extract census-scale data extracts.'
      },
      {
        competencyId: 'comp-sql-opt',
        competencyName: 'SQL Query Optimization',
        category: 'Technical',
        requiredLevel: 4,
        isCore: true,
        importance: 'CRITICAL',
        rationale: 'Senior Officers are expected to optimize queries against large statistical datasets (>50M records) without memory spills.'
      },
      {
        competencyId: 'comp-survey-method',
        competencyName: 'Survey Methodology & Sampling',
        category: 'Methodological',
        requiredLevel: 3,
        isCore: true,
        importance: 'HIGH',
        rationale: 'Required to audit cluster sampling designs and non-sampling error correction schemes.'
      },
      {
        competencyId: 'comp-python',
        competencyName: 'Python for Statistical Computing',
        category: 'Technical',
        requiredLevel: 3,
        isCore: true,
        importance: 'HIGH',
        rationale: 'Must build automated data imputation and statistical validation scripts using SciPy/Statsmodels.'
      },
      {
        competencyId: 'comp-data-viz',
        competencyName: 'Data Visualization & Reporting',
        category: 'Analytical',
        requiredLevel: 3,
        isCore: false,
        importance: 'HIGH',
        rationale: 'Must create interactive publication-grade dashboards conforming to National Data Dissemination standards.'
      },
      {
        competencyId: 'comp-data-interp',
        competencyName: 'Data Interpretation & Dissemination',
        category: 'Analytical',
        requiredLevel: 3,
        isCore: false,
        importance: 'MEDIUM',
        rationale: 'Translates statistical findings into actionable executive briefs for planning ministries.'
      },
      {
        competencyId: 'comp-gis-spatial',
        competencyName: 'Spatial & GIS Statistical Analysis',
        category: 'Domain',
        requiredLevel: 2,
        isCore: false,
        importance: 'MEDIUM',
        rationale: 'Performs district-level choropleth mapping and spatial auto-correlation checks.'
      }
    ]
  },
  {
    id: 'role-da-02',
    title: 'Senior Data Analyst',
    department: 'Data & Informatics Directorate',
    band: 'Grade B',
    summary: 'Focuses on operational metrics, ministry KPI dashboards, data extraction pipelines, and automated reporting.',
    description: 'Responsible for end-to-end data pipelines, business intelligence dashboards, and exploratory metric analysis across inter-ministerial databases.',
    competencyCount: 7,
    criticalFocus: ['SQL Query Optimization', 'Data Visualization', 'Automated ETL'],
    requiredCompetencies: [
      {
        competencyId: 'comp-sql',
        competencyName: 'SQL & Database Querying',
        category: 'Technical',
        requiredLevel: 4,
        isCore: true,
        importance: 'CRITICAL',
        rationale: 'Direct database ingestion and analytical query writing.'
      },
      {
        competencyId: 'comp-data-viz',
        competencyName: 'Data Visualization & Reporting',
        category: 'Analytical',
        requiredLevel: 4,
        isCore: true,
        importance: 'CRITICAL',
        rationale: 'Executive BI dashboards and visual storytelling.'
      },
      {
        competencyId: 'comp-python',
        competencyName: 'Python for Statistical Computing',
        category: 'Technical',
        requiredLevel: 3,
        isCore: true,
        importance: 'HIGH',
        rationale: 'Automated data pipelines.'
      }
    ]
  },
  {
    id: 'role-ds-03',
    title: 'Lead Data Scientist',
    department: 'National Analytics & AI Division',
    band: 'Grade A',
    summary: 'Develops predictive econometric models, machine learning pipelines, and advanced micro-simulation models.',
    description: 'Designs predictive algorithms, time-series forecasting systems for macroeconomic indicators, and supervised ML models.',
    competencyCount: 9,
    criticalFocus: ['Machine Learning', 'Python/R Advanced Modeling', 'Distributed Computing'],
    requiredCompetencies: [
      {
        competencyId: 'comp-python',
        competencyName: 'Python for Statistical Computing',
        category: 'Technical',
        requiredLevel: 4,
        isCore: true,
        importance: 'CRITICAL',
        rationale: 'Production ML pipeline development.'
      },
      {
        competencyId: 'comp-stat-analysis',
        competencyName: 'Statistical Analysis & Inference',
        category: 'Statistical',
        requiredLevel: 4,
        isCore: true,
        importance: 'CRITICAL',
        rationale: 'Mathematical foundation for deep learning and Bayesian models.'
      }
    ]
  },
  {
    id: 'role-sp-04',
    title: 'Statistical Programmer',
    department: 'Survey Processing Division',
    band: 'Grade B',
    summary: 'Specializes in computational statistics, SAS/R/Python pipeline automation, and large microdata processing.',
    description: 'Constructs batch microdata validation scripts, implements automated editing and imputation routines for national census datasets.',
    competencyCount: 7,
    criticalFocus: ['Data Munging', 'Statistical Scripting', 'Batch Data Validation'],
    requiredCompetencies: [
      {
        competencyId: 'comp-python',
        competencyName: 'Python for Statistical Computing',
        category: 'Technical',
        requiredLevel: 4,
        isCore: true,
        importance: 'CRITICAL',
        rationale: 'Core batch validation programming.'
      }
    ]
  }
];

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q-1',
    competencyId: 'comp-sql',
    competencyName: 'SQL & Database Querying',
    difficulty: 'Intermediate',
    questionNumber: 1,
    totalQuestions: 6,
    scenario: 'National Sample Survey Database (PostgreSQL 15): Table "survey_transactions" contains 12 million records of enterprise expenditures across 36 states and 850 industry codes.',
    questionText: 'Which SQL approach would be most appropriate for calculating the average transaction value for each department while strictly excluding departments that have fewer than 10 total transactions recorded?',
    codeSnippet: `-- Schema: survey_transactions (id, dept_id, transaction_amt, txn_date)`,
    options: [
      {
        id: 'opt-a',
        text: 'SELECT dept_id, AVG(transaction_amt) FROM survey_transactions WHERE COUNT(id) >= 10 GROUP BY dept_id;'
      },
      {
        id: 'opt-b',
        text: 'SELECT dept_id, AVG(transaction_amt) FROM survey_transactions GROUP BY dept_id HAVING COUNT(id) >= 10;'
      },
      {
        id: 'opt-c',
        text: 'SELECT dept_id, AVG(transaction_amt) FROM survey_transactions WHERE transaction_amt >= 10 GROUP BY dept_id;'
      },
      {
        id: 'opt-d',
        text: 'SELECT dept_id, MEAN(transaction_amt) OVER (PARTITION BY dept_id) FROM survey_transactions WHERE ROW_NUMBER() >= 10;'
      }
    ],
    correctOptionId: 'opt-b',
    probingReason: 'Verifying SQL aggregation lifecycle understanding: distinguishing WHERE (row filter before aggregation) from HAVING (filter after group aggregation).',
    explanation: 'The HAVING clause filters aggregated group results after GROUP BY evaluation. Aggregate functions like COUNT() cannot appear in a WHERE clause.',
    adaptiveBranchNote: 'SQL Fundamentals verified. Assessment is now probing SQL Aggregation & Windowing capability.'
  },
  {
    id: 'q-2',
    competencyId: 'comp-sql-opt',
    competencyName: 'SQL Query Optimization',
    difficulty: 'Advanced',
    questionNumber: 2,
    totalQuestions: 6,
    scenario: 'You are analyzing a query that joins "households" (45M rows) with "expenditure_items" (320M rows). The execution plan reveals a sequential scan and high buffer spill to disk.',
    questionText: 'When diagnosing a slow query with large multi-table joins, which optimization strategy delivers the greatest performance gain in a statistical analytical workload?',
    options: [
      {
        id: 'opt-a',
        text: 'Add composite B-Tree indexes on the foreign key join columns and consider table partitioning by survey year/state.'
      },
      {
        id: 'opt-b',
        text: 'Replace all INNER JOIN clauses with CROSS JOIN to avoid index lookups.'
      },
      {
        id: 'opt-c',
        text: 'Wrap the query inside a non-materialized view without indexing.'
      },
      {
        id: 'opt-d',
        text: 'Increase work_mem globally without verifying hardware memory constraints or index coverage.'
      }
    ],
    correctOptionId: 'opt-a',
    probingReason: 'Probing execution plan diagnostic capability and knowledge of indexing & partitioning on multi-million row statistical schemas.',
    explanation: 'Composite indexes on join keys alongside range partitioning prevent exhaustive sequential table scans across multi-gigabyte statistical rounds.',
    adaptiveBranchNote: 'Probing candidate depth in database query performance under high data volume.'
  },
  {
    id: 'q-3',
    competencyId: 'comp-stat-analysis',
    competencyName: 'Statistical Analysis & Inference',
    difficulty: 'Advanced',
    questionNumber: 3,
    totalQuestions: 6,
    scenario: 'In a nationwide consumer expenditure survey with a two-stage stratified cluster sample design, simple random sampling formulas underestimate the standard errors.',
    questionText: 'How should you properly estimate the standard errors and confidence intervals for the national mean expenditure indicator?',
    options: [
      {
        id: 'opt-a',
        text: 'Calculate standard deviation using standard sample standard error: s / sqrt(n), ignoring the design effect.'
      },
      {
        id: 'opt-b',
        text: 'Apply Taylor Series Linearization or Replicate Weight methods (Jackknife / BRR) accounting for primary sampling units (PSU) and strata.'
      },
      {
        id: 'opt-c',
        text: 'Multiply all sample weights by 100 to artificially increase sample size and reduce variance.'
      },
      {
        id: 'opt-d',
        text: 'Omit sampling weights altogether because large sample sizes eliminate clustering bias.'
      }
    ],
    correctOptionId: 'opt-b',
    probingReason: 'Assessing mastery of complex survey variance estimation and design-based statistical inference.',
    explanation: 'Cluster sampling introduces positive intra-class correlation. Complex survey estimation requires Taylor Series Linearization or replication techniques to avoid severe anti-conservative bias in p-values.',
    adaptiveBranchNote: 'Candidate demonstrated Advanced (Level 4) mastery in complex survey statistical inference.'
  },
  {
    id: 'q-4',
    competencyId: 'comp-python',
    competencyName: 'Python for Statistical Computing',
    difficulty: 'Intermediate',
    questionNumber: 4,
    totalQuestions: 6,
    scenario: 'You have a pandas DataFrame "df_survey" with 5 million rows containing household income with 8% missing values distributed completely at random (MCAR).',
    questionText: 'Which Python statistical workflow is most methodologically sound for imputing missing values and running an ordinary least squares regression in Statsmodels?',
    codeSnippet: `import pandas as pd
import statsmodels.api as sm`,
    options: [
      {
        id: 'opt-a',
        text: 'Impute missing values using Multiple Imputation by Chained Equations (MICE) or group medians before fitting sm.OLS(y, X).'
      },
      {
        id: 'opt-b',
        text: 'Fill all missing cells with 0 using df_survey.fillna(0) regardless of variable distribution.'
      },
      {
        id: 'opt-c',
        text: 'Replace missing values with the maximum value observed in the dataset.'
      },
      {
        id: 'opt-d',
        text: 'Delete the entire column from the dataset if any missing value exists.'
      }
    ],
    correctOptionId: 'opt-a',
    probingReason: 'Testing scientific data processing rigor in Python, imputation methods, and statsmodels API usage.',
    explanation: 'Zero imputation distorts variance and covariance structures. Principled statistical imputation (MICE / donor hot-deck) preserves distribution variance before regression fitting.',
    adaptiveBranchNote: 'Testing candidate proficiency in programmatic statistical modeling vs simple script execution.'
  },
  {
    id: 'q-5',
    competencyId: 'comp-survey-method',
    competencyName: 'Survey Methodology & Sampling',
    difficulty: 'Advanced',
    questionNumber: 5,
    totalQuestions: 6,
    scenario: 'During the tabulation of a periodic labor force round, a non-response rate of 14% is detected in high-income urban sampling clusters.',
    questionText: 'What methodological adjustment should the statistical officer implement to correct for unit non-response bias across population sub-groups?',
    options: [
      {
        id: 'opt-a',
        text: 'Recalibrate sample weights using post-stratification or non-response weighting class adjustments aligned with census demographic benchmarks.'
      },
      {
        id: 'opt-b',
        text: 'Duplicate the records of responding households until the total count equals the original sample size.'
      },
      {
        id: 'opt-c',
        text: 'Remove the entire urban stratum from the national estimate publication.'
      },
      {
        id: 'opt-d',
        text: 'Ignore the non-response rate since 86% response rate is statistically sufficient.'
      }
    ],
    correctOptionId: 'opt-a',
    probingReason: 'Evaluating capacity to audit survey data quality, detect differential attrition, and apply post-stratification weight calibration.',
    explanation: 'Weight adjustment classes and generalized regression calibration re-align weighted sample totals with known auxiliary population totals.',
    adaptiveBranchNote: 'Survey methodology verified at Level 3 (Working/Advanced).'
  },
  {
    id: 'q-6',
    competencyId: 'comp-data-viz',
    competencyName: 'Data Visualization & Reporting',
    difficulty: 'Intermediate',
    questionNumber: 6,
    totalQuestions: 6,
    scenario: 'An executive policy dashboard needs to communicate the multi-dimensional poverty index across 28 states alongside confidence intervals.',
    questionText: 'Which visualization principle best satisfies accessibility and statistical integrity for public government dissemination?',
    options: [
      {
        id: 'opt-a',
        text: 'Ordered horizontal dot-and-whisker plots showing point estimates with 95% confidence intervals and dual-encoded color palettes.'
      },
      {
        id: 'opt-b',
        text: '3D pie charts with exploded slices and rainbow gradients.'
      },
      {
        id: 'opt-c',
        text: 'A dense unformatted 500-cell HTML table with no visual sorting or baseline comparisons.'
      },
      {
        id: 'opt-d',
        text: 'Conceal confidence bounds to avoid confusing non-technical decision makers.'
      }
    ],
    correctOptionId: 'opt-a',
    probingReason: 'Verifying adherence to statistical data dissemination standards and accessible visual encoding.',
    explanation: 'Dot plots with error bars clearly display point estimates and uncertainty ranges without visual clutter or 3D distortion.',
    adaptiveBranchNote: 'Adaptive Assessment Completed. Calculating verified capability matrix.'
  }
];

export const VERIFIED_ASSESSMENT_RESULTS: AssessmentResultSummary = {
  candidateId: 'cand-0842',
  targetRoleId: 'role-sso-01',
  roleReadinessScore: 72, // 72% Overall Role Readiness
  competenciesAssessedCount: 8,
  strongCount: 4,
  developingCount: 2,
  priorityGapsCount: 2,
  competencyEvaluations: [
    {
      competencyId: 'comp-stat-analysis',
      competencyName: 'Statistical Analysis & Inference',
      initialLevel: 3,
      verifiedLevel: 4,
      requiredLevel: 4,
      confidence: 'HIGH',
      evidence: 'BOTH',
      status: 'READY',
      scorePercent: 95,
      feedback: 'Demonstrated expert mastery of complex variance estimation, stratified sampling weights, and inference testing.'
    },
    {
      competencyId: 'comp-survey-method',
      competencyName: 'Survey Methodology & Sampling',
      initialLevel: 3,
      verifiedLevel: 3,
      requiredLevel: 3,
      confidence: 'HIGH',
      evidence: 'BOTH',
      status: 'READY',
      scorePercent: 90,
      feedback: 'Verified solid command of post-stratification calibrations, non-response adjustments, and field audit standards.'
    },
    {
      competencyId: 'comp-data-interp',
      competencyName: 'Data Interpretation & Dissemination',
      initialLevel: 3,
      verifiedLevel: 3,
      requiredLevel: 3,
      confidence: 'HIGH',
      evidence: 'BOTH',
      status: 'READY',
      scorePercent: 88,
      feedback: 'Clear capability in translating macro statistical indices to ministerial policy commentary.'
    },
    {
      competencyId: 'comp-sql',
      competencyName: 'SQL & Database Querying',
      initialLevel: 3,
      verifiedLevel: 3,
      requiredLevel: 4,
      confidence: 'HIGH',
      evidence: 'BOTH',
      status: 'DEVELOPING',
      scorePercent: 78,
      feedback: 'Solid in GROUP BY/HAVING filtering and multi-table joins. Needs advanced recursive CTEs and analytical window functions.'
    },
    {
      competencyId: 'comp-data-viz',
      competencyName: 'Data Visualization & Reporting',
      initialLevel: 2,
      verifiedLevel: 3,
      requiredLevel: 3,
      confidence: 'HIGH',
      evidence: 'BOTH',
      status: 'READY',
      scorePercent: 84,
      feedback: 'Exhibited strong grasp of statistical dissemination standards and error-bound chart designs.'
    },
    {
      competencyId: 'comp-sql-opt',
      competencyName: 'SQL Query Optimization',
      initialLevel: 2,
      verifiedLevel: 2,
      requiredLevel: 4,
      confidence: 'HIGH',
      evidence: 'ASSESSMENT',
      status: 'CRITICAL_GAP',
      scorePercent: 45,
      feedback: 'Identified significant performance bottleneck knowledge gap on multi-million row statistical schemas and execution plans.'
    },
    {
      competencyId: 'comp-python',
      competencyName: 'Python for Statistical Computing',
      initialLevel: 2,
      verifiedLevel: 2,
      requiredLevel: 3,
      confidence: 'HIGH',
      evidence: 'BOTH',
      status: 'GAP',
      scorePercent: 60,
      feedback: 'Basic pandas data frame handling verified; requires advancement into SciPy/Statsmodels automated statistical pipelines.'
    },
    {
      competencyId: 'comp-gis-spatial',
      competencyName: 'Spatial & GIS Statistical Analysis',
      initialLevel: 1,
      verifiedLevel: 1,
      requiredLevel: 2,
      confidence: 'MEDIUM',
      evidence: 'ASSESSMENT',
      status: 'GAP',
      scorePercent: 40,
      feedback: 'Lacks spatial join and GIS district-level mapping workflow experience.'
    }
  ]
};

export const VERIFIED_CAPABILITY_PROFILE: VerifiedCapabilityItem[] = [
  {
    competencyId: 'comp-stat-analysis',
    competencyName: 'Statistical Analysis & Inference',
    category: 'Statistical',
    verifiedLevel: 4,
    targetLevel: 4,
    confidence: 'HIGH',
    evidence: 'BOTH',
    status: 'READY',
    notes: 'Exceeds expectation. Fully capable of independent complex survey modeling.'
  },
  {
    competencyId: 'comp-survey-method',
    competencyName: 'Survey Methodology & Sampling',
    category: 'Methodological',
    verifiedLevel: 3,
    targetLevel: 3,
    confidence: 'HIGH',
    evidence: 'BOTH',
    status: 'READY',
    notes: 'Fully aligned with Senior Statistical Officer survey auditing standards.'
  },
  {
    competencyId: 'comp-data-interp',
    competencyName: 'Data Interpretation & Dissemination',
    category: 'Analytical',
    verifiedLevel: 3,
    targetLevel: 3,
    confidence: 'HIGH',
    evidence: 'BOTH',
    status: 'READY',
    notes: 'Meets role threshold for ministerial dissemination.'
  },
  {
    competencyId: 'comp-data-viz',
    competencyName: 'Data Visualization & Reporting',
    category: 'Analytical',
    verifiedLevel: 3,
    targetLevel: 3,
    confidence: 'HIGH',
    evidence: 'BOTH',
    status: 'READY',
    notes: 'Promoted from Level 2 to Level 3 based on adaptive test results.'
  },
  {
    competencyId: 'comp-sql',
    competencyName: 'SQL & Database Querying',
    category: 'Technical',
    verifiedLevel: 3,
    targetLevel: 4,
    confidence: 'HIGH',
    evidence: 'BOTH',
    status: 'DEVELOPING',
    notes: 'Level 3 verified. 1 level gap remains for expert census database queries.'
  },
  {
    competencyId: 'comp-sql-opt',
    competencyName: 'SQL Query Optimization',
    category: 'Technical',
    verifiedLevel: 2,
    targetLevel: 4,
    confidence: 'HIGH',
    evidence: 'ASSESSMENT',
    status: 'CRITICAL_GAP',
    notes: '2-level gap identified. Critical priority for large dataset processing.'
  },
  {
    competencyId: 'comp-python',
    competencyName: 'Python for Statistical Computing',
    category: 'Technical',
    verifiedLevel: 2,
    targetLevel: 3,
    confidence: 'HIGH',
    evidence: 'BOTH',
    status: 'GAP',
    notes: '1-level gap in statistical automation algorithms.'
  },
  {
    competencyId: 'comp-gis-spatial',
    competencyName: 'Spatial & GIS Statistical Analysis',
    category: 'Domain',
    verifiedLevel: 1,
    targetLevel: 2,
    confidence: 'MEDIUM',
    evidence: 'ASSESSMENT',
    status: 'GAP',
    notes: '1-level gap in spatial visualization for district bulletins.'
  }
];

export const SKILL_GAPS: SkillGap[] = [
  {
    id: 'gap-sql-opt',
    competencyId: 'comp-sql-opt',
    competencyName: 'SQL Query Optimization',
    category: 'Technical',
    currentLevel: 2,
    requiredLevel: 4,
    gapMagnitude: 2,
    priority: 'CRITICAL',
    whyItMatters: 'Senior Statistical Officers are expected to optimize queries against large statistical datasets (>50M records) without memory spills or database timeout delays.',
    recommendedAction: 'Complete the "SQL Query Optimization for Statistical Big Data" training pathway on iGOT Karmayogi.',
    expectedTimelineWeeks: 3,
    impactArea: 'Direct Data Ingestion & Batch Tabulation Speed'
  },
  {
    id: 'gap-python-stat',
    competencyId: 'comp-python',
    competencyName: 'Python for Statistical Computing',
    category: 'Technical',
    currentLevel: 2,
    requiredLevel: 3,
    gapMagnitude: 1,
    priority: 'HIGH',
    whyItMatters: 'Modernizing legacy batch validation scripts requires writing automated imputation algorithms and variance estimation routines in Python.',
    recommendedAction: 'Complete "Applied Python for Survey Data & Imputation" with practical MoSPI pipeline labs.',
    expectedTimelineWeeks: 2,
    impactArea: 'Survey Processing Automation & Reproducibility'
  },
  {
    id: 'gap-sql-adv',
    competencyId: 'comp-sql',
    competencyName: 'Advanced SQL Analytical Functions',
    category: 'Technical',
    currentLevel: 3,
    requiredLevel: 4,
    gapMagnitude: 1,
    priority: 'HIGH',
    whyItMatters: 'Complex cohort cross-tabulations and multi-year longitudinal linking require recursive CTEs and windowing partitions.',
    recommendedAction: 'Engage with "Advanced SQL for Statistical Data Processing" micro-modules.',
    expectedTimelineWeeks: 2,
    impactArea: 'Longitudinal Statistical Tabulation'
  },
  {
    id: 'gap-gis-spatial',
    competencyId: 'comp-gis-spatial',
    competencyName: 'Spatial & GIS Statistical Analysis',
    category: 'Domain',
    currentLevel: 1,
    requiredLevel: 2,
    gapMagnitude: 1,
    priority: 'MEDIUM',
    whyItMatters: 'Enables generation of spatial thematic maps and district disparity overlays for ministerial bulletins.',
    recommendedAction: 'Complete "Introduction to Spatial Data Analysis with QGIS & Python".',
    expectedTimelineWeeks: 2,
    impactArea: 'Geographic Dissemination & Thematic Mapping'
  }
];

export const RECOMMENDED_COURSES: Course[] = [
  {
    id: 'course-sql-opt-01',
    title: 'SQL Query Optimization for Statistical Big Data',
    provider: 'iGOT Karmayogi',
    providerBadge: 'Government Certified',
    durationHours: 4.5,
    difficulty: 'Advanced',
    rating: 4.9,
    reviewsCount: 1420,
    format: 'Self-Paced Interactive',
    overview: 'Master query performance tuning on massive government databases. Covers execution plan analysis (EXPLAIN ANALYZE), composite index architectures, partition pruning, and memory tuning for multi-million record survey joins.',
    targetGapCompetencies: ['SQL Query Optimization', 'SQL & Database Querying'],
    closesGapDescription: 'Closes SQL Query Optimization (Level 2 → Level 4) & Advanced SQL (Level 3 → Level 4)',
    expectedPathway: {
      fromLevel: 2,
      toLevel: 4
    },
    matchScore: 96,
    priority: 'CRITICAL',
    modules: [
      {
        title: 'Module 1: Execution Plan Anatomy & Cost Metrics',
        duration: '1h 15m',
        topics: ['Reading EXPLAIN (BUFFERS, ANALYZE)', 'Identifying Sequential Scans vs Index Scans', 'Buffer cache hits & disk spills']
      },
      {
        title: 'Module 2: Advanced Indexing & Partitioning Strategy',
        duration: '1h 45m',
        topics: ['Composite B-Tree & Partial Indexes', 'Declarative Range & List Table Partitioning', 'Index bloat remediation']
      },
      {
        title: 'Module 3: Hands-on Lab: Optimizing 50M Survey Dataset',
        duration: '1h 30m',
        topics: ['Refactoring sluggish subqueries into CTEs', 'Optimizing GROUP BY aggregation hash tables', 'Work_mem calibration']
      }
    ],
    prerequisites: ['Working SQL (Level 2+)', 'Basic relational algebra'],
    learningOutcomes: [
      'Diagnose and eliminate costly table scans in PostgreSQL/Oracle',
      'Design composite indexes tailored for statistical filtering dimensions',
      'Optimize query execution time by 80%+ on national sample microdata'
    ],
    certificationOffered: true
  },
  {
    id: 'course-py-stat-02',
    title: 'Applied Python for Survey Data & Imputation',
    provider: 'National Statistical Academy',
    providerBadge: 'MoSPI Accredited',
    durationHours: 6.0,
    difficulty: 'Intermediate',
    rating: 4.8,
    reviewsCount: 890,
    format: 'Cohort-Based Workshop',
    overview: 'Transition from basic scripting to scientific survey data engineering. Implement automated data imputation (MICE, Hot-deck), complex sample weighting, and statistical quality audits in Python.',
    targetGapCompetencies: ['Python for Statistical Computing'],
    closesGapDescription: 'Closes Python for Statistical Computing (Level 2 → Level 3)',
    expectedPathway: {
      fromLevel: 2,
      toLevel: 3
    },
    matchScore: 92,
    priority: 'HIGH',
    modules: [
      {
        title: 'Module 1: Vectorized Microdata Cleaning with Pandas 2.0',
        duration: '1h 30m',
        topics: ['Arrow backend integration', 'Vectorized string and categorical operations', 'Handling missing code conventions (-9, -8)']
      },
      {
        title: 'Module 2: Statistical Imputation & Quality Metrics',
        duration: '2h 15m',
        topics: ['MICE algorithm with IterativeImputer', 'Donor hot-deck imputation algorithms', 'Pre/Post imputation variance checks']
      },
      {
        title: 'Module 3: Statistical Modeling with Statsmodels',
        duration: '2h 15m',
        topics: ['Survey-weighted GLM models', 'Hypothesis testing on complex sample surveys', 'Automating publication tables']
      }
    ],
    prerequisites: ['Basic Python syntax', 'Elementary probability theory'],
    learningOutcomes: [
      'Build end-to-end automated survey cleaning pipelines in Python',
      'Execute scientifically rigorous missing data imputation',
      'Generate publication-grade summary statistics with survey weights'
    ],
    certificationOffered: true
  },
  {
    id: 'course-sql-adv-03',
    title: 'Advanced SQL Analytical Processing & Window Functions',
    provider: 'iGOT Karmayogi',
    providerBadge: 'Government Certified',
    durationHours: 3.5,
    difficulty: 'Advanced',
    rating: 4.7,
    reviewsCount: 2150,
    format: 'Micro-Learning Modules',
    overview: 'Deep dive into analytical window functions, recursive common table expressions, ranking algorithms, and time-series cohort partitioning for government administrative databases.',
    targetGapCompetencies: ['SQL & Database Querying'],
    closesGapDescription: 'Closes SQL & Database Querying (Level 3 → Level 4)',
    expectedPathway: {
      fromLevel: 3,
      toLevel: 4
    },
    matchScore: 89,
    priority: 'HIGH',
    modules: [
      {
        title: 'Module 1: Analytical Window Functions in Depth',
        duration: '1h 15m',
        topics: ['DENSE_RANK, NTILE, LAG, LEAD', 'Sliding frames (ROWS BETWEEN)', 'Partition optimization']
      },
      {
        title: 'Module 2: Recursive CTEs & Hierarchy Traversal',
        duration: '1h 15m',
        topics: ['Hierarchical administrative department trees', 'Longitudinal cohort tracking', 'Graph traversal queries']
      },
      {
        title: 'Module 3: Statistical Aggregations & Rollups',
        duration: '1h 00m',
        topics: ['CUBE, ROLLUP, and GROUPING SETS for cross-tabulation', 'Pivot transformations']
      }
    ],
    prerequisites: ['SQL intermediate proficiency (Level 2-3)'],
    learningOutcomes: [
      'Write multi-dimensional statistical rollups without nested temporary tables',
      'Analyze longitudinal survey cohorts using window frames',
      'Implement recursive hierarchy aggregations'
    ],
    certificationOffered: true
  },
  {
    id: 'course-gis-04',
    title: 'Spatial Data Analysis with QGIS & Python for Demographics',
    provider: 'Ministry of Statistics (MoSPI)',
    providerBadge: 'Specialized Track',
    durationHours: 4.0,
    difficulty: 'Intermediate',
    rating: 4.6,
    reviewsCount: 640,
    format: 'Self-Paced Interactive',
    overview: 'Learn how to bind national survey indicators with district and sub-district shapefiles, perform spatial autocorrelation analysis (Moran’s I), and produce publication-ready thematic maps.',
    targetGapCompetencies: ['Spatial & GIS Statistical Analysis'],
    closesGapDescription: 'Closes Spatial & GIS Statistical Analysis (Level 1 → Level 2)',
    expectedPathway: {
      fromLevel: 1,
      toLevel: 2
    },
    matchScore: 84,
    priority: 'MEDIUM',
    modules: [
      {
        title: 'Module 1: GIS Fundamentals for Statistical Officers',
        duration: '1h 15m',
        topics: ['Coordinate reference systems (CRS)', 'Vector boundaries vs Raster data', 'Joining survey CSVs to Census shapefiles']
      },
      {
        title: 'Module 2: Choropleth Mapping & Visual Standards',
        duration: '1h 30m',
        topics: ['Classification methods (Natural Breaks, Quantiles)', 'Color blind accessible scales', 'Cartographic layout creation']
      },
      {
        title: 'Module 3: GeoPandas Automation',
        duration: '1h 15m',
        topics: ['Automating district map exports in Python GeoPandas', 'Spatial joins and centroid calculations']
      }
    ],
    prerequisites: ['Basic spreadsheet or data table familiarity'],
    learningOutcomes: [
      'Create district-level thematic maps for official bulletins',
      'Perform spatial joins between survey microdata and GIS boundaries',
      'Automate map generation using GeoPandas scripts'
    ],
    certificationOffered: true
  }
];

export const INITIAL_LEARNING_PATH: LearningPath = {
  candidateId: 'cand-0842',
  targetRoleId: 'role-sso-01',
  currentReadiness: 72, // 72%
  projectedReadiness: 89, // 89% projected upon completing path
  gapCountTotal: 4,
  projectedGapsClosed: 4,
  totalEstimatedHours: 18.0,
  steps: [
    {
      stepNumber: 1,
      courseId: 'course-sql-adv-03',
      courseTitle: 'Advanced SQL Analytical Processing & Window Functions',
      provider: 'iGOT Karmayogi',
      competenciesAddressed: ['SQL & Database Querying (Level 3 → 4)', 'Cohort Windowing'],
      durationText: '3.5 Hours',
      priority: 'HIGH',
      status: 'COMPLETED',
      targetGapSummary: 'Prerequisite foundation for query execution plan tuning.',
      projectedReadinessContribution: 5,
      keyMilestones: [
        'Completed Windowing functions lab',
        'Submitted recursive CTE assessment with 95% score',
        'Certified on iGOT platform'
      ]
    },
    {
      stepNumber: 2,
      courseId: 'course-sql-opt-01',
      courseTitle: 'SQL Query Optimization for Statistical Big Data',
      provider: 'iGOT Karmayogi',
      competenciesAddressed: ['SQL Query Optimization (Level 2 → 4)', 'Execution Plan Tuning'],
      durationText: '4.5 Hours',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      targetGapSummary: 'Directly resolves #1 critical competency gap for Senior Statistical Officer role.',
      projectedReadinessContribution: 8,
      keyMilestones: [
        'Module 1: Execution Plan Anatomy (Completed)',
        'Module 2: Composite Indexing (Current)',
        'Module 3: 50M Survey Dataset Lab (Upcoming)'
      ]
    },
    {
      stepNumber: 3,
      courseId: 'course-py-stat-02',
      courseTitle: 'Applied Python for Survey Data & Imputation',
      provider: 'National Statistical Academy',
      competenciesAddressed: ['Python for Statistical Computing (Level 2 → 3)', 'Automated Imputation'],
      durationText: '6.0 Hours',
      priority: 'HIGH',
      status: 'UPCOMING',
      targetGapSummary: 'Enables migration of manual survey editing to reproducible Python routines.',
      projectedReadinessContribution: 4,
      keyMilestones: [
        'Enrollment scheduled for upcoming academy cohort',
        'Pre-course sandbox environment configured'
      ]
    },
    {
      stepNumber: 4,
      courseId: 'course-gis-04',
      courseTitle: 'Spatial Data Analysis with QGIS & Python for Demographics',
      provider: 'Ministry of Statistics (MoSPI)',
      competenciesAddressed: ['Spatial & GIS Statistical Analysis (Level 1 → 2)', 'District Thematic Mapping'],
      durationText: '4.0 Hours',
      priority: 'MEDIUM',
      status: 'UPCOMING',
      targetGapSummary: 'Expands dissemination capability for regional statistical bulletins.',
      projectedReadinessContribution: 0,
      keyMilestones: [
        'Self-paced module unlocked after Python course completion'
      ]
    }
  ]
};
