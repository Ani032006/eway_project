import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

folder = Path("data_for_hackathon").resolve().parent

X_train_df = pd.read_csv(folder / "X_train.csv").drop(columns=["ID"], errors="ignore")
X_test_df = pd.read_csv(folder / "X_test.csv").drop(columns=["ID"], errors="ignore")
y_train = pd.read_csv(folder / "y_train.csv")["target"].to_numpy(dtype=np.float64)
y_test = pd.read_csv(folder / "y_test.csv")["target"].to_numpy(dtype=np.float64)

X_train = X_train_df.to_numpy(dtype=np.float64).flatten()
X_test = X_test_df.to_numpy(dtype=np.float64).flatten()


def cost_function(x, y, w, b):
    m = len(x)
    cost_sum = 0

    for i in range(m):
        f = w * x[i] + b
        cost = (f - y[i]) ** 2
        cost_sum += cost

    total_cost = (1 / (2 * m)) * cost_sum
    return total_cost


def gradient_function(x, y, w, b):
    m = len(x)
    dc_dw = 0
    dc_db = 0

    for i in range(m):
        f = w * x[i] + b
        dc_dw += (f - y[i]) * x[i]
        dc_db += (f - y[i])

    dc_dw = (1 / m) * dc_dw
    dc_db = (1 / m) * dc_db

    return dc_dw, dc_db


def gradient_descent(x, y, alpha, iterations):
    w = 0
    b = 0

    for i in range(iterations):
        dc_dw, dc_db = gradient_function(x, y, w, b)
        w = w - alpha * dc_dw
        b = b - alpha * dc_db

    return w, b


learning_rate = 0.01
iterations = 10000

final_w, final_b = gradient_descent(X_train, y_train, learning_rate, iterations)

print(f"w: {final_w:.4f}, b: {final_b:.4f}")

train_preds = final_w * X_train + final_b
test_preds = final_w * X_test + final_b

y_train_mean = np.mean(y_train)
ss_tot_train = np.sum((y_train - y_train_mean) ** 2)
ss_res_train = np.sum((y_train - train_preds) ** 2)
train_r2 = (1 - (ss_res_train / ss_tot_train)) * 100

y_test_mean = np.mean(y_test)
ss_tot_test = np.sum((y_test - y_test_mean) ** 2)
ss_res_test = np.sum((y_test - test_preds) ** 2)
test_r2 = (1 - (ss_res_test / ss_tot_test)) * 100

print(f"\nTraining accuracy (R2 Score): {train_r2:.2f}%")
print(f"Test accuracy (R2 Score):     {test_r2:.2f}%")