import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent

# ─────────────────────────────────────
# LOAD FEATURE FILES
# ─────────────────────────────────────

X_train = pd.read_csv(DATA_DIR / "X_train.csv")
X_test = pd.read_csv(DATA_DIR / "X_test.csv")

# ─────────────────────────────────────
# LOAD TARGET FILES
# ─────────────────────────────────────

y_train_df = pd.read_csv(DATA_DIR / "y_train.csv")
y_test_df = pd.read_csv(DATA_DIR / "y_test.csv")

# ─────────────────────────────────────
# REMOVE ID COLUMN
# ─────────────────────────────────────

X_train = X_train.drop(columns=["ID"], errors="ignore")
X_test  = X_test.drop(columns=["ID"], errors="ignore")

# Target columns
y_train = y_train_df["target"]
y_test  = y_test_df["target"]

# ─────────────────────────────────────
# SELECT FEATURES
# ─────────────────────────────────────

binary_col     = "Column10"
continuous_col = "Column2"

X_train = X_train[[binary_col, continuous_col]]
X_test  = X_test[[binary_col, continuous_col]]

# ─────────────────────────────────────
# PRINT SHAPES
# ─────────────────────────────────────

print("\nTRAIN DATA")
print(X_train.shape)
print(y_train.shape)

print("\nTEST DATA")
print(X_test.shape)
print(y_test.shape)

# ─────────────────────────────────────
# GINI FUNCTION
# ─────────────────────────────────────

def gini(y):
    total = len(y)
    if total == 0:
        return 0
    p0 = np.sum(y == 0) / total
    p1 = np.sum(y == 1) / total
    return 1 - (p0**2 + p1**2)

# ─────────────────────────────────────
# ROOT GINI
# ─────────────────────────────────────

root_gini = gini(y_train)

print("\nROOT GINI")
print(root_gini)

# ─────────────────────────────────────
# BINARY FEATURE ANALYSIS
# ─────────────────────────────────────

print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("BINARY FEATURE ANALYSIS")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━")

binary_values = X_train[binary_col]

left_y  = y_train[binary_values <= 0.5]
right_y = y_train[binary_values > 0.5]

left_gini_binary  = gini(left_y)
right_gini_binary = gini(right_y)

weighted_gini_binary = (
    (len(left_y) / len(y_train)) * left_gini_binary +
    (len(right_y) / len(y_train)) * right_gini_binary
)

print(f"\nFeature : {binary_col}")
print(f"Left Gini     : {left_gini_binary:.6f}")
print(f"Right Gini    : {right_gini_binary:.6f}")
print(f"Weighted Gini : {weighted_gini_binary:.6f}")

# ─────────────────────────────────────
# CONTINUOUS FEATURE ANALYSIS
# ─────────────────────────────────────

print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("CONTINUOUS FEATURE ANALYSIS")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━")

continuous_values = X_train[continuous_col]
thresholds = np.sort(continuous_values.unique())

best_gini      = 999
best_threshold = None

for threshold in thresholds:
    left_y  = y_train[continuous_values <= threshold]
    right_y = y_train[continuous_values > threshold]

    left_gini  = gini(left_y)
    right_gini = gini(right_y)

    weighted_gini = (
        (len(left_y) / len(y_train)) * left_gini +
        (len(right_y) / len(y_train)) * right_gini
    )

    if weighted_gini < best_gini:
        best_gini      = weighted_gini
        best_threshold = threshold

print(f"\nBest Threshold : {best_threshold}")
print(f"Best Gini      : {best_gini:.6f}")

# ─────────────────────────────────────
# FINAL COMPARISON
# ─────────────────────────────────────

print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("FINAL COMPARISON")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━")

print(f"\nBinary Feature Gini     : {weighted_gini_binary:.6f}")
print(f"Continuous Feature Gini : {best_gini:.6f}")

if weighted_gini_binary < best_gini:
    print(f"\nBETTER FEATURE : {binary_col}")
else:
    print(f"\nBETTER FEATURE : {continuous_col}")

# ─────────────────────────────────────
# SAVE RESULTS TO EXCEL
# ─────────────────────────────────────

binary_df = pd.DataFrame({
    "Feature":       [binary_col],
    "Left Gini":     [left_gini_binary],
    "Right Gini":    [right_gini_binary],
    "Weighted Gini": [weighted_gini_binary]
})

continuous_df = pd.DataFrame({
    "Feature":        [continuous_col],
    "Best Threshold": [best_threshold],
    "Best Gini":      [best_gini]
})

comparison_df = pd.DataFrame({
    "Feature":    [binary_col, continuous_col],
    "Final Gini": [weighted_gini_binary, best_gini]
})

better_feature = pd.DataFrame({
    "Better Feature": [
        binary_col if weighted_gini_binary < best_gini else continuous_col
    ]
})

with pd.ExcelWriter(
    DATA_DIR / "decision_tree_gini_results.xlsx",
    engine="xlsxwriter"
) as writer:

    sheet_name = "Gini Results"

    binary_df.to_excel(writer,     sheet_name=sheet_name, startrow=0,  index=False)
    continuous_df.to_excel(writer, sheet_name=sheet_name, startrow=6,  index=False)
    comparison_df.to_excel(writer, sheet_name=sheet_name, startrow=12, index=False)
    better_feature.to_excel(writer, sheet_name=sheet_name, startrow=18, index=False)

print("\nExcel file created successfully")

# ─────────────────────────────────────
# INFORMATION GAIN
# ─────────────────────────────────────

binary_information_gain     = root_gini - weighted_gini_binary
continuous_information_gain = root_gini - best_gini

print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("INFORMATION GAIN")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━")

print(f"\nBinary Feature IG     : {binary_information_gain:.6f}")
print(f"Continuous Feature IG : {continuous_information_gain:.6f}")

if binary_information_gain > continuous_information_gain:
    print(f"\nBETTER FEATURE (IG) : {binary_col}")
else:
    print(f"\nBETTER FEATURE (IG) : {continuous_col}")

# ─────────────────────────────────────
# ACCURACY CALCULATION
# ─────────────────────────────────────

print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("ACCURACY CALCULATION")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━")

continuous_test_values = X_test[continuous_col]

left_train  = y_train[X_train[continuous_col] <= best_threshold]
right_train = y_train[X_train[continuous_col] > best_threshold]

left_majority  = left_train.mode()[0]
right_majority = right_train.mode()[0]

predictions = np.array([
    left_majority if value <= best_threshold else right_majority
    for value in continuous_test_values
])

accuracy = np.mean(predictions == y_test.values)

print(f"\nAccuracy : {accuracy:.6f}")