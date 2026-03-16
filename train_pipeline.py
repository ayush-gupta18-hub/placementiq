import os, time, pickle, warnings
import requests
import numpy as np
import pandas as pd
warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split
from sklearn.preprocessing   import StandardScaler
from sklearn.utils            import resample
from sklearn.metrics          import classification_report, roc_auc_score
from xgboost                  import XGBClassifier

# ── Paths (matches your OneDrive project structure) ────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR  = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_PATH  = os.path.join(MODELS_DIR, "placement_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "placement_scaler.pkl")
DATA_PATH   = os.path.join(BASE_DIR,   "placement_dataset.csv")

# ================================================================
# ★  ADD REAL STUDENTS HERE  ★
#    lc  = LeetCode username
#    cf  = Codeforces handle
#    Fill internships / hackathons / projects manually
#    placed: 1 = got placed, 0 = didn't
# ================================================================
REAL_STUDENTS = [
    # {"lc": "neal_wu",   "cf": "neal_wu",  "gender": "Male",   "internships": 3, "hackathons": 4, "projects": 6, "placed": 1},
    # {"lc": "your_id",   "cf": "your_id",  "gender": "Female", "internships": 1, "hackathons": 1, "projects": 3, "placed": 0},
    # ── Add more rows above this line ──
]

SLEEP = 2   # seconds between API calls — respect rate limits

# ================================================================
# STEP 1 — SYNTHETIC DATASET
# ================================================================
def generate_synthetic(n=1000, seed=42):
    print("\n" + "="*60)
    print("  STEP 1 — GENERATING SYNTHETIC DATASET")
    print("="*60)
    np.random.seed(seed)

    gender      = np.random.choice(["Male","Female"], n, p=[0.60,0.40])
    dsa         = np.random.exponential(130, n).clip(0,500).astype(int)
    lc_active   = np.random.choice([0,1], n, p=[0.35,0.65])
    lc_rating   = np.where(lc_active,
                    np.random.normal(1550,350,n).clip(1200,2800).astype(int), 0)
    cf_active   = np.random.choice([0,1], n, p=[0.50,0.50])
    cf_rating   = np.where(cf_active,
                    np.random.normal(1300,300,n).clip(800,2500).astype(int), 0)
    internships = np.random.choice([0,1,2,3],   n, p=[0.35,0.40,0.18,0.07])
    hackathons  = np.random.choice([0,1,2,3,4,5],n, p=[0.30,0.30,0.20,0.12,0.05,0.03])
    projects    = np.random.randint(1, 8, n)

    score = (dsa/500*0.25 + lc_rating/2800*0.25 + cf_rating/2500*0.20
             + internships/3*0.15 + hackathons/5*0.08 + projects/7*0.07)
    placed = (score + np.random.normal(0,0.08,n) > 0.42).astype(int)

    df = pd.DataFrame({
        "gender": gender, "dsa_problems_solved": dsa,
        "leetcode_rating": lc_rating, "codeforces_rating": cf_rating,
        "internships": internships, "hackathons": hackathons,
        "projects": projects, "placed": placed
    })
    print(f"  ✅ {n} synthetic records | Placed: {placed.sum()} ({placed.mean()*100:.1f}%)")
    return df


# ================================================================
# STEP 2 — REAL DATA SCRAPERS
# ================================================================
LC_QUERY = """
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    submitStats { acSubmissionNum { difficulty count } }
    userContestRanking { rating }
  }
}"""

def fetch_lc(username):
    try:
        r = requests.post(
            "https://leetcode.com/graphql",
            json={"query": LC_QUERY, "variables": {"username": username}},
            headers={"Content-Type":"application/json","Referer":"https://leetcode.com"},
            timeout=10
        )
        if r.status_code != 200: return None
        data = r.json().get("data",{}).get("matchedUser")
        if not data: return None
        solved = sum(s["count"] for s in
                     data["submitStats"]["acSubmissionNum"] if s["difficulty"]!="All")
        rating = int((data.get("userContestRanking") or {}).get("rating",0) or 0)
        return {"dsa_problems_solved": solved, "leetcode_rating": rating}
    except: return None

def fetch_cf(handle):
    try:
        r = requests.get(f"https://codeforces.com/api/user.info?handles={handle}", timeout=10)
        if r.status_code != 200: return None
        data = r.json()
        if data.get("status") != "OK": return None
        return {"codeforces_rating": data["result"][0].get("rating",0) or 0}
    except: return None

def scrape_real_students():
    print("\n" + "="*60)
    print("  STEP 2 — SCRAPING REAL STUDENT DATA")
    print("="*60)

    if not REAL_STUDENTS:
        print("  ℹ️  No real students in REAL_STUDENTS list — skipping.")
        print("  → Add student entries at the top of this file to enable.")
        return pd.DataFrame()

    records = []
    for i, s in enumerate(REAL_STUDENTS):
        print(f"\n  [{i+1}/{len(REAL_STUDENTS)}] {s.get('lc','?')} / {s.get('cf','?')}")
        lc = fetch_lc(s["lc"]) if s.get("lc") else {}
        time.sleep(SLEEP)
        cf = fetch_cf(s["cf"]) if s.get("cf") else {}
        time.sleep(SLEEP)
        records.append({
            "gender"             : s.get("gender","Male"),
            "dsa_problems_solved": (lc or {}).get("dsa_problems_solved", 0),
            "leetcode_rating"    : (lc or {}).get("leetcode_rating", 0),
            "codeforces_rating"  : (cf or {}).get("codeforces_rating", 0),
            "internships"        : s.get("internships", 0),
            "hackathons"         : s.get("hackathons", 0),
            "projects"           : s.get("projects", 0),
            "placed"             : s.get("placed", -1)
        })
        print(f"    DSA={records[-1]['dsa_problems_solved']} | "
              f"LC={records[-1]['leetcode_rating']} | CF={records[-1]['codeforces_rating']}")

    df = pd.DataFrame(records)
    df = df[df["placed"] != -1]   # drop unlabelled rows
    print(f"\n  ✅ {len(df)} real student records scraped.")
    return df


# ================================================================
# STEP 3 — MERGE + PREPROCESS
# ================================================================
def preprocess(df_syn, df_real):
    print("\n" + "="*60)
    print("  STEP 3 — MERGE + PREPROCESS")
    print("="*60)

    # Merge
    df = pd.concat([df_syn, df_real], ignore_index=True) if not df_real.empty else df_syn.copy()
    print(f"  Total rows: {len(df)} (synthetic={len(df_syn)}, real={len(df_real)})")

    # Encode gender
    df["gender"] = df["gender"].map({"Male":1,"Female":0})

    # Outlier capping (IQR)
    for col in ["dsa_problems_solved","leetcode_rating","codeforces_rating"]:
        Q1,Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR   = Q3 - Q1
        df[col] = df[col].clip(Q1-1.5*IQR, Q3+1.5*IQR)

    # Feature engineering
    df["coding_score"] = (
        df["dsa_problems_solved"] / df["dsa_problems_solved"].max() * 0.35 +
        df["leetcode_rating"]     / df["leetcode_rating"].max()     * 0.35 +
        df["codeforces_rating"]   / df["codeforces_rating"].max()   * 0.30
    ).round(4)
    df["experience_score"] = (
        df["internships"] / max(df["internships"].max(), 1) * 0.50 +
        df["hackathons"]  / max(df["hackathons"].max(),  1) * 0.25 +
        df["projects"]    / max(df["projects"].max(),    1) * 0.25
    ).round(4)
    df["is_competitive"]  = ((df["leetcode_rating"]>1500)|(df["codeforces_rating"]>1200)).astype(int)
    df["has_internship"]  = (df["internships"]>0).astype(int)
    df["dsa_level"]       = pd.cut(df["dsa_problems_solved"],
                                   bins=[-1,50,150,300,500],
                                   labels=[0,1,2,3]).astype(int)

    # Class balance check
    counts = df["placed"].value_counts()
    if counts.min()/counts.max() < 0.70:
        print("  ⚠️  Imbalance detected — oversampling minority class...")
        maj = df[df["placed"]==1]
        mn  = df[df["placed"]==0]
        mn_up = resample(mn, replace=True, n_samples=len(maj), random_state=42)
        df = pd.concat([maj, mn_up]).sample(frac=1, random_state=42).reset_index(drop=True)

    # Save dataset
    df.to_csv(DATA_PATH, index=False)
    print(f"  ✅ Dataset saved → {DATA_PATH}")
    print(f"  Placement rate: {df['placed'].mean()*100:.1f}%")
    return df


# ================================================================
# STEP 4 — TRAIN / TEST SPLIT + SCALE
# ================================================================
FEATURES = [
    "gender","dsa_problems_solved","leetcode_rating","codeforces_rating",
    "internships","hackathons","projects",
    "coding_score","experience_score","is_competitive","has_internship","dsa_level"
]

def split_and_scale(df):
    print("\n" + "="*60)
    print("  STEP 4 — SPLIT + SCALE")
    print("="*60)

    X = df[FEATURES]
    y = df["placed"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    scaler     = StandardScaler()
    X_train_sc = pd.DataFrame(scaler.fit_transform(X_train), columns=FEATURES)
    X_test_sc  = pd.DataFrame(scaler.transform(X_test),      columns=FEATURES)

    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"  ✅ Scaling done.")
    return X_train_sc, X_test_sc, y_train, y_test, scaler


# ================================================================
# STEP 5 — TRAIN XGBoost
# ================================================================
def train(X_train, y_train):
    print("\n" + "="*60)
    print("  STEP 5 — TRAINING XGBoost")
    print("="*60)

    model = XGBClassifier(
        n_estimators     = 300,
        max_depth        = 5,
        learning_rate    = 0.05,
        subsample        = 0.8,
        colsample_bytree = 0.8,
        eval_metric      = "logloss",
        random_state     = 42,
        n_jobs           = -1
    )
    model.fit(X_train, y_train, verbose=False)
    print("  ✅ XGBoost trained successfully!")
    return model


# ================================================================
# STEP 6 — EVALUATE
# ================================================================
def evaluate(model, X_test, y_test):
    print("\n" + "="*60)
    print("  STEP 6 — EVALUATION")
    print("="*60)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:,1]

    print(classification_report(y_test, y_pred, target_names=["Not Placed","Placed"]))
    print(f"  ROC-AUC Score : {roc_auc_score(y_test, y_prob):.4f}")
    return y_prob


# ================================================================
# STEP 7 — SAVE MODEL + SCALER
# ================================================================
def save(model, scaler):
    print("\n" + "="*60)
    print("  STEP 7 — SAVING MODEL + SCALER")
    print("="*60)

    with open(MODEL_PATH,  "wb") as f: pickle.dump(model,  f)
    with open(SCALER_PATH, "wb") as f: pickle.dump(scaler, f)

    print(f"  ✅ Model  saved → {MODEL_PATH}")
    print(f"  ✅ Scaler saved → {SCALER_PATH}")
    print(f"  Model type: {type(model)}")


# ================================================================
# QUICK PREDICT — test after training
# ================================================================
def quick_predict(model, scaler):
    print("\n" + "="*60)
    print("  QUICK PREDICT — sample student")
    print("="*60)

    student = pd.DataFrame([{
        "gender":1, "dsa_problems_solved":220,
        "leetcode_rating":1650, "codeforces_rating":1400,
        "internships":2, "hackathons":3, "projects":5,
        "coding_score":0.72, "experience_score":0.65,
        "is_competitive":1, "has_internship":1, "dsa_level":2
    }])[FEATURES]

    prob = model.predict_proba(scaler.transform(student))[0][1]
    verdict = ("🟢 HIGH" if prob>=0.75 else "🟡 MODERATE" if prob>=0.50 else "🔴 LOW")
    print(f"\n  Placement Probability : {prob*100:.1f}%")
    print(f"  Verdict               : {verdict}")


# ================================================================
# MAIN
# ================================================================
if __name__ == "__main__":
    print("\n" + "★"*60)
    print("  PLACEMENT PREDICTOR — FULL TRAINING PIPELINE")
    print("★"*60)

    df_syn  = generate_synthetic(n=1000)
    df_real = scrape_real_students()
    df      = preprocess(df_syn, df_real)

    X_train, X_test, y_train, y_test, scaler = split_and_scale(df)
    model   = train(X_train, y_train)
    evaluate(model, X_test, y_test)
    save(model, scaler)
    quick_predict(model, scaler)

    print("\n" + "★"*60)
    print("  ✅ PIPELINE COMPLETE — model is trained & ready!")
    print("  Next: build Flask/FastAPI prediction endpoint")
    print("★"*60)
