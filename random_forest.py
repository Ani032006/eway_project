import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from decision_tree import DecisionTree

folder = Path(__file__).resolve().parent
N_TREES = 3  # change this to use more or fewer trees

# --- 1. Load train and test ---
X_train = pd.read_csv(folder / "X_train.csv").drop(columns=["ID"], errors="ignore")
X_test = pd.read_csv(folder / "X_test.csv").drop(columns=["ID"], errors="ignore")
y_train = pd.read_csv(folder / "y_train.csv")["target"]
y_test = pd.read_csv(folder / "y_test.csv")["target"]

# --- 2. Clean data (learn from train, apply to test) ---
imputer = SimpleImputer(strategy="median")
scaler = StandardScaler()

X_train = imputer.fit_transform(X_train)
X_test = imputer.transform(X_test)
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# --- 3. Train trees (each tree sees a random bootstrap sample) ---
trees = []
n_rows = len(y_train)

for tree_num in range(N_TREES):
    # pick random rows with replacement (bootstrap)
    random_rows = np.random.randint(0, n_rows, size=n_rows)

    tree = DecisionTree(max_depth=2, min_samples_split=50)
    tree.fit(X_train[random_rows], y_train.iloc[random_rows].to_numpy())

    trees.append(tree)
    print(f"Tree {tree_num + 1}/{N_TREES} done")

# --- 4. Predict: majority vote (each tree picks 0 or 1, winner takes all) ---
n_trees = len(trees)
votes_for_class_1 = np.zeros(len(y_test))

for tree in trees:
    votes_for_class_1 += tree.predict(X_test)

# majority = more than half the trees voted for class 1
majority_needed = n_trees / 2
predictions = (votes_for_class_1 > majority_needed).astype(int)

# --- 5. Accuracy ---
correct = (predictions == y_test.to_numpy()).sum()
accuracy = 100 * correct / len(y_test)

print(f"\nTest accuracy: {accuracy:.2f}%")
