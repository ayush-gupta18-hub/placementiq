from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
import asyncio
from database import get_db
import models
from datetime import datetime

router = APIRouter()

class ProfileRequest(BaseModel):
    leetcode_username: str
    codeforces_username: str
    github_username: str

class OnboardRequest(BaseModel):
    clerk_id: str
    email: str
    name: str
    cgpa: float
    branch: str
    leetcode: str
    codeforces: str
    github: str

# ---------- Weighted DSA Score ----------
def calculate_dsa_score(problems: int, rating: int, hard: int, contests: int) -> float:
    # Normalization thresholds calibrated so that:
    # 97 problems + 1056 CF rating + 1 hard + 8 contests  ≈ 4.7 / 10
    # 300 problems + 1600 CF rating + 20 hard + 15 contests ≈ 8.5 / 10
    p_score = min(problems / 200, 1.0)            # 200 probs = max contribution
    r_score = min(rating / 1500, 1.0) if rating > 0 else 0.0  # 1500 CF = max
    d_score = min(hard / 20, 1.0)                 # 20 hard LC = max contribution
    c_score = min(contests / 15, 1.0)             # 15 contests = max contribution

    score = 0.4 * p_score + 0.3 * r_score + 0.2 * d_score + 0.1 * c_score
    return round(score * 10, 1)

# ---------- Company Readiness ----------
def calculate_company_readiness(dsa_score: float, hard: int, rating: int, problems: int) -> dict:
    base = dsa_score * 7          # max 70 pts
    hard_bonus = min(hard * 0.5, 15)  # max 15 pts
    rating_bonus = min(rating / 200, 15)  # max 15 pts at 2000

    faang = min(100, int(base + hard_bonus + rating_bonus))
    tier2 = min(100, int(base * 1.15 + hard_bonus * 0.7 + rating_bonus * 0.6))
    startup = min(100, int(base * 1.3 + min(problems / 10, 20) + 5))

    return {
        "FAANG": faang,
        "Tier2": tier2,
        "Startup": startup,
        "Amazon": min(100, int(faang * 1.02)),
        "Google": min(100, int(faang * 0.93)),
        "Microsoft": min(100, int(faang * 0.98)),
    }

# ---------- Weak Topic Detection ----------
def detect_weak_topics(easy: int, medium: int, hard: int, total: int) -> list:
    """Heuristic-based weak topic detection based on problem distribution."""
    topics = []
    if total < 50:
        topics += ["Arrays & Hashing", "Linked Lists", "Two Pointers"]
    elif total < 150:
        topics += ["Dynamic Programming", "Graphs", "Trees"]
    elif total < 300:
        topics += ["Advanced DP", "Segment Trees", "Network Flow"]
    else:
        topics += ["Hard Graph Algorithms", "Math & Combinatorics"]

    if hard < 10:
        topics.insert(0, "Hard Problems Practice")
    if medium < 30:
        topics.insert(0, "Medium DSA Patterns")
    return topics[:5]

# ---------- Recommended Problems ----------
PROBLEM_BANK = {
    "Dynamic Programming": [
        {"title": "Climbing Stairs", "difficulty": "Easy", "url": "https://leetcode.com/problems/climbing-stairs/"},
        {"title": "Coin Change", "difficulty": "Medium", "url": "https://leetcode.com/problems/coin-change/"},
        {"title": "Longest Increasing Subsequence", "difficulty": "Medium", "url": "https://leetcode.com/problems/longest-increasing-subsequence/"},
    ],
    "Graphs": [
        {"title": "Number of Islands", "difficulty": "Medium", "url": "https://leetcode.com/problems/number-of-islands/"},
        {"title": "Course Schedule", "difficulty": "Medium", "url": "https://leetcode.com/problems/course-schedule/"},
        {"title": "Word Ladder", "difficulty": "Hard", "url": "https://leetcode.com/problems/word-ladder/"},
    ],
    "Trees": [
        {"title": "Binary Tree Level Order Traversal", "difficulty": "Medium", "url": "https://leetcode.com/problems/binary-tree-level-order-traversal/"},
        {"title": "Serialize and Deserialize Binary Tree", "difficulty": "Hard", "url": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/"},
    ],
    "Arrays & Hashing": [
        {"title": "Two Sum", "difficulty": "Easy", "url": "https://leetcode.com/problems/two-sum/"},
        {"title": "Group Anagrams", "difficulty": "Medium", "url": "https://leetcode.com/problems/group-anagrams/"},
    ],
    "Linked Lists": [
        {"title": "Reverse Linked List", "difficulty": "Easy", "url": "https://leetcode.com/problems/reverse-linked-list/"},
        {"title": "Merge K Sorted Lists", "difficulty": "Hard", "url": "https://leetcode.com/problems/merge-k-sorted-lists/"},
    ],
    "Hard Problems Practice": [
        {"title": "Trapping Rain Water", "difficulty": "Hard", "url": "https://leetcode.com/problems/trapping-rain-water/"},
        {"title": "Median of Two Sorted Arrays", "difficulty": "Hard", "url": "https://leetcode.com/problems/median-of-two-sorted-arrays/"},
    ],
    "Medium DSA Patterns": [
        {"title": "Longest Palindromic Substring", "difficulty": "Medium", "url": "https://leetcode.com/problems/longest-palindromic-substring/"},
        {"title": "Spiral Matrix", "difficulty": "Medium", "url": "https://leetcode.com/problems/spiral-matrix/"},
    ],
    "Two Pointers": [
        {"title": "3Sum", "difficulty": "Medium", "url": "https://leetcode.com/problems/3sum/"},
        {"title": "Container With Most Water", "difficulty": "Medium", "url": "https://leetcode.com/problems/container-with-most-water/"},
    ],
    "Segment Trees": [
        {"title": "Range Sum Query - Mutable", "difficulty": "Medium", "url": "https://leetcode.com/problems/range-sum-query-mutable/"},
    ],
    "Advanced DP": [
        {"title": "Edit Distance", "difficulty": "Hard", "url": "https://leetcode.com/problems/edit-distance/"},
        {"title": "Burst Balloons", "difficulty": "Hard", "url": "https://leetcode.com/problems/burst-balloons/"},
    ],
}

def get_recommended_problems(weak_topics: list) -> list:
    problems = []
    seen = set()
    for topic in weak_topics:
        for p in PROBLEM_BANK.get(topic, []):
            if p["title"] not in seen:
                problems.append({**p, "topic": topic})
                seen.add(p["title"])
    return problems[:10]

# ---------- Fetchers ----------
async def fetch_leetcode(username: str):
    if not username: return None

    async with httpx.AsyncClient(timeout=20.0) as client:
        # --- Attempt 1: alfa-leetcode-api ---
        try:
            r = await client.get(f"https://alfa-leetcode-api.onrender.com/{username}/solved")
            if r.status_code == 200:
                d = r.json()
                total = d.get("solvedProblem", 0) or d.get("totalSolved", 0)
                if total and total > 0:
                    return {
                        "platform": "LeetCode",
                        "total_solved": total,
                        "easy": d.get("easySolved", 0),
                        "medium": d.get("mediumSolved", 0),
                        "hard": d.get("hardSolved", 0)
                    }
        except Exception as e:
            print(f"LeetCode API 1 failed: {e}")

        # --- Attempt 2: leetcode-stats-api (Heroku) ---
        try:
            r = await client.get(f"https://leetcode-stats-api.herokuapp.com/{username}")
            if r.status_code == 200:
                d = r.json()
                total = d.get("totalSolved", 0)
                if total and total > 0:
                    return {
                        "platform": "LeetCode",
                        "total_solved": total,
                        "easy": d.get("easySolved", 0),
                        "medium": d.get("mediumSolved", 0),
                        "hard": d.get("hardSolved", 0)
                    }
        except Exception as e:
            print(f"LeetCode API 2 failed: {e}")

        # --- Attempt 3: direct LeetCode GraphQL ---
        try:
            query = """
            query userStats($username: String!) {
              matchedUser(username: $username) {
                submitStatsGlobal {
                  acSubmissionNum {
                    difficulty
                    count
                  }
                }
              }
            }
            """
            r = await client.post(
                "https://leetcode.com/graphql",
                json={"query": query, "variables": {"username": username}},
                headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"}
            )
            if r.status_code == 200:
                data = r.json()
                stats = data.get("data", {}).get("matchedUser", {}) or {}
                nums = stats.get("submitStatsGlobal", {}).get("acSubmissionNum", [])
                result = {"platform": "LeetCode", "total_solved": 0, "easy": 0, "medium": 0, "hard": 0}
                for item in nums:
                    diff = item.get("difficulty", "")
                    count = item.get("count", 0)
                    if diff == "All": result["total_solved"] = count
                    elif diff == "Easy": result["easy"] = count
                    elif diff == "Medium": result["medium"] = count
                    elif diff == "Hard": result["hard"] = count
                if result["total_solved"] > 0:
                    return result
        except Exception as e:
            print(f"LeetCode GraphQL failed: {e}")

    print(f"All LeetCode APIs failed for {username}")
    return None

async def fetch_codeforces(username: str):
    if not username: return None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            info_resp, contests_resp, status_resp = await asyncio.gather(
                client.get(f"https://codeforces.com/api/user.info?handles={username}"),
                client.get(f"https://codeforces.com/api/user.rating?handle={username}"),
                client.get(f"https://codeforces.com/api/user.status?handle={username}&from=1&count=5000")
            )

            result = {
                "platform": "Codeforces",
                "rating": 0, "rank": "Unrated", "maxRating": 0,
                "contests": 0, "problems_solved": 0, "rating_history": []
            }

            if info_resp.status_code == 200:
                info_data = info_resp.json()
                if info_data.get("status") == "OK" and info_data.get("result"):
                    u = info_data["result"][0]
                    result["rating"] = u.get("rating", 0)
                    result["rank"] = u.get("rank", "Unrated")
                    result["maxRating"] = u.get("maxRating", 0)

            if contests_resp.status_code == 200:
                cr_data = contests_resp.json()
                if cr_data.get("status") == "OK":
                    history = cr_data.get("result", [])
                    result["contests"] = len(history)
                    recent = history[-8:] if len(history) > 8 else history
                    result["rating_history"] = [
                        {
                            "contest": item.get("contestName", "")[:20],
                            "rating": item.get("newRating", 0),
                            "date": datetime.fromtimestamp(item["ratingUpdateTimeSeconds"]).strftime("%b %d")
                            if item.get("ratingUpdateTimeSeconds") else ""
                        }
                        for item in recent
                    ]

            # Count unique problems with OK verdict
            if status_resp.status_code == 200:
                st_data = status_resp.json()
                if st_data.get("status") == "OK":
                    solved_set = set()
                    for sub in st_data.get("result", []):
                        if sub.get("verdict") == "OK":
                            prob = sub.get("problem", {})
                            key = f"{prob.get('contestId', '')}-{prob.get('index', '')}"
                            solved_set.add(key)
                    result["problems_solved"] = len(solved_set)

            return result
    except Exception as e:
        print(f"Codeforces Fetch Error: {e}")
    return None

async def fetch_github(username: str):
    if not username: return None
    try:
        async with httpx.AsyncClient(timeout=15.0, headers={"User-Agent": "PlaceAI-App"}) as client:
            user_resp, repos_resp = await asyncio.gather(
                client.get(f"https://api.github.com/users/{username}"),
                client.get(f"https://api.github.com/users/{username}/repos?per_page=30&sort=pushed")
            )

            result = {"platform": "GitHub", "public_repos": 0, "followers": 0, "following": 0, "languages": {}, "recent_activity": 0}

            if user_resp.status_code == 200:
                d = user_resp.json()
                result["public_repos"] = d.get("public_repos", 0)
                result["followers"] = d.get("followers", 0)
                result["following"] = d.get("following", 0)

            if repos_resp.status_code == 200:
                repos = repos_resp.json()
                lang_counts: dict = {}
                total_lang = 0
                for repo in repos:
                    lang = repo.get("language")
                    if lang:
                        lang_counts[lang] = lang_counts.get(lang, 0) + 1
                        total_lang += 1
                # Convert to percentages
                if total_lang > 0:
                    result["languages"] = {
                        lang: round((count / total_lang) * 100)
                        for lang, count in sorted(lang_counts.items(), key=lambda x: -x[1])[:6]
                    }

            return result
    except Exception as e:
        print(f"GitHub Fetch Error: {e}")
    return None

def build_summary(lc, cf, gh):
    problems = lc.get("total_solved", 0) if lc else 0
    hard = lc.get("hard", 0) if lc else 0
    medium = lc.get("medium", 0) if lc else 0
    easy = lc.get("easy", 0) if lc else 0
    rating = cf["rating"] if cf and cf.get("rating") else 0
    contests = cf["contests"] if cf and cf.get("contests") else 0

    dsa_score = calculate_dsa_score(problems, rating, hard, contests)
    weak = detect_weak_topics(easy, medium, hard, problems)
    recommended = get_recommended_problems(weak)
    readiness = calculate_company_readiness(dsa_score, hard, rating, problems)

    total_solved_combined = problems + (cf["rating"] // 10 if cf and cf.get("rating") else 0)

    return {
        "total_dsa_score": dsa_score,
        "total_solved": problems,
        "total_dsa_combined": total_solved_combined,
        "readiness_score": readiness["FAANG"],
        "weak_areas": weak,
        "recommended_problems": recommended,
        "company_readiness": readiness,
        "difficulty_distribution": [
            {"name": "Easy", "value": easy, "fill": "#22c55e"},
            {"name": "Medium", "value": medium, "fill": "#eab308"},
            {"name": "Hard", "value": hard, "fill": "#ef4444"}
        ],
        "rating_history": cf.get("rating_history", []) if cf else []
    }

@router.post("/scrape")
async def scrape_profiles(request: ProfileRequest):
    results = await asyncio.gather(
        fetch_leetcode(request.leetcode_username),
        fetch_codeforces(request.codeforces_username),
        fetch_github(request.github_username)
    )
    lc, cf, gh = results
    summary = build_summary(lc, cf, gh)
    return {"leetcode": lc, "codeforces": cf, "github": gh, "summary": summary}

@router.post("/onboard")
def onboard_user(request: OnboardRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.clerk_id == request.clerk_id).first()
    if db_user:
        db_user.cgpa = request.cgpa
        db_user.branch = request.branch
        db_user.leetcode_username = request.leetcode
        db_user.codeforces_username = request.codeforces
        db_user.github_username = request.github
        db.commit()
        db.refresh(db_user)
        return {"message": "User profile updated successfully"}

    new_user = models.User(
        clerk_id=request.clerk_id,
        email=request.email,
        name=request.name,
        cgpa=request.cgpa,
        branch=request.branch,
        leetcode_username=request.leetcode,
        codeforces_username=request.codeforces,
        github_username=request.github
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User onboarded successfully"}

@router.get("/user/{clerk_id}")
async def get_user_profile(clerk_id: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.clerk_id == clerk_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    results = await asyncio.gather(
        fetch_leetcode(db_user.leetcode_username),
        fetch_codeforces(db_user.codeforces_username),
        fetch_github(db_user.github_username)
    )
    lc, cf, gh = results
    summary = build_summary(lc, cf, gh)

    return {
        "profile": {
            "name": db_user.name,
            "email": db_user.email,
            "cgpa": db_user.cgpa,
            "branch": db_user.branch,
            "leetcode_username": db_user.leetcode_username,
            "codeforces_username": db_user.codeforces_username,
            "github_username": db_user.github_username,
        },
        "stats": {
            "leetcode": lc,
            "codeforces": cf,
            "github": gh,
            "summary": summary
        }
    }
