from collections import Counter
import numpy as np


class Node:
    def __init__(self, feature_idx=None, threshold=None, left=None, right=None, value=None, prob=None):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value  # majority class (0 or 1)
        self.prob = prob    # P(y=1) in this leaf


class DecisionTree:
    def __init__(self, min_samples_split=50, max_depth=5, max_thresholds=30):
        self.min_samples_split = min_samples_split
        self.max_depth = max_depth
        self.max_thresholds = max_thresholds
        self.root = None

    def _candidate_thresholds(self, values):
        unique = np.unique(values)
        if len(unique) <= self.max_thresholds:
            return unique
        quantiles = np.linspace(0, 1, self.max_thresholds + 2)[1:-1]
        return np.unique(np.quantile(values, quantiles))

    def build_tree(self, dataset, curr_depth=0):
        X, y = dataset[:, :-1], dataset[:, -1]
        n_samples, n_features = X.shape

        if n_samples >= self.min_samples_split and curr_depth < self.max_depth:
            best_split = self.best_split(dataset, n_features)
            if best_split["info_gain"] > 0:
                left_node = self.build_tree(best_split["left_dataset"], curr_depth + 1)
                right_node = self.build_tree(best_split["right_dataset"], curr_depth + 1)
                return Node(
                    feature_idx=best_split["feature_idx"],
                    threshold=best_split["threshold"],
                    left=left_node,
                    right=right_node,
                )

        majority = int(Counter(y).most_common(1)[0][0])
        leaf_prob = float(np.mean(y))
        return Node(value=majority, prob=leaf_prob)

    def best_split(self, dataset, n_features):
        best_split = {
            "feature_idx": None,
            "threshold": None,
            "info_gain": -1.0,
            "left_dataset": None,
            "right_dataset": None,
        }

        parent_y = dataset[:, -1]

        for feature_idx in range(n_features):
            for threshold in self._candidate_thresholds(dataset[:, feature_idx]):
                left_dataset, right_dataset = self.split(dataset, feature_idx, threshold)
                if len(left_dataset) == 0 or len(right_dataset) == 0:
                    continue

                info_gain = self.information_gain(
                    parent_y, left_dataset[:, -1], right_dataset[:, -1]
                )
                if info_gain > best_split["info_gain"]:
                    best_split["feature_idx"] = feature_idx
                    best_split["threshold"] = threshold
                    best_split["info_gain"] = info_gain
                    best_split["left_dataset"] = left_dataset
                    best_split["right_dataset"] = right_dataset

        return best_split

    @staticmethod
    def split(dataset, feature_idx, threshold):
        left_mask = dataset[:, feature_idx] <= threshold
        return dataset[left_mask], dataset[~left_mask]

    def information_gain(self, parent_y, left_y, right_y):
        n = len(parent_y)
        left_w = len(left_y) / n
        right_w = len(right_y) / n
        return self.entropy(parent_y) - (
            left_w * self.entropy(left_y) + right_w * self.entropy(right_y)
        )

    @staticmethod
    def entropy(y):
        if len(y) == 0:
            return 0.0
        entropy_value = 0.0
        for label in np.unique(y):
            p = np.sum(y == label) / len(y)
            if p > 0:
                entropy_value -= p * np.log2(p)
        return entropy_value

    def fit(self, X, y):
        y = y.astype(np.float64)
        dataset = np.concatenate([X.astype(np.float64), y.reshape(-1, 1)], axis=1)
        self.root = self.build_tree(dataset)

    def predict_proba_row(self, row, node):
        if node.value is not None:
            return node.prob
        if row[node.feature_idx] <= node.threshold:
            return self.predict_proba_row(row, node.left)
        return self.predict_proba_row(row, node.right)

    def predict_row(self, row, node):
        if node.value is not None:
            return node.value
        if row[node.feature_idx] <= node.threshold:
            return self.predict_row(row, node.left)
        return self.predict_row(row, node.right)

    def predict_proba(self, X):
        return np.array([self.predict_proba_row(row, self.root) for row in X])

    def predict(self, X):
        return np.array([self.predict_row(row, self.root) for row in X], dtype=int)
