import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import warm_plan_cache

warm_plan_cache.DESTINATIONS = [
    "Dubai", "Abu Dhabi", "Doha", "Muscat", "Bahrain",
    "Riyadh", "Jeddah", "AlUla",
    "Amman", "Petra", "Dead Sea",
    "Beirut",
    "Tel Aviv", "Jerusalem",
    "Oman", "Kuwait City",
]

warm_plan_cache.COMBOS = [
    (5, "mixed", "couple"),
    (5, "cultural", "couple"),
    (5, "adventure", "couple"),
    (5, "foodie", "couple"),
    (5, "romantic", "couple"),
]

if __name__ == "__main__":
    warm_plan_cache.main()
