from django.conf import settings


def _check_bot_auth(request):
    token = request.headers.get("X-Bot-Token")
    return token and token == settings.BOT_TOKEN
