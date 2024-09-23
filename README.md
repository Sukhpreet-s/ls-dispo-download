# Download disposition files with one click

- Click on the extension icon to initiate the download process.
- Applicable URLs on which the download works:
    - URL that contains valid server name (see below), and
    - contains survey id.

- Applicable server names:
    1. `training.vri-research.com`

- It downloads the following files:
    1. CSV (includes all responses): `results-survey{surveyId}.csv`
    2. CSV from ExportRotationOrders: `export_rotation_orders_{surveyId}_{yyyymmdd}_{hhmmss}`
    3. CSV from ExportRotationOrdersOptions: `export_rotation_orders_options_{surveyId}_{yyyymmdd}_{hhmmss}`
    4. CSV with Tracker: `export_rotation_orders_tracker_{surveyId}_{yyyymmdd}_{hhmmss}`
    5. CSV Heatmap Text: `results-survey{surveyId}-hm.csv`
    6. CSV with MultiChoice Combined Var: `results-survey{surveyId}-mv.csv`
    7. Enhanced Dispo Terminates file: `results-survey{surveyId}-terms.csv`
