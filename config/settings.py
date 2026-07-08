from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-4qg&--cy91cegvt(ewts(ojqn$z$-m(5#@!)&=5v-83%s4l-h^'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    ".ngrok-free.app",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://*.ngrok-free.app",
]

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
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
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
