import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent

# Two features so we can plot the decision boundary (same as TEST.py)
FEATURE_1 = "Column10"
FEATURE_2 = "Column2"

LEARNING_RATE = 0.01
ITERATIONS = 10000
THRESHOLD = 0.5
PLOT_SAMPLE = 5000  # subsample for scatter plot only


def load_xy(x_path, y_path, feature_cols):
    X_df = pd.read_csv(x_path).drop(columns=["ID"], errors="ignore")
    y = pd.read_csv(y_path)["target"].to_numpy(dtype=np.float64)
    X_df = X_df[feature_cols]
    return X_df, y


def preprocess(train_df, test_df):
    medians = train_df.median(numeric_only=True)
    train_df = train_df.fillna(medians)
    test_df = test_df.fillna(medians)

    means = train_df.mean(numeric_only=True)
    stds = train_df.std(numeric_only=True).replace(0, 1.0)
    train_df = (train_df - means) / stds
    test_df = (test_df - means) / stds
    return train_df.to_numpy(dtype=np.float64), test_df.to_numpy(dtype=np.float64)


# ── Load train / test ──────────────────────────────────────────────
feature_cols = [FEATURE_1, FEATURE_2]

X_train_df, y_train = load_xy(DATA_DIR / "X_train.csv", DATA_DIR / "y_train.csv", feature_cols)
X_test_df, y_test = load_xy(DATA_DIR / "X_test.csv", DATA_DIR / "y_test.csv", feature_cols)

X_train, X_test = preprocess(X_train_df, X_test_df)

m, n = X_train.shape
print(f"Train samples: {m:,}  |  Features: {n} ({FEATURE_1}, {FEATURE_2})")
print(f"Class 0: {np.sum(y_train == 0):,}  |  Class 1: {np.sum(y_train == 1):,}\n")


def sigmoid(z):
    z = np.clip(z, -500, 500)
    return 1 / (1 + np.exp(-z))


def cost_function(X, y, w, b):
    """Same formula as loop version, vectorized for large data."""
    z = X @ w + b
    g = sigmoid(z)
    g = np.clip(g, 1e-15, 1 - 1e-15)
    return -(1 / m) * np.sum(y * np.log(g) + (1 - y) * np.log(1 - g))


def gradient_function(X, y, w, b):
    """Same gradients as loop version: grad_w[j] += (g-y)*X[i,j], grad_b += (g-y)."""
    z = X @ w + b
    g = sigmoid(z)
    err = g - y
    grad_w = (X.T @ err) / m
    grad_b = np.sum(err) / m
    return grad_b, grad_w


def gradient_descent(X, y, alpha, iterations):
    w = np.zeros(n)
    b = 0.0

    for i in range(iterations):
        grad_b, grad_w = gradient_function(X, y, w, b)
        w = w - alpha * grad_w
        b = b - alpha * grad_b

        if i % 1000 == 0:
            print(f"Iteration {i}: Cost {cost_function(X, y, w, b)}")

    return w, b


def predict(X, w, b):
    probs = sigmoid(X @ w + b)
    return (probs >= THRESHOLD).astype(int)


# ── Train ──────────────────────────────────────────────────────────
final_w, final_b = gradient_descent(X_train, y_train, LEARNING_RATE, ITERATIONS)

train_preds = predict(X_train, final_w, final_b)
test_preds = predict(X_test, final_w, final_b)

train_acc = np.mean(train_preds == y_train) * 100
test_acc = np.mean(test_preds == y_test) * 100

print(f"\nTraining accuracy: {train_acc:.2f}%")
print(f"Test accuracy:     {test_acc:.2f}%")

# ── Decision boundary plot (2 features) ──────────────────────────
# Boundary: w0*x0 + w1*x1 + b = 0  =>  x1 = m*x0 + c
m_slope = -final_w[0] / final_w[1]
c_intercept = -final_b / final_w[1]

xmin, xmax = X_train[:, 0].min() - 0.5, X_train[:, 0].max() + 0.5
ymin, ymax = X_train[:, 1].min() - 0.5, X_train[:, 1].max() + 0.5
xd = np.array([xmin, xmax])
yd = m_slope * xd + c_intercept

# Subsample points for plotting (full 1M points is too heavy)
rng = np.random.default_rng(42)
idx0 = np.where(y_train == 0)[0]
idx1 = np.where(y_train == 1)[0]
if len(idx0) > PLOT_SAMPLE:
    idx0 = rng.choice(idx0, PLOT_SAMPLE, replace=False)
if len(idx1) > PLOT_SAMPLE:
    idx1 = rng.choice(idx1, PLOT_SAMPLE, replace=False)

plt.figure(figsize=(9, 7))
plt.plot(xd, yd, "k", ls="--", label="Decision Boundary")
plt.fill_between(xd, yd, ymin, color="tab:blue", alpha=0.2)
plt.fill_between(xd, yd, ymax, color="tab:orange", alpha=0.2)

plt.scatter(X_train[idx0, 0], X_train[idx0, 1], color="tab:blue", label="Class 0", s=12, alpha=0.6)
plt.scatter(X_train[idx1, 0], X_train[idx1, 1], color="tab:orange", label="Class 1", s=12, alpha=0.6)
plt.legend()
plt.xlabel(FEATURE_1)
plt.ylabel(FEATURE_2)
plt.title("Logistic Regression — Decision Boundary (normalized features)")
plt.xlim(xmin, xmax)
plt.ylim(ymin, ymax)
plt.tight_layout()
plt.savefig(DATA_DIR / "logistic_boundary.png", dpi=150)
plt.show()
