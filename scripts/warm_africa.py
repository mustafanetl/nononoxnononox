# Quick launcher for Africa destinations
# Just imports and overrides the destinations list from warm_plan_cache

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Override before importing main
import warm_plan_cache
warm_plan_cache.DESTINATIONS = [
    # North Africa
    "Marrakech", "Casablanca", "Fez", "Tangier",
    "Cairo", "Luxor", "Hurghada",
    "Tunis", "Carthage",
    # East Africa
    "Nairobi", "Mombasa", "Zanzibar", "Dar es Salaam",
    "Kigali", "Kampala",
    "Addis Ababa",
    # Southern Africa
    "Cape Town", "Johannesburg", "Durban",
    "Victoria Falls", "Windhoek",
    # West Africa
    "Accra", "Lagos", "Dakar",
    # Islands
    "Mauritius", "Seychelles",
]

# Use 3 vibes for more venue coverage
warm_plan_cache.COMBOS = [
    (5, "mixed", "couple"),
    (5, "cultural", "couple"),
    (5, "adventure", "couple"),
]

if __name__ == "__main__":
    warm_plan_cache.main()
