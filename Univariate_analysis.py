import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent

df = pd.read_csv(DATA_DIR / "X_test.csv")
df = df.drop(columns=["ID"], errors="ignore")

binary_cols     = ['Column10','Column11','Column12','Column13','Column19','Column20','Column21']
continuous_cols = ['Column0','Column1','Column2','Column3','Column4','Column5',
                   'Column6','Column7','Column8','Column14','Column15','Column16','Column17','Column18']

cont_rows   = []
binary_rows = []

for col in df.columns:
    a     = df[col].to_numpy(dtype=float, na_value=np.nan)
    clean = a[~np.isnan(a)]
    n_obs     = len(a)
    n_nonmiss = len(clean)
    n_miss    = n_obs - n_nonmiss
    fill_rate = round(n_nonmiss / n_obs, 4)
    n_unique  = len(np.unique(clean))

    if col in continuous_cols:
        cont_rows.append({
            "Variable":        col,
            "Data Type":       "Continuous",
            "# Obs":           n_obs,
            "# Non Missing":   n_nonmiss,
            "# Missing":       n_miss,
            "Fill Rate":       fill_rate,
            "# Unique":        n_unique,
            "Mean":            round(np.mean(clean), 4),
            "Std Deviation":   round(np.std(clean, ddof=1), 4),
            "Median":          round(np.median(clean), 4),
            "Minimum":         round(np.min(clean), 4),
            "Q1 (25th pct)":  round(np.percentile(clean, 25), 4),
            "Q3 (75th pct)":  round(np.percentile(clean, 75), 4),
            "99th Percentile": round(np.percentile(clean, 99), 4),
            "Maximum":         round(np.max(clean), 4),
        })

    elif col in binary_cols:
        count_0 = int(np.sum(clean == 0))
        count_1 = int(np.sum(clean == 1))
        pct_0   = round(count_0 / n_nonmiss * 100, 2)
        pct_1   = round(count_1 / n_nonmiss * 100, 2)

        binary_rows.append({
            "Variable":      col,
            "Data Type":     "Binary",
            "# Obs":         n_obs,
            "# Non Missing": n_nonmiss,
            "# Missing":     n_miss,
            "Fill Rate":     fill_rate,
            "# Unique":      n_unique,
            "Count 0":       count_0,
            "Count 1":       count_1,
            "% of 0s":       str(pct_0) + "%",
            "% of 1s":       str(pct_1) + "%",
        })

with pd.ExcelWriter(DATA_DIR / "univariate_analysis_report.xlsx", engine="openpyxl") as writer:
    row_cursor = 0

    pd.DataFrame([{"Variable": "CONTINUOUS VARIABLES"}]).to_excel(
        writer, index=False, header=False, startrow=row_cursor)
    row_cursor += 1
    pd.DataFrame(cont_rows).to_excel(writer, index=False, startrow=row_cursor)
    row_cursor += len(cont_rows) + 3

    pd.DataFrame([{"Variable": "BINARY VARIABLES"}]).to_excel(
        writer, index=False, header=False, startrow=row_cursor)
    row_cursor += 1
    pd.DataFrame(binary_rows).to_excel(writer, index=False, startrow=row_cursor)

print("Saved: univariate_analysis.xlsx")