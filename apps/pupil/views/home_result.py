from django.shortcuts import render


def home_page(request):
    return render(request, "home.html")


def results_page(request):
    return render(request, 'results.html')
