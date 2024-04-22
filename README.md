# Download disposition files with one click

- Adds a button on the right side of the address bar only one specific urls. The button allows to download the files by one click.
- Applicable URLs on which the download button appears:
    - Enhanced Dispositions: Segments page - `https://training.vri-research.com/index.php/admin/edispnew/sa/index/surveyid/*`
    - Response summary page - `https://training.vri-research.com/index.php/admin/responses/sa/index/surveyid/*`

- It downloads the following files:
    1. CSV (includes all responses): `results-survey{surveyId}.csv`
    2. CSV from ExportRotationOrders: `export_rotation_orders_{surveyId}_{yyyymmdd}_{hhmmss}`
    3. CSV from ExportRotationOrdersOptions: `export_rotation_orders_options_{surveyId}_{yyyymmdd}_{hhmmss}`
    4. CSV with Tracker: `export_rotation_orders_tracker_{surveyId}_{yyyymmdd}_{hhmmss}`
    5. CSV Heatmap Text: `results-survey{surveyId}-hm.csv`
    6. CSV with MultiChoice Combined Var: `results-survey{surveyId}-mv.csv`
    7. Enhanced Dispo Terminates file: `results-survey{surveyId}-terms.csv`