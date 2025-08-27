from rest_framework import serializers
from .models import Ingredient, Recipe

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ["id", "name"]


class RecipeSerializer(serializers.ModelSerializer):
    ingredient_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    ingredients = IngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = ["id", "title", "description", "ingredients", "ingredient_names", "created_at"]

    def _get_or_create_ingredients(self, names):
        objs = []
        for raw in names:
            name = raw.strip().lower()
            if not name:
                continue
            obj, _ = Ingredient.objects.get_or_create(name=name)
            objs.append(obj)
        return objs

    def create(self, validated_data):
        names = validated_data.pop("ingredient_names", [])
        recipe = Recipe.objects.create(**validated_data)
        if names:
            recipe.ingredients.set(self._get_or_create_ingredients(names))
        return recipe

    def update(self, instance, validated_data):
        names = validated_data.pop("ingredient_names", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if names is not None:
            instance.ingredients.set(self._get_or_create_ingredients(names))
        return instance
