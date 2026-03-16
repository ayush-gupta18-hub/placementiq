import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

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

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test) # Even though we don't evaluate here, let's just make it clear 

# Train your XGBoost model (after preprocessing)
model = XGBClassifier(
    n_estimators     = 300,
    max_depth        = 5,
    learning_rate    = 0.05,
    subsample        = 0.8,
    colsample_bytree = 0.8,
    eval_metric      = "logloss",
    random_state     = 42
)
model.fit(X_train_scaled, y_train)

# Save to the SAME path as your old model
save_path = r"C:\Users\AYUSH\OneDrive\Hii\placement predictor ML\models\placement_model.pkl"

with open(save_path, "wb") as f:
    pickle.dump(model, f)

print("✅ Old RandomForest replaced with XGBoost!")

scaler_path = r"C:\Users\AYUSH\OneDrive\Hii\placement predictor ML\models\placement_scaler.pkl"

with open(scaler_path, "wb") as f:
    pickle.dump(scaler, f)

print("✅ Scaler saved!")

model_path  = r"C:\Users\AYUSH\OneDrive\Hii\placement predictor ML\models\placement_model.pkl"
scaler_path = r"C:\Users\AYUSH\OneDrive\Hii\placement predictor ML\models\placement_scaler.pkl"

with open(model_path, "rb") as f:
    loaded_model = pickle.load(f)

with open(scaler_path, "rb") as f:
    loaded_scaler = pickle.load(f)

print("✅ XGBoost model loaded successfully!")
print(type(loaded_model))
