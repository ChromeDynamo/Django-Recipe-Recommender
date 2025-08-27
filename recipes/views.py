from django.shortcuts import render

# Create your views here.

from django.db.models import Count, F, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Ingredient, Recipe
from .serializers import IngredientSerializer, RecipeSerializer

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all().order_by("name")
    serializer_class = IngredientSerializer
    filterset_fields = ["name"]


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all().order_by("-created_at")
    serializer_class = RecipeSerializer

    @action(detail=False, methods=["get"])
    def search(self, request):
        raw = request.query_params.get("ingredients", "")
        match = request.query_params.get("match", "all").lower()
        try:
            max_missing = int(request.query_params.get("max_missing", 0))
        except ValueError:
            max_missing = 0

        provided = [s.strip().lower() for s in raw.split(",") if s.strip()]
        if not provided:
            return Response({"detail": "Provide ?ingredients=comma,separated,names"}, status=400)

        qs = Recipe.objects.annotate(
            required_count=Count("ingredients", distinct=True),
            have_count=Count("ingredients", filter=Q(ingredients__name__in=provided), distinct=True),
        ).annotate(
            missing_count=F("required_count") - F("have_count")
        )

        if match == "all":
            qs = qs.filter(missing_count__lte=max_missing)
        else:
            qs = qs.filter(have_count__gte=1)

        qs = qs.order_by("missing_count", "-have_count", "-created_at")

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


def home(request):
    return render(request, "recipes/index.html")