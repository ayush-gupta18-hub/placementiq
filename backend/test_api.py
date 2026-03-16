import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes.prediction import predict_placement, StudentInput

import warnings
warnings.filterwarnings("ignore")

data = StudentInput(
    cgpa=8.5,
    dsa_problems_solved=250,
    leetcode_rating=1600,
    codeforces_rating=1400,
    projects=3,
    internships=1,
    hackathons=2,
    gender="Female",
    branch="CSE"
)

try:
    res = predict_placement(data)
    print("✅ TEST SUCCESSFUL:")
    import json
    print(json.dumps(res, indent=2))
except Exception as e:
    print(f"❌ TEST FAILED: {e}")
