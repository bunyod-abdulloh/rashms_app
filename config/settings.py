import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY")

DEBUG = os.getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")

CSRF_TRUSTED_ORIGINS = os.getenv(
    "CSRF_TRUSTED_ORIGINS",
    ""
).split(",")

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Local apps
    'apps.core',
    'apps.admin.apps.AdminConfig',
    'apps.pupil',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),

        # production optimizations
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# settings.py — bu qatorlarni QO'SHING (yoki mavjudlarini o'zgartiring)

# ============================================================
# 🔐 AUTH SETTINGS
# @login_required qayerga redirect qilishni bilishi kerak
# ============================================================

# @login_required orqali himoyalangan sahifaga anonim foydalanuvchi kirsa,
# u shu URL'ga yuboriladi. Bu login URL bo'lishi shart.
LOGIN_URL = "/admin/login/"

# django_login()'dan keyin foydalanuvchini qayerga yuborish (fallback).
# Bizning view'da _safe_next_url() bilan hal qilingan, lekin default ham kerak.
LOGIN_REDIRECT_URL = "/admin/add-test/"

# Logout'dan keyin qayerga
LOGOUT_REDIRECT_URL = "/admin/login/"

# ============================================================
# 🍪 SESSION XAVFSIZLIGI (tavsiya etiladi)
# ============================================================
SESSION_COOKIE_HTTPONLY = True  # JS session cookie'ni o'qiy olmasin
SESSION_COOKIE_SAMESITE = "Lax"  # CSRF himoyasi
SESSION_COOKIE_SECURE = True  # ⚠️ Faqat HTTPS'da True qiling (localhost'da False)
CSRF_COOKIE_HTTPONLY = False  # AJAX/fetch uchun kerak — False bo'lishi shart
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = True  # ⚠️ Faqat HTTPS'da True

# Session muddati (ixtiyoriy)
SESSION_COOKIE_AGE = 60 * 60 * 8  # 8 soat
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

APP_VERSION = "1.0.0"
