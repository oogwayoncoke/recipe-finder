"""
dish – AI Chatbot View
Calls Claude claude-sonnet-4-20250514 with full user context:
  - diet & allergy preferences  (from UserDiet / UserAllergy junction tables)
  - saved / favourite recipes   (from likes.UserFavourite)
  - browsing history            (from localStorage via client context — no DB history table)
  - current meal plan           (from meal_planner.MealPlan / MealPlanEntry)
  - current page the user is viewing
"""

import anthropic
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


def build_system_prompt(user, user_context: dict) -> str:
    """
    Compose the richest possible system prompt from everything we know about
    this user.  All sections are optional – if data is missing we omit the block.
    """

    lines = [
        "You are dish's personal culinary AI – a deeply knowledgeable, warm, and",
        "detail-oriented cooking assistant embedded inside the dish recipe app.",
        "",
        "## Your personality",
        "- You speak like a seasoned chef who is also a trusted friend.",
        "- You are specific, not vague. Give exact quantities, temperatures, techniques.",
        "- You are proactive: if the user asks 'what should I cook tonight?' you actually",
        "  recommend something concrete based on their preferences, not a generic list.",
        "- You remember the conversation history within this session.",
        "- You never apologise for giving detailed answers – detail is your value.",
        "",
        "## dish app context",
        "The user is currently on the dish recipe platform. You have access to their",
        "full profile below. Use it to personalise every response.",
        "",
    ]

    # ── User identity ──────────────────────────────────────────────────────────
    if user and user.is_authenticated:
        lines += [
            "## User identity",
            f"- Username: {user.username}",
            f"- Email: {user.email}",
            "",
        ]
    else:
        lines += [
            "## User identity",
            "- Guest user (not logged in). Encourage them to create an account to save",
            "  favourites and get personalised recommendations.",
            "",
        ]

    # ── Diet & allergy preferences ─────────────────────────────────────────────
    prefs = user_context.get("preferences", {})
    diets = prefs.get("diets", [])
    allergies = prefs.get("allergies", [])
    cuisines = prefs.get("cuisines", [])

    if diets or allergies or cuisines:
        lines.append("## Dietary profile")
        if diets:
            lines.append(f"- Diet: {', '.join(diets)}")
        if allergies:
            lines.append(
                f"- Allergies / intolerances (NEVER suggest these): {', '.join(allergies)}"
            )
        if cuisines:
            lines.append(f"- Favourite cuisines: {', '.join(cuisines)}")
        lines.append(
            "IMPORTANT: Always respect allergies. If a recipe contains an allergen,",
        )
        lines.append(
            "  flag it clearly and offer an alternative."
        )
        lines.append("")

    # ── Saved / favourite recipes ──────────────────────────────────────────────
    favourites = user_context.get("favourites", [])
    if favourites:
        lines.append("## Saved recipes (the user has bookmarked these)")
        for r in favourites[:20]:  # cap to avoid token overflow
            title = r.get("title", "Unknown")
            cuisine = r.get("cuisine", "")
            time = r.get("ready_in_minutes", "")
            lines.append(f"  - {title}" + (f" ({cuisine}, {time} min)" if cuisine or time else ""))
        lines.append(
            "If relevant, reference these. The user clearly likes this kind of food."
        )
        lines.append("")

    # ── Browsing / cooking history ─────────────────────────────────────────────
    # History comes from the client (localStorage via historyTracker.js).
    # There is no UserHistory DB table – it was removed in migration 0002.
    history = user_context.get("history", [])
    if history:
        lines.append("## Recent recipe history (viewed or cooked)")
        for h in history[:10]:
            title = h.get("title", "Unknown")
            action = h.get("action", "viewed")  # 'viewed' | 'cooked'
            lines.append(f"  - {title} ({action})")
        lines.append(
            "Use this to understand what styles/ingredients the user gravitates toward."
        )
        lines.append("")

    # ── Current meal plan ─────────────────────────────────────────────────────
    meal_plan = user_context.get("meal_plan", {})
    if meal_plan:
        lines.append("## Current weekly meal plan")
        for day, meals in meal_plan.items():
            b = meals.get("breakfast", "–")
            lu = meals.get("lunch", "–")
            d = meals.get("dinner", "–")
            lines.append(f"  - {day}: Breakfast: {b} | Lunch: {lu} | Dinner: {d}")
        lines.append(
            "You can suggest swaps, shopping list items, or prep tips for this plan."
        )
        lines.append("")

    # ── Grocery list ──────────────────────────────────────────────────────────
    grocery = user_context.get("grocery_list", [])
    if grocery:
        unchecked = [i["name"] for i in grocery if not i.get("checked")]
        checked   = [i["name"] for i in grocery if i.get("checked")]
        lines.append("## Grocery list")
        if unchecked:
            lines.append(f"  - Still to buy: {', '.join(unchecked)}")
        if checked:
            lines.append(f"  - Already have: {', '.join(checked)}")
        lines.append("")

    # ── Current page / recipe context ─────────────────────────────────────────
    current_page = user_context.get("current_page", "")
    current_recipe = user_context.get("current_recipe", {})

    if current_page:
        lines.append(f"## Current page: {current_page}")

    if current_recipe:
        lines.append("## Recipe currently open in the app")
        lines.append(f"  Title: {current_recipe.get('title', 'Unknown')}")
        if current_recipe.get("ingredients"):
            lines.append(
                f"  Ingredients: {', '.join(current_recipe['ingredients'][:12])}"
            )
        if current_recipe.get("instructions"):
            lines.append(
                f"  Steps: {len(current_recipe['instructions'])} steps"
            )
        lines.append(
            "The user may ask questions about this specific recipe. Answer as an expert"
            " who has cooked it many times."
        )
        lines.append("")

    # ── Response style ─────────────────────────────────────────────────────────
    lines += [
        "## Response style",
        "- Use markdown: **bold** for recipe names, `code` for temperatures/quantities.",
        "- Structure longer answers with clear sections.",
        "- For recipe recommendations: always include name, key ingredients, approximate",
        "  time, and why it fits this user's profile.",
        "- For technique questions: give step-by-step detail with pro tips.",
        "- Keep responses focused – don't pad with filler. Every sentence should add value.",
        "- If you don't know something specific to this user's data, say so honestly",
        "  rather than making something up.",
    ]

    return "\n".join(lines)


@api_view(["POST"])
@permission_classes([AllowAny])
def chat(request):
    """
    POST /chatbot/chat/

    Body:
    {
        "message": "string",
        "history": [{"role": "user"|"assistant", "content": "string"}, ...],
        "context": {
            "current_page": "string",
            "current_recipe": {...},
            "preferences": { "diets": [], "allergies": [], "cuisines": [] },
            "favourites": [...],
            "history": [...],
            "meal_plan": {...},
            "grocery_list": [...]
        }
    }
    """
    data = request.data

    message = data.get("message", "").strip()
    if not message:
        return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

    conversation_history = data.get("history", [])
    user_context = data.get("context", {})

    # ── DB enrichment for authenticated users ──────────────────────────────────
    # Client-sent context always wins — it reflects live UI state.
    # We only fill in gaps where the client sent nothing.
    user = request.user
    if user.is_authenticated:
        try:
            # Favourites — lives in likes.UserFavourite (not recipes.UserFavourite).
            # Order by saved_at (the actual field name on UserFavourite).
            if not user_context.get("favourites"):
                from likes.models import UserFavourite
                favs = (
                    UserFavourite.objects
                    .filter(user=user)
                    .select_related("recipe")
                    .order_by("-saved_at")[:30]
                )
                user_context["favourites"] = [
                    {
                        "title": f.recipe.title,
                        "cuisine": "",           # Recipe has no cuisine field; tags carry diet/cuisine info
                        "ready_in_minutes": f.recipe.ready_in_minutes or "",
                    }
                    for f in favs
                ]
        except Exception:
            pass

        try:
            # Diet & allergy preferences — stored in UserDiet / UserAllergy junction
            # tables, NOT as M2M fields on UserProfile.
            if not user_context.get("preferences"):
                from authentication.models import UserDiet, UserAllergy
                diets = list(
                    UserDiet.objects
                    .filter(user=user)
                    .select_related("diet")
                    .values_list("diet__name", flat=True)
                )
                allergies = list(
                    UserAllergy.objects
                    .filter(user=user)
                    .select_related("allergy")
                    .values_list("allergy__name", flat=True)
                )
                user_context["preferences"] = {
                    "diets":     diets,
                    "allergies": allergies,
                    "cuisines":  [],   # No cuisine preference table; users filter by cuisine in the sidebar
                }
        except Exception:
            pass

        # Note: browsing history has no DB table (UserHistory was removed in migration
        # 0002).  History comes exclusively from the client via localStorage /
        # historyTracker.js and is already present in user_context["history"] if the
        # client sent it.

    system_prompt = build_system_prompt(user, user_context)

    # ── Build messages list for Claude ─────────────────────────────────────────
    messages = []

    # Inject prior turns from the session (capped to last 20 to stay within context)
    for turn in conversation_history[-20:]:
        role = turn.get("role")
        content = turn.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    # Add the new user message
    messages.append({"role": "user", "content": message})

    # ── Call Claude ────────────────────────────────────────────────────────────
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        )

        reply = response.content[0].text

        return Response({
            "reply": reply,
            "usage": {
                "input_tokens":  response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        })

    except anthropic.AuthenticationError:
        return Response(
            {"error": "Invalid API key – set ANTHROPIC_API_KEY in server/.env"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except anthropic.RateLimitError:
        return Response(
            {"error": "Rate limit reached. Try again in a moment."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    except Exception as e:
        return Response(
            {"error": f"Chat error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )