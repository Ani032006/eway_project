from pathlib import Path
import pandas as pd
import numpy as np

folder = Path(__file__).resolve().parent
try:
    X_train_df = pd.read_csv(folder / "X_train.csv")
    X_test_df = pd.read_csv(folder / "X_test.csv")
    cols = X_train_df.columns[:5]
    X_train = X_train_df[cols].apply(lambda s: pd.to_numeric(s, errors='coerce')).fillna(0).to_numpy()
    print('shape:', X_train.shape)
    print('dtype:', X_train.dtype)
    mins = np.amin(X_train, axis=0)
    maxs = np.amax(X_train, axis=0)
    print('mins:', mins)
    print('maxs:', maxs)
    print('any inf mins:', np.any(np.isinf(mins)))
    print('any inf maxs:', np.any(np.isinf(maxs)))
except Exception as e:
    print('error:', e)
