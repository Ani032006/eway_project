from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import cdist

class KmeansClustering:
    def __init__(self, k=5):
        self.k = k
        self.centroids = None

    @staticmethod
    def euclidean_distance(X, centroids):
        return cdist(X, centroids, metric='euclidean')

    def fit(self, X_train, max_iterations=200):
        self.centroids = np.random.uniform(
            np.amin(X_train, axis=0), 
            np.amax(X_train, axis=0), 
            size=(self.k, X_train.shape[1])
        )

        for _ in range(max_iterations):
            y_train = self.predict(X_train)
            cluster_centers = []
            
            for i in range(self.k):
                indices = np.argwhere(y_train == i).flatten()
                
                if len(indices) == 0:
                    cluster_centers.append(self.centroids[i])
                else:
                    cluster_centers.append(np.mean(X_train[indices], axis=0))

            old_centroids = self.centroids
            self.centroids = np.array(cluster_centers)
            
            if np.max(np.abs(self.centroids - old_centroids)) < 0.0001:
                break

        return self.predict(X_train)

    def predict(self, X_test):
        distances = self.euclidean_distance(X_test, self.centroids)
        return np.argmin(distances, axis=1)

if __name__ == "__main__":
    folder = Path(__file__).resolve().parent
    
    X_train_raw = pd.read_csv(folder / "X_train.csv")
    X_test_raw = pd.read_csv(folder / "X_test.csv")
    y_train_raw = pd.read_csv(folder / "y_train.csv")["target"]
    y_test_raw = pd.read_csv(folder / "y_test.csv")["target"]
    
    features = X_train_raw.drop(columns=["ID"], errors="ignore").columns[:5]
    X_train_df = X_train_raw[features]
    X_test_df = X_test_raw[features]
    
    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()
    
    X_train = imputer.fit_transform(X_train_df)
    X_test = imputer.transform(X_test_df)
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    y_train = y_train_raw.to_numpy()
    y_test = y_test_raw.to_numpy()

    np.random.seed(42)
    train_indices = np.random.choice(len(X_train), 50000, replace=False)
    test_indices = np.random.choice(len(X_test), 10000, replace=False)
    
    X_train_sub = X_train[train_indices]
    y_train_sub = y_train[train_indices]
    
    X_test_sub = X_test[test_indices]
    y_test_sub = y_test[test_indices]
    
    kmeans = KmeansClustering(k=5)
    train_labels = kmeans.fit(X_train_sub)
    test_labels = kmeans.predict(X_test_sub)
    
    cluster_mapping = {}
    for cluster_id in range(kmeans.k):
        targets_in_cluster = y_train_sub[train_labels == cluster_id]
        if len(targets_in_cluster) > 0:
            cluster_mapping[cluster_id] = pd.Series(targets_in_cluster).mode()[0]
        else:
            cluster_mapping[cluster_id] = 0
            
    train_preds = np.array([cluster_mapping[label] for label in train_labels])
    test_preds = np.array([cluster_mapping[label] for label in test_labels])
    
    train_accuracy = np.mean(train_preds == y_train_sub) * 100
    test_accuracy = np.mean(test_preds == y_test_sub) * 100
    
    print(f"Training Accuracy : {train_accuracy:.2f}%")
    print(f"Test Accuracy     : {test_accuracy:.2f}%")
