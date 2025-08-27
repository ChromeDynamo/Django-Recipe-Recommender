const searchBtn = document.getElementById("searchBtn");
const ingredientsListDiv = document.getElementById("ingredients-list");
const resultsDiv = document.getElementById("results");

// Fetch all ingredients from API and create clickable pills
fetch("/api/ingredients/")
    .then(response => response.json())
    .then(data => {
        data.forEach(ingredient => {
            const pill = document.createElement("div");
            pill.classList.add("ingredient-item");
            pill.textContent = ingredient.name;

            pill.addEventListener("click", () => {
                pill.classList.toggle("selected");
            });

            ingredientsListDiv.appendChild(pill);
        });
    })
    .catch(err => console.error("Error fetching ingredients:", err));

// Search recipes on button click
searchBtn.addEventListener("click", () => {
    const selectedIngredients = Array.from(
        document.querySelectorAll("#ingredients-list .ingredient-item.selected")
    ).map(pill => pill.textContent);

    if (selectedIngredients.length === 0) {
        alert("Please select at least one ingredient.");
        return;
    }

    fetch(`/api/recipes/search/?ingredients=${encodeURIComponent(selectedIngredients.join(","))}&match=all&max_missing=10`)
        .then(response => response.json())
        .then(data => {
            resultsDiv.innerHTML = "";

            if (data.length === 0) {
                resultsDiv.innerHTML = "<p>No recipes found.</p>";
                return;
            }

            // Calculate match count and check for perfect match
            data.forEach(recipe => {
                recipe.matchCount = recipe.ingredients.filter(i => selectedIngredients.includes(i.name)).length;
                recipe.perfectMatch = recipe.matchCount === recipe.ingredients.length;
            });

            // Sort recipes by matchCount descending
            data.sort((a, b) => b.matchCount - a.matchCount);

            data.forEach(recipe => {
                const card = document.createElement("div");
                card.classList.add("recipe-card");

                // Highlight ingredients: green if selected, red if missing
                const ingredientsHTML = recipe.ingredients.map(i => {
                    const hasIngredient = selectedIngredients.includes(i.name);
                    return `<span style="color:${hasIngredient ? 'green' : 'red'}">${i.name}</span>`;
                }).join(", ");

                card.innerHTML = `
                    <div class="card-header">
                        <h3>${recipe.title}</h3>
                        ${recipe.perfectMatch ? '<span class="perfect-badge">Perfect Match!</span>' : ''}
                        <button class="toggle-guide">▼</button>
                    </div>
                    <p>${recipe.description}</p>
                    <p><strong>Ingredients:</strong> ${ingredientsHTML}</p>
                    <div class="recipe-guide" style="display:none;">
                        <p>${recipe.guide || "No guide available."}</p>
                    </div>
                `;

                const toggleBtn = card.querySelector(".toggle-guide");
                const guideDiv = card.querySelector(".recipe-guide");
                toggleBtn.addEventListener("click", () => {
                    if (guideDiv.style.display === "none") {
                        guideDiv.style.display = "block";
                        toggleBtn.textContent = "▲";
                    } else {
                        guideDiv.style.display = "none";
                        toggleBtn.textContent = "▼";
                    }
                });

                resultsDiv.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            resultsDiv.innerHTML = "<p>Error fetching recipes.</p>";
        });
});
