import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import pickle


# load data
df = pd.read_csv("data/Placement_Data_Full_Class.csv")

# drop unnecessary columns
df = df.drop(columns=["Email", "Name"])

# separate target
y = df["Placement(Y/N)?"].map({"Placed": 1, "Not Placed": 0})
X = df.drop(columns=["Placement(Y/N)?"])

# Yes/No encoding
yes_no_columns = [
    "Internships(Y/N)",
    "Training(Y/N)",
    "Innovative Project(Y/N)",
    "Technical Course(Y/N)",
    "Backlog in 5th sem"
]

for col in yes_no_columns:
    X[col] = X[col].map({"Yes": 1, "No": 0})

# One-hot encoding
categorical_cols = ["Gender", "10th board", "12th board", "Stream"]
X = pd.get_dummies(X, columns=categorical_cols)

# fill missing values
X = X.fillna(X.mean())

# train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# scale features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# train model
model = XGBClassifier(
    n_estimators     = 300,
    max_depth        = 5,
    learning_rate    = 0.05,
    subsample        = 0.8,
    colsample_bytree = 0.8,
    eval_metric      = "logloss",
    random_state     = 42
)
model.fit(X_train, y_train)


# predictions
y_pred = model.predict(X_test)

# evaluation
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# feature importance
feature_importance = pd.Series(
    model.feature_importances_,
    index=X.columns
).sort_values(ascending=False)

print("\nTop 10 Most Important Features:")
print(feature_importance.head(10))

# take top 10 features
top_features = feature_importance.head(10)

# plot
plt.figure(figsize=(10, 6))
top_features.sort_values().plot(kind="barh")
plt.title("Top 10 Feature Importances (Placement Prediction)")
plt.xlabel("Importance Score")
plt.ylabel("Features")
plt.tight_layout()
plt.show()

# save the trained model
with open("models/placement_model.pkl", "wb") as f:
    pickle.dump(model, f)
print("✅ Model saved successfully!")

# save the scaler
with open("models/placement_scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)
print("✅ Scaler saved successfully!")

# load the saved model
with open("models/placement_model.pkl", "rb") as f:
    loaded_model = pickle.load(f)

# predict again using loaded model
y_pred_loaded = loaded_model.predict(X_test)

print("\nAccuracy from loaded model:", accuracy_score(y_test, y_pred_loaded))
